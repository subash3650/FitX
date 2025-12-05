import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllExercises, getDB } from '@/services/database';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface Exercise {
    id: number;
    name: string;
    category: string;
    default_sets: number;
    default_reps: number;
    is_timed: number;
}

interface WorkoutExercise {
    exercise_id: number;
    name: string;
    sets: number;
    reps: number;
    order: number;
}

export default function CreateWorkoutScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [title, setTitle] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [showExercises, setShowExercises] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadAvailableExercises = async () => {
        try {
            const exercises = await getAllExercises();
            setAvailableExercises(exercises as Exercise[]);
            setShowExercises(true);
        } catch (error) {
            console.error('Error loading exercises:', error);
        }
    };

    const addExercise = (exercise: Exercise) => {
        const newExercise: WorkoutExercise = {
            exercise_id: exercise.id,
            name: exercise.name,
            sets: exercise.default_sets,
            reps: exercise.default_reps,
            order: selectedExercises.length,
        };
        setSelectedExercises([...selectedExercises, newExercise]);
        setShowExercises(false);
        setSearchQuery('');
    };

    const removeExercise = (index: number) => {
        const updated = selectedExercises.filter((_, i) => i !== index);
        setSelectedExercises(updated.map((ex, i) => ({ ...ex, order: i })));
    };

    const updateExercise = (index: number, field: 'sets' | 'reps', value: string) => {
        const updated = [...selectedExercises];
        updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
        setSelectedExercises(updated);
    };

    const saveWorkout = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a workout title');
            return;
        }
        if (selectedExercises.length === 0) {
            Alert.alert('Error', 'Please add at least one exercise');
            return;
        }

        try {
            const db = getDB();
            await db.runAsync(
                'INSERT INTO workouts (title, exercises, is_template, created_at) VALUES (?, ?, ?, ?)',
                [title, JSON.stringify(selectedExercises), 1, new Date().toISOString()]
            );
            Alert.alert('Success', 'Workout created successfully');
            router.back();
        } catch (error) {
            console.error('Error saving workout:', error);
            Alert.alert('Error', 'Failed to save workout');
        }
    };

    const filteredExercises = availableExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.right" size={24} color={theme.text} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <ThemedText type="subtitle">Create Workout</ThemedText>
                <TouchableOpacity onPress={saveWorkout}>
                    <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>Save</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <ThemedText type="defaultSemiBold">Workout Name</ThemedText>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g., Upper Body Day"
                        placeholderTextColor="#888"
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="defaultSemiBold">Exercises ({selectedExercises.length})</ThemedText>
                        <TouchableOpacity onPress={loadAvailableExercises}>
                            <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>+ Add Exercise</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {selectedExercises.map((exercise, index) => (
                        <View key={index} style={[styles.exerciseItem, { backgroundColor: theme.card }]}>
                            <View style={styles.exerciseHeader}>
                                <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>{exercise.name}</ThemedText>
                                <TouchableOpacity onPress={() => removeExercise(index)}>
                                    <ThemedText style={{ color: '#ff6b6b' }}>Remove</ThemedText>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.exerciseInputs}>
                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.inputLabel}>Sets</ThemedText>
                                    <TextInput
                                        style={[styles.smallInput, { color: theme.text, borderColor: theme.icon }]}
                                        value={exercise.sets.toString()}
                                        onChangeText={(val) => updateExercise(index, 'sets', val)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.inputLabel}>Reps</ThemedText>
                                    <TextInput
                                        style={[styles.smallInput, { color: theme.text, borderColor: theme.icon }]}
                                        value={exercise.reps.toString()}
                                        onChangeText={(val) => updateExercise(index, 'reps', val)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>
                    ))}

                    {selectedExercises.length === 0 && (
                        <ThemedText style={styles.emptyText}>No exercises added yet</ThemedText>
                    )}
                </View>
            </ScrollView>

            {showExercises && (
                <View style={[styles.modal, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText type="subtitle">Select Exercise</ThemedText>
                        <TouchableOpacity onPress={() => setShowExercises(false)}>
                            <ThemedText style={{ fontSize: 24 }}>×</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                        placeholder="Search exercises..."
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={filteredExercises}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.exerciseOption, { borderBottomColor: theme.icon }]}
                                onPress={() => addExercise(item)}
                            >
                                <ThemedText>{item.name}</ThemedText>
                                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>{item.category}</ThemedText>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
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
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        fontSize: 16,
    },
    exerciseItem: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    exerciseInputs: {
        flexDirection: 'row',
        gap: 15,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 5,
        opacity: 0.7,
    },
    smallInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.5,
        marginTop: 20,
    },
    modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
        paddingTop: 60,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    exerciseOption: {
        padding: 15,
        borderBottomWidth: 1,
    },
});
