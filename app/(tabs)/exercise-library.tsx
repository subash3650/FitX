import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllExercises, getDB, searchExercises } from '@/services/database';
import { EXERCISE_CATEGORIES } from '@/services/exercises-data';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface Exercise {
    id: number;
    name: string;
    category: string;
    muscles: string;
    equipment: string;
    default_sets: number;
    default_reps: number;
    is_timed: number;
    is_favorite: number;
}

export default function ExerciseLibraryScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Exercise form states
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newCategory, setNewCategory] = useState('Strength');
    const [newMuscles, setNewMuscles] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    const [isTimed, setIsTimed] = useState(false);

    useEffect(() => {
        loadExercises();
    }, []);

    useEffect(() => {
        filterExercises();
    }, [selectedCategory, exercises]);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const data = await getAllExercises();
            setExercises(data as Exercise[]);
            setFilteredExercises(data as Exercise[]);
        } catch (error) {
            console.error('Error loading exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterExercises = () => {
        if (selectedCategory === 'All') {
            setFilteredExercises(exercises);
        } else {
            setFilteredExercises(exercises.filter(ex => ex.category === selectedCategory));
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            filterExercises();
        } else {
            const results = await searchExercises(query);
            setFilteredExercises(results as Exercise[]);
        }
    };

    const handleAddExercise = async () => {
        if (!newExerciseName.trim()) {
            Alert.alert('Error', 'Please enter exercise name');
            return;
        }

        try {
            const db = getDB();
            await db.runAsync(
                `INSERT INTO exercises (name, category, muscles, equipment, default_sets, default_reps, is_timed, is_custom)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [newExerciseName.trim(), newCategory, newMuscles.trim(), newEquipment.trim(), 3, 10, isTimed ? 1 : 0, 1]
            );

            Alert.alert('Success', 'Exercise added successfully!');
            setShowAddModal(false);
            const categoryToSelect = newCategory; // Store before reset
            resetForm();
            await loadExercises();
            setSelectedCategory(categoryToSelect); // Switch to new category
        } catch (error) {
            console.error('Error adding exercise:', error);
            Alert.alert('Error', 'Failed to add exercise');
        }
    };

    const resetForm = () => {
        setNewExerciseName('');
        setNewCategory('Strength');
        setNewMuscles('');
        setNewEquipment('');
        setIsTimed(false);
    };

    const categories = ['All', ...Object.values(EXERCISE_CATEGORIES)];

    const renderExerciseCard = ({ item }: { item: Exercise }) => (
        <TouchableOpacity
            style={[styles.exerciseCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/workout/quick-log?exerciseId=${item.id}&exerciseName=${encodeURIComponent(item.name)}&isTimed=${item.is_timed}`)}
        >
            <View style={styles.cardContent}>
                <View style={styles.exerciseInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.exerciseName}>{item.name}</ThemedText>
                    <ThemedText style={styles.exerciseMeta}>{item.category}</ThemedText>
                    <ThemedText style={[styles.exerciseMeta, { fontSize: 12 }]}>{item.muscles}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>Log →</ThemedText>
                    {item.is_timed === 1 && (
                        <ThemedText style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>⏱️ Timed</ThemedText>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.fixedHeader}>
                <View style={styles.header}>
                    <ThemedText type="title">Pick an Exercise</ThemedText>
                    <ThemedText style={{ opacity: 0.7, marginTop: 4, fontSize: 14 }}>
                        Tap any exercise to log it
                    </ThemedText>

                    <View style={styles.searchRow}>
                        <TextInput
                            style={[styles.searchInput, {
                                color: theme.text,
                                borderColor: theme.icon,
                                backgroundColor: theme.card
                            }]}
                            placeholder="Search exercises..."
                            placeholderTextColor="#888"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.tint }]}
                            onPress={() => setShowAddModal(true)}
                        >
                            <ThemedText style={[styles.addButtonText, { color: theme.background }]}>+</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.categoriesWrapper}>
                    <FlatList
                        horizontal
                        data={categories}
                        keyExtractor={(item) => item}
                        contentContainerStyle={styles.categoryList}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    {
                                        borderColor: selectedCategory === item ? theme.tint : theme.icon,
                                        backgroundColor: selectedCategory === item ? theme.tint : 'transparent'
                                    }
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <ThemedText style={[
                                    styles.categoryText,
                                    { color: selectedCategory === item ? '#fff' : theme.text },
                                    selectedCategory === item && styles.selectedCategoryText
                                ]}>
                                    {item}
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>

            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderExerciseCard}
                contentContainerStyle={styles.listContent}
                style={styles.exerciseList}
                ListEmptyComponent={
                    <ThemedText style={styles.emptyText}>No exercises found</ThemedText>
                }
            />

            {/* Add Exercise Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="subtitle">Add Custom Exercise</ThemedText>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <ThemedText style={{ fontSize: 24 }}>✕</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.formScrollView}
                            contentContainerStyle={styles.formContentContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <ThemedText style={styles.label}>Exercise Name *</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    color: theme.text,
                                    borderColor: theme.icon,
                                    backgroundColor: theme.card
                                }]}
                                placeholder="e.g., Bicep Curls"
                                placeholderTextColor="#888"
                                value={newExerciseName}
                                onChangeText={setNewExerciseName}
                            />

                            <ThemedText style={styles.label}>Category</ThemedText>
                            <View style={styles.categoryGrid}>
                                {Object.values(EXERCISE_CATEGORIES).map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryOption,
                                            {
                                                borderColor: newCategory === cat ? theme.tint : theme.icon,
                                                backgroundColor: newCategory === cat ? theme.tint : 'transparent'
                                            }
                                        ]}
                                        onPress={() => setNewCategory(cat)}
                                    >
                                        <ThemedText style={[
                                            styles.categoryOptionText,
                                            { color: newCategory === cat ? '#fff' : theme.text },
                                            newCategory === cat && { color: '#fff' }
                                        ]}>
                                            {cat}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <ThemedText style={styles.label}>Muscles Targeted</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    color: theme.text,
                                    borderColor: theme.icon,
                                    backgroundColor: theme.card
                                }]}
                                placeholder="e.g., Biceps, Triceps"
                                placeholderTextColor="#888"
                                value={newMuscles}
                                onChangeText={setNewMuscles}
                            />

                            <ThemedText style={styles.label}>Equipment</ThemedText>
                            <TextInput
                                style={[styles.input, {
                                    color: theme.text,
                                    borderColor: theme.icon,
                                    backgroundColor: theme.card
                                }]}
                                placeholder="e.g., Dumbbell, Barbell"
                                placeholderTextColor="#888"
                                value={newEquipment}
                                onChangeText={setNewEquipment}
                            />

                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setIsTimed(!isTimed)}
                            >
                                <View style={[styles.checkbox, isTimed && { backgroundColor: theme.tint }]}>
                                    {isTimed && <ThemedText style={{ color: '#fff' }}>✓</ThemedText>}
                                </View>
                                <ThemedText>Time-based exercise (e.g., Plank)</ThemedText>
                            </TouchableOpacity>
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#666' }]}
                                onPress={() => setShowAddModal(false)}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                                onPress={handleAddExercise}
                            >
                                <ThemedText style={{ color: theme.background, fontWeight: 'bold' }}>Add Exercise</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fixedHeader: {
        paddingBottom: 10,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    categoriesWrapper: {
        paddingBottom: 5,
    },
    exerciseList: {
        flex: 1,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
    },
    categoryList: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    categoryChip: {
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    selectedCategoryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
    },
    exerciseCard: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        marginBottom: 4,
    },
    exerciseMeta: {
        opacity: 0.7,
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    formScrollView: {
        marginBottom: 20,
    },
    formContentContainer: {
        paddingBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryOption: {
        borderWidth: 2,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    categoryOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        gap: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#666',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
});
