import { cacheDirectory, copyAsync, deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, readDirectoryAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { DEFAULT_EXERCISES } from './exercises-data';

const db = SQLite.openDatabaseSync('fitx.db');

export const getDB = () => db;

export const initDatabase = async () => {
    try {
        await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        dob TEXT,
        gender TEXT,
        height REAL,
        starting_weight REAL,
        activity_level TEXT,
        goal TEXT,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        category TEXT,
        muscles TEXT,
        equipment TEXT,
        default_sets INTEGER,
        default_reps INTEGER,
        is_timed INTEGER DEFAULT 0,
        demo_video_url TEXT,
        cues TEXT,
        is_favorite INTEGER DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        note TEXT
      );
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        exercises TEXT,
        is_template INTEGER DEFAULT 0,
        created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER,
        date TEXT,
        duration_seconds INTEGER,
        exercises_done TEXT,
        calories_burned INTEGER,
        FOREIGN KEY (workout_id) REFERENCES workouts (id)
      );
      CREATE TABLE IF NOT EXISTS food_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        calories INTEGER,
        protein INTEGER,
        carbs INTEGER,
        fat INTEGER,
        timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight REAL,
        timestamp TEXT,
        note TEXT
      );
    `);

        // Migration: Check if is_custom column exists in exercises table
        try {
            const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
            const hasIsCustom = tableInfo.some(col => col.name === 'is_custom');

            if (!hasIsCustom) {
                console.log('Adding is_custom column to exercises table...');
                await db.execAsync('ALTER TABLE exercises ADD COLUMN is_custom INTEGER DEFAULT 0');
            }
        } catch (error) {
            console.error('Error checking/adding is_custom column:', error);
        }

        // Migration: Check if workouts table has new schema
        try {
            const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(workouts)');
            const hasTitle = tableInfo.some(col => col.name === 'title');
            const hasExercises = tableInfo.some(col => col.name === 'exercises');

            if (!hasTitle || !hasExercises) {
                console.log('Migrating workouts table...');
                // Drop old table and recreate (since we can't easily alter to add multiple columns with data preservation in this specific case without more complex logic, and old data was likely broken/unused if it crashed)
                // Alternatively, we can try to add columns.
                if (!hasTitle) await db.execAsync('ALTER TABLE workouts ADD COLUMN title TEXT');
                if (!hasExercises) await db.execAsync('ALTER TABLE workouts ADD COLUMN exercises TEXT');
                const hasIsTemplate = tableInfo.some(col => col.name === 'is_template');
                if (!hasIsTemplate) await db.execAsync('ALTER TABLE workouts ADD COLUMN is_template INTEGER DEFAULT 0');
                const hasCreatedAt = tableInfo.some(col => col.name === 'created_at');
                if (!hasCreatedAt) await db.execAsync('ALTER TABLE workouts ADD COLUMN created_at TEXT');
            }
        } catch (error) {
            console.error('Error migrating workouts table:', error);
        }

        // Migration: Check if workout_sessions table has new schema
        try {
            const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(workout_sessions)');
            const hasExercisesDone = tableInfo.some(col => col.name === 'exercises_done');

            if (!hasExercisesDone) {
                console.log('Migrating workout_sessions table...');
                const hasDate = tableInfo.some(col => col.name === 'date');
                if (!hasDate) await db.execAsync('ALTER TABLE workout_sessions ADD COLUMN date TEXT');

                const hasDuration = tableInfo.some(col => col.name === 'duration_seconds');
                if (!hasDuration) await db.execAsync('ALTER TABLE workout_sessions ADD COLUMN duration_seconds INTEGER');

                await db.execAsync('ALTER TABLE workout_sessions ADD COLUMN exercises_done TEXT');

                const hasCalories = tableInfo.some(col => col.name === 'calories_burned');
                if (!hasCalories) await db.execAsync('ALTER TABLE workout_sessions ADD COLUMN calories_burned INTEGER');
            }
        } catch (error) {
            console.error('Error migrating workout_sessions table:', error);
        }

        // Seed exercises if table is empty
        const exerciseCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
        if (exerciseCount && exerciseCount.count === 0) {
            console.log('Seeding default exercises...');
            for (const exercise of DEFAULT_EXERCISES) {
                await db.runAsync(
                    `INSERT INTO exercises (name, category, muscles, equipment, default_sets, default_reps, is_timed, is_custom)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [exercise.name, exercise.category, exercise.muscles, exercise.equipment, 3, 10, 0, 0]
                );
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Exercise helpers
export const getAllExercises = async () => {
    return await db.getAllAsync('SELECT * FROM exercises ORDER BY name');
};

