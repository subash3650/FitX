import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { exportDatabase, getDB, importDatabase } from '@/services/database';
import { downloadFromDrive, GOOGLE_CLIENT_IDS, GOOGLE_SCOPES, listBackups, uploadToDrive } from '@/services/google-drive';
import * as Google from 'expo-auth-session/providers/google';
import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, documentDirectory } from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface User {
    name: string;
    email: string;
    height: number;
    starting_weight: number;
    activity_level: string;
    goal: string;
}

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'upload' | 'restore' | null>(null);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: GOOGLE_CLIENT_IDS.android,
        iosClientId: GOOGLE_CLIENT_IDS.ios,
        webClientId: GOOGLE_CLIENT_IDS.web,
        scopes: GOOGLE_SCOPES,
    });

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (response?.type === 'success' && pendingAction) {
            // Type guard for authentication
            if (!response.authentication) return;

            const token = response.authentication.accessToken;
            if (token) {
                if (pendingAction === 'upload') {
                    performDriveUpload(token);
                } else if (pendingAction === 'restore') {
                    fetchBackups(token);
                }
            }
            setPendingAction(null);
        } else if (response?.type === 'error') {
            Alert.alert('Error', 'Google Sign-In failed');
            setPendingAction(null);
        }
    }, [response, pendingAction]);

    const loadUser = async () => {
        try {
            const db = getDB();
            const result = await db.getFirstAsync<User>('SELECT * FROM users LIMIT 1');
            setUser(result || null);
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const handleDriveAction = (action: 'upload' | 'restore') => {
        if (!request) {
            Alert.alert('Error', 'Google Sign-In not initialized');
            return;
        }
        setPendingAction(action);
        promptAsync();
    };

    const performDriveUpload = async (token: string) => {
        setLoading(true);
        try {
            // Export DB to cache first
            await exportDatabase(); // This creates a file in cache, but we need the path.
            // Wait, exportDatabase shares it immediately. We need a way to get the file path without sharing.
            // Let's modify exportDatabase or just manually do it here since we have the logic.

            const dbName = 'fitx.db';
            const docDir = documentDirectory;
            if (!docDir) throw new Error('Document directory not available');
            const dbPath = `${docDir}SQLite/${dbName}`;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_');
            const fileName = `FitX_Backup_${timestamp}.fitx`;

            // We can upload directly from dbPath if we want, but let's follow the service pattern
            await uploadToDrive(token, dbPath, fileName, 'application/octet-stream');

            Alert.alert('Success', 'Backup uploaded to Google Drive successfully!');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to upload to Drive: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBackups = async (token: string) => {
        setLoading(true);
        try {
            const files = await listBackups(token);
            if (files.length === 0) {
                Alert.alert('No Backups', 'No FitX backups found in Drive.');
            } else {
                setBackups(files);
                setShowBackupModal(true);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to list backups: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDriveRestore = async (fileId: string, fileName: string) => {
        // Type guard to ensure response is success before accessing authentication
        if (response?.type !== 'success' || !response.authentication) return;

        const token = response.authentication.accessToken;
        if (!token) return;

        setLoading(true);
        setShowBackupModal(false);
        try {
            const cacheDir = cacheDirectory;
            if (!cacheDir) throw new Error('Cache directory not available');
            const destPath = `${cacheDir}${fileName}`;
            await downloadFromDrive(token, fileId, destPath);
            await importDatabase(destPath);
            Alert.alert('Success', 'Data restored successfully! Please restart the app.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') } // Reload tabs
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to restore backup: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            Alert.alert(
                'Backup Data',
                'Your data will be exported as a file that you can share via WhatsApp, Google Drive, Email, or save to your device.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            try {
                                await exportDatabase();
                            } catch (error: any) {
                                Alert.alert('Error', `Failed to backup data: ${error.message}`);
                            }
                        }
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', `Failed to backup data: ${error.message}`);
        }
    };

    const handleRestore = async () => {
        try {
            Alert.alert(
                'Restore Data',
                'Select a FitX backup file (.fitx or .db) to restore your data.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Select File',
                        onPress: async () => {
                            try {
                                const result = await DocumentPicker.getDocumentAsync({
                                    type: '*/*', // Allow all types as .fitx/.db might not be recognized
                                    copyToCacheDirectory: true
                                });

                                if (result.canceled) return;

                                const fileName = result.assets[0].name || '';
                                if (!fileName.endsWith('.fitx') && !fileName.endsWith('.db')) {
                                    Alert.alert('Invalid File', 'Please select a valid FitX backup file (.fitx or .db)');
                                    return;
                                }

                                Alert.alert(
                                    'Confirm Restore',
                                    'This will replace ALL your current data with the backup. This cannot be undone. Continue?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Restore',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    await importDatabase(result.assets[0].uri);
                                                    Alert.alert('Success', 'Data restored successfully. Please restart the app for changes to take effect.');
                                                } catch (error) {
                                                    Alert.alert('Error', 'Failed to restore data. The file may be corrupted.');
                                                }
                                            }
                                        }
                                    ]
                                );
                            } catch (error) {
                                console.error(error);
                                Alert.alert('Error', 'Failed to pick backup file');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to start restore process');
        }
    };

    const handleResetApp = () => {
        Alert.alert(
            'Reset App',
            'This will delete all data including workouts, food entries, and weight logs. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const db = getDB();
                            await db.execAsync(`
                DELETE FROM workout_sessions;
                DELETE FROM workouts;
                DELETE FROM food_entries;
                DELETE FROM weights;
                DELETE FROM users;
              `);
                            Alert.alert('Success', 'App has been reset', [
                                { text: 'OK', onPress: () => router.replace('/onboarding') }
                            ]);
                        } catch (error) {
                            console.error('Error resetting app:', error);
                            Alert.alert('Error', 'Failed to reset app');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Settings</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* User Profile */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Profile</ThemedText>

                    {user && (
                        <>
                            <View style={[styles.infoRow, { borderBottomColor: theme.icon }]}>
                                <ThemedText style={styles.label}>Name</ThemedText>
                                <ThemedText style={styles.value}>{user.name}</ThemedText>
                            </View>

                            {user.email && (
                                <View style={styles.infoRow}>
                                    <ThemedText style={styles.label}>Email</ThemedText>
                                    <ThemedText style={styles.value}>{user.email}</ThemedText>
                                </View>
                            )}

                            <View style={styles.infoRow}>
                                <ThemedText style={styles.label}>Height</ThemedText>
                                <ThemedText style={styles.value}>{user.height} cm</ThemedText>
                            </View>

                            <View style={styles.infoRow}>
                                <ThemedText style={styles.label}>Starting Weight</ThemedText>
                                <ThemedText style={styles.value}>{user.starting_weight} kg</ThemedText>
                            </View>

                            <View style={styles.infoRow}>
                                <ThemedText style={styles.label}>Activity Level</ThemedText>
                                <ThemedText style={styles.value}>{user.activity_level}</ThemedText>
                            </View>

                            <View style={styles.infoRow}>
                                <ThemedText style={styles.label}>Goal</ThemedText>
                                <ThemedText style={styles.value}>
                                    {user.goal === 'cut' ? 'Lose Weight' : user.goal === 'bulk' ? 'Gain Muscle' : 'Maintain'}
                                </ThemedText>
                            </View>
                        </>
                    )}
                </View>

                {/* Google Drive Sync */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Google Drive Sync</ThemedText>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#0a7ea4', marginBottom: 12 }]}
                        onPress={() => handleDriveAction('upload')}
                    >
                        <ThemedText style={styles.buttonText}>☁️ Upload to Drive</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#0a7ea4' }]}
                        onPress={() => handleDriveAction('restore')}
                    >
                        <ThemedText style={styles.buttonText}>📥 Restore from Drive</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Local Backup */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Local Backup</ThemedText>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#666', marginBottom: 12 }]}
                        onPress={handleBackup}
                    >
                        <ThemedText style={styles.buttonText}>📤 Export & Share File</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#666' }]}
                        onPress={handleRestore}
                    >
                        <ThemedText style={styles.buttonText}>📥 Import File</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* About */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={{ marginBottom: 16 }}>About</ThemedText>

                    <ThemedText style={{ marginBottom: 12 }}>
                        <ThemedText type="defaultSemiBold">FitX</ThemedText> - Fitness & Nutrition Tracker
                    </ThemedText>

                    <ThemedText style={{ marginBottom: 8, opacity: 0.7 }}>
                        Version 1.0.0
                    </ThemedText>

                    <View style={{ marginVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.icon, paddingVertical: 12 }}>
                        <ThemedText style={{ marginBottom: 4 }}>Developed by Subash</ThemedText>
                        <TouchableOpacity onPress={() => Linking.openURL('https://subash-portfolio-six.vercel.app/')}>
                            <ThemedText style={{ color: '#0a7ea4', fontWeight: 'bold' }}>🌐 Visit Portfolio</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.dangerButton, { borderColor: '#ff6b6b' }]}
                        onPress={handleResetApp}
                    >
                        <ThemedText style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Reset All Data</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 12, opacity: 0.5 }}>
                        © 2025 FitX. All rights reserved.
                    </ThemedText>
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
        padding: 20,
        paddingTop: 60,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    label: {
        opacity: 0.7,
    },
    value: {
        fontWeight: '600',
    },
    dangerButton: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    button: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
