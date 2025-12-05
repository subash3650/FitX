import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { exportDatabase, getDB, importDatabase } from '@/services/database';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const db = getDB();
            const result = await db.getFirstAsync<User>('SELECT * FROM users LIMIT 1');
            setUser(result || null);
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const handleBackup = async () => {
        try {
            await exportDatabase();
        } catch (error: any) {
            Alert.alert('Error', `Failed to backup data: ${error.message}`);
        }
    };

    const handleRestore = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all types as .db might not be recognized
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            Alert.alert(
                'Restore Data',
                'This will replace your current data with the backup. Are you sure?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Restore',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await importDatabase(result.assets[0].uri);
                                Alert.alert('Success', 'Data restored successfully. Please restart the app.');
                            } catch (error) {
                                Alert.alert('Error', 'Failed to restore data');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to pick backup file');
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

                {/* Data Backup */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Data Backup</ThemedText>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.tint, marginBottom: 12 }]}
                        onPress={handleBackup}
                    >
                        <ThemedText style={[styles.buttonText, { color: theme.background }]}>☁️ Backup to Drive</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#888' }]}
                        onPress={handleRestore}
                    >
                        <ThemedText style={styles.buttonText}>📥 Restore from Backup</ThemedText>
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