export const getExercisesByCategory = async (category: string) => {
    return await db.getAllAsync('SELECT * FROM exercises WHERE category = ? ORDER BY name', [category]);
};

export const searchExercises = async (query: string) => {
    return await db.getAllAsync(
        'SELECT * FROM exercises WHERE name LIKE ? OR muscles LIKE ? ORDER BY name',
        [`%${query}%`, `%${query}%`]
    );
};

export const toggleFavorite = async (id: number, isFavorite: number) => {
    await db.runAsync('UPDATE exercises SET is_favorite = ? WHERE id = ?', [isFavorite ? 0 : 1, id]);
};

export const getFavoriteExercises = async () => {
    return await db.getAllAsync('SELECT * FROM exercises WHERE is_favorite = 1 ORDER BY name');
};

// Nutrition helpers
export const addFoodEntry = async (name: string, calories: number, protein: number, carbs: number, fat: number) => {
    await db.runAsync(
        'INSERT INTO food_entries (name, calories, protein, carbs, fat, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [name, calories, protein, carbs, fat, new Date().toISOString()]
    );
};

export const getTodayFoodEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    return await db.getAllAsync(
        `SELECT * FROM food_entries WHERE date(timestamp) = date(?) ORDER BY timestamp DESC`,
        [today]
    );
};

export const getTodayTotals = async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.getFirstAsync<{ calories: number; protein: number; carbs: number; fat: number }>(
        `SELECT 
            COALESCE(SUM(calories), 0) as calories,
            COALESCE(SUM(protein), 0) as protein, 
            COALESCE(SUM(carbs), 0) as carbs,
            COALESCE(SUM(fat), 0) as fat
         FROM food_entries 
         WHERE date(timestamp) = date(?)`,
        [today]
    );
    return result || { calories: 0, protein: 0, carbs: 0, fat: 0 };
};

export const deleteFoodEntry = async (id: number) => {
    await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
};

// Weight tracking helpers
export const addWeightEntry = async (weight: number, note?: string) => {
    await db.runAsync(
        'INSERT INTO weights (weight, timestamp, note) VALUES (?, ?, ?)',
        [weight, new Date().toISOString(), note || '']
    );
};

export const getWeightHistory = async (limit = 30) => {
    return await db.getAllAsync(
        'SELECT * FROM weights ORDER BY timestamp DESC LIMIT ?',
        [limit]
    );
};

export const getLatestWeight = async () => {
    return await db.getFirstAsync<{ weight: number; timestamp: string }>(
        'SELECT weight, timestamp FROM weights ORDER BY timestamp DESC LIMIT 1'
    );
};

export const exportDatabase = async () => {
    const dbName = 'fitx.db';
    const dbPath = `${documentDirectory}SQLite/${dbName}`;
    const backupPath = `${cacheDirectory}fitx_backup_${new Date().toISOString().split('T')[0]}.db`;

    try {
        console.log('Attempting to export DB from:', dbPath);
        const fileInfo = await getInfoAsync(dbPath);

        if (!fileInfo.exists) {
            console.log('DB file not found at expected path. Listing document directory...');
            const files = await readDirectoryAsync(documentDirectory as string);
            console.log('Document Directory files:', files);

            const sqliteDir = `${documentDirectory}SQLite`;
            const sqliteDirInfo = await getInfoAsync(sqliteDir);
            if (sqliteDirInfo.exists) {
                const sqliteFiles = await readDirectoryAsync(sqliteDir);
                console.log('SQLite Directory files:', sqliteFiles);
            }

            throw new Error(`Database file not found at ${dbPath}`);
        }

        await copyAsync({
            from: dbPath,
            to: backupPath
        });

        await Sharing.shareAsync(backupPath, {
            mimeType: 'application/x-sqlite3',
            dialogTitle: 'Backup FitX Data'
        });
    } catch (error) {
        console.error('Error exporting database:', error);
        throw error;
    }
};

export const importDatabase = async (sourceUri: string) => {
    const dbName = 'fitx.db';
    const dbPath = `${documentDirectory}SQLite/${dbName}`;

    try {
        // Ensure SQLite directory exists
        const dirInfo = await getInfoAsync(`${documentDirectory}SQLite`);
        if (!dirInfo.exists) {
            await makeDirectoryAsync(`${documentDirectory}SQLite`);
        }

        // Delete existing DB
        await deleteAsync(dbPath, { idempotent: true });

        // Copy new DB
        await copyAsync({
            from: sourceUri,
            to: dbPath
        });

        return true;
    } catch (error) {
        console.error('Error importing database:', error);
        throw error;
    }
};
