import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB } from '@/services/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface WorkoutExercise {
    exercise_id: number;
    name: string;
    sets: number;
    reps: number;
    order: number;
}

interface SetLog {
    reps: number;
    weight: number;
    completed: boolean;
}

export default function ActiveWorkoutScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [workoutTitle, setWorkoutTitle] = useState('');
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [setLogs, setSetLogs] = useState<Record<number, SetLog[]>>({});
    const [startTime] = useState(new Date());

    useEffect(() => {
        loadWorkout();
    }, [id]);

    const loadWorkout = async () => {
        try {
            const db = getDB();
            const workout = await db.getFirstAsync<{ title: string; exercises: string }>(
                'SELECT title, exercises FROM workouts WHERE id = ?',
                [parseInt(Array.isArray(id) ? id[0] : id)]
            );
            if (workout) {
                setWorkoutTitle(workout.title);
                const exs = JSON.parse(workout.exercises) as WorkoutExercise[];
                setExercises(exs);

                // Initialize set logs
                const logs: Record<number, SetLog[]> = {};
                exs.forEach((ex, idx) => {
                    logs[idx] = Array(ex.sets).fill(null).map(() => ({
                        reps: ex.reps,
                        weight: 0,
                        completed: false,
                    }));
                });
                setSetLogs(logs);
            }
        } catch (error) {
            console.error('Error loading workout:', error);
        }
    };

    const updateSet = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: string) => {
        const updated = { ...setLogs };
        updated[exerciseIdx][setIdx] = {
            ...updated[exerciseIdx][setIdx],
            [field]: parseInt(value) || 0,
        };
        setSetLogs(updated);
    };

    const toggleSetCompletion = (exerciseIdx: number, setIdx: number) => {
        const updated = { ...setLogs };
        updated[exerciseIdx][setIdx] = {
            ...updated[exerciseIdx][setIdx],
            completed: !updated[exerciseIdx][setIdx].completed,
        };
        setSetLogs(updated);
    };

    const finishWorkout = async () => {
        const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

        const completedExercises = exercises.map((ex, idx) => ({
            ...ex,
            sets_performed: setLogs[idx],
        }));

        try {
            const db = getDB();
            await db.runAsync(
                'INSERT INTO workout_sessions (workout_id, date, duration_seconds, exercises_done, calories_burned) VALUES (?, ?, ?, ?, ?)',
                [parseInt(Array.isArray(id) ? id[0] : id), new Date().toISOString(), duration, JSON.stringify(completedExercises), 0]
            );
            Alert.alert('Success', 'Workout completed!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error saving workout session:', error);
            Alert.alert('Error', 'Failed to save workout');
        }
    };

    if (exercises.length === 0) return null;

    const currentExercise = exercises[currentExerciseIndex];
    const currentSets = setLogs[currentExerciseIndex] || [];

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.right" size={24} color={theme.text} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <ThemedText type="subtitle">{workoutTitle}</ThemedText>
                <TouchableOpacity onPress={finishWorkout}>
                    <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>Finish</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.progressBar}>
                    {exercises.map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.progressSegment,
                                { backgroundColor: idx <= currentExerciseIndex ? theme.tint : '#333' },
                            ]}
                        />
                    ))}
                </View>

                <ThemedText type="title" style={styles.exerciseTitle}>{currentExercise.name}</ThemedText>
                <ThemedText style={styles.exerciseCount}>
                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                </ThemedText>

                <View style={styles.setsContainer}>
                    {currentSets.map((set, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.setRow,
                                { backgroundColor: theme.card },
                                set.completed && { opacity: 0.6 },
                            ]}
                        >
                            <ThemedText style={styles.setNumber}>Set {idx + 1}</ThemedText>

                            <View style={styles.setInputs}>
                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.inputLabel}>Reps</ThemedText>
                                    <TextInput
                                        style={[styles.setInput, { color: theme.text, borderColor: theme.icon }]}
                                        value={set.reps.toString()}
                                        onChangeText={(val) => updateSet(currentExerciseIndex, idx, 'reps', val)}
                                        keyboardType="numeric"
                                        editable={!set.completed}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.inputLabel}>Weight (kg)</ThemedText>
                                    <TextInput
                                        style={[styles.setInput, { color: theme.text, borderColor: theme.icon }]}
                                        value={set.weight.toString()}
                                        onChangeText={(val) => updateSet(currentExerciseIndex, idx, 'weight', val)}
                                        keyboardType="numeric"
                                        editable={!set.completed}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.checkButton, { borderColor: theme.icon }, set.completed && { backgroundColor: theme.tint }]}
                                onPress={() => toggleSetCompletion(currentExerciseIndex, idx)}
                            >
                                {set.completed && <ThemedText style={{ color: '#fff' }}>✓</ThemedText>}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.navigationButtons}>
                    {currentExerciseIndex > 0 && (
                        <TouchableOpacity
                            style={[styles.navButton, { borderColor: theme.icon }]}
                            onPress={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
                        >
                            <ThemedText>Previous Exercise</ThemedText>
                        </TouchableOpacity>
                    )}

                    {currentExerciseIndex < exercises.length - 1 && (
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: theme.tint }]}
                            onPress={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                        >
                            <ThemedText style={{ color: '#fff' }}>Next Exercise</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    scrollContent: {
        padding: 20,
    },
    progressBar: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 30,
    },
    progressSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    exerciseTitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    exerciseCount: {
        textAlign: 'center',
        opacity: 0.6,
        marginBottom: 30,
    },
    setsContainer: {
        marginBottom: 30,
    },
    setRow: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    setNumber: {
        width: 60,
        fontWeight: 'bold',
    },
    setInputs: {
        flex: 1,
        flexDirection: 'row',
        gap: 10,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 10,
        marginBottom: 4,
        opacity: 0.6,
    },
    setInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        textAlign: 'center',
    },
    checkButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    navigationButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    navButton: {
        flex: 1,
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
        borderWidth: 1,
    },
});
