import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB } from '@/services/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function QuickLogScreen() {
    const { exerciseId, exerciseName, isTimed } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const isTimedExercise = isTimed === '1' || isTimed === 'true';

    const [sets, setSets] = useState('3');
    const [reps, setReps] = useState('10');
    const [weight, setWeight] = useState('');
    const [duration, setDuration] = useState(''); // For timed exercises (in seconds)

    const handleSave = async () => {
        if (isTimedExercise) {
            if (!sets || !duration) {
                Alert.alert('Error', 'Please enter sets and duration');
                return;
            }
        } else {
            if (!sets || !reps) {
                Alert.alert('Error', 'Please enter sets and reps');
                return;
            }
        }

        try {
            const db = getDB();
            const workoutData = {
                exercise_id: exerciseId,
                name: exerciseName,
                sets: parseInt(sets),
                reps: isTimedExercise ? 0 : parseInt(reps),
                weight: parseFloat(weight) || 0,
                duration: isTimedExercise ? parseInt(duration) : 0,
                is_timed: isTimedExercise,
            };

            // Save as a quick workout session
            await db.runAsync(
                `INSERT INTO workout_sessions (workout_id, date, duration_seconds, exercises_done, calories_burned) 
         VALUES (?, ?, ?, ?, ?)`,
                [0, new Date().toISOString(), 0, JSON.stringify([workoutData]), 0]
            );

            Alert.alert('Success', 'Workout logged!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error saving workout:', error);
            Alert.alert('Error', 'Failed to save workout');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.right" size={24} color={theme.text} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <ThemedText type="subtitle">Quick Log</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedText type="title" style={styles.exerciseTitle}>{exerciseName}</ThemedText>

                {isTimedExercise ? (
                    <>
                        <ThemedText style={styles.subtitle}>⏱️ Time-Based Exercise</ThemedText>
                        <ThemedText style={[styles.subtitle, { fontSize: 12, marginTop: -20 }]}>
                            How long did you hold it?
                        </ThemedText>
                    </>
                ) : (
                    <ThemedText style={styles.subtitle}>How many did you do?</ThemedText>
                )}

                <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Sets</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={sets}
                            onChangeText={setSets}
                            keyboardType="numeric"
                            placeholder="3"
                            placeholderTextColor="#888"
                        />
                    </View>

                    {isTimedExercise ? (
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Duration (sec)</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                                placeholder="30"
                                placeholderTextColor="#888"
                            />
                        </View>
                    ) : (
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Reps</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={reps}
                                onChangeText={setReps}
                                keyboardType="numeric"
                                placeholder="10"
                                placeholderTextColor="#888"
                            />
                        </View>
                    )}
                </View>

                {!isTimedExercise && (
                    <View style={styles.inputGroup}>
                        <ThemedText style={styles.inputLabel}>Weight (kg) - Optional</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor="#888"
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.tint }]}
                    onPress={handleSave}
                >
                    <ThemedText style={[styles.saveButtonText, { color: theme.background }]}>Save Workout</ThemedText>
                </TouchableOpacity>
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
    exerciseTitle: {
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        opacity: 0.7,
        marginBottom: 30,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 16,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    saveButton: {
        marginTop: 30,
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
