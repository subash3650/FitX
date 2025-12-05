import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addFoodEntry, deleteFoodEntry, getDB, getTodayFoodEntries, getTodayTotals } from '@/services/database';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface FoodEntry {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: string;
}

interface DailyTotals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export default function NutritionScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [foods, setFoods] = useState<FoodEntry[]>([]);
    const [totals, setTotals] = useState<DailyTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const entries = await getTodayFoodEntries();
            setFoods(entries as FoodEntry[]);

            const dailyTotals = await getTodayTotals();
            setTotals(dailyTotals);

            // Load user's calorie goal
            const db = getDB();
            const user = await db.getFirstAsync<{ goal: string }>('SELECT goal FROM users LIMIT 1');
            // Goals would be calculated from user data, but for now using defaults
        } catch (error) {
            console.error('Error loading nutrition data:', error);
        }
    };

    const handleAddFood = async () => {
        if (!foodName.trim() || !calories) {
            Alert.alert('Error', 'Please enter food name and calories');
            return;
        }

        try {
            await addFoodEntry(
                foodName,
                parseFloat(calories),
                parseFloat(protein) || 0,
                parseFloat(carbs) || 0,
                parseFloat(fat) || 0
            );

            // Reset form
            setFoodName('');
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setShowAddForm(false);

            loadData();
        } catch (error) {
            console.error('Error adding food:', error);
            Alert.alert('Error', 'Failed to add food entry');
        }
    };

    const handleDeleteFood = async (id: number) => {
        Alert.alert(
            'Delete Entry',
            'Remove this food entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteFoodEntry(id);
                        loadData();
                    },
                },
            ]
        );
    };

    const MacroProgress = ({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) => {
        const percentage = Math.min((current / goal) * 100, 100);
        return (
            <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                    <ThemedText style={styles.macroLabel}>{label}</ThemedText>
                    <ThemedText style={styles.macroValue}>{Math.round(current)}g / {goal}g</ThemedText>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]}>
                    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
                </View>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Nutrition</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Calorie Summary */}
                <View style={[styles.calorieCard, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle">Today's Calories</ThemedText>
                    <View style={styles.calorieDisplay}>
                        <ThemedText type="title" style={{ color: theme.tint, fontSize: 48 }}>
                            {Math.round(totals.calories)}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 20, opacity: 0.6 }}>/ {goals.calories}</ThemedText>
                    </View>
                    <ThemedText style={{ opacity: 0.7, textAlign: 'center' }}>
                        {goals.calories - totals.calories > 0
                            ? `${Math.round(goals.calories - totals.calories)} kcal remaining`
                            : `${Math.round(totals.calories - goals.calories)} kcal over goal`}
                    </ThemedText>
                </View>

                {/* Macros */}
                <View style={styles.macrosCard}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Macros</ThemedText>
                    <MacroProgress label="Protein" current={totals.protein} goal={goals.protein} color="#ff6b6b" />
                    <MacroProgress label="Carbs" current={totals.carbs} goal={goals.carbs} color="#4ecdc4" />
                    <MacroProgress label="Fat" current={totals.fat} goal={goals.fat} color="#ffd93d" />
                </View>

                {/* Add Food Button */}
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.tint }]}
                    onPress={() => setShowAddForm(true)}
                >
                    <ThemedText style={[styles.addButtonText, { color: theme.background }]}>+ Log Food</ThemedText>
                </TouchableOpacity>

                {/* Food Entries */}
                <View style={styles.foodList}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Today's Meals</ThemedText>
                    {foods.map((food) => (
                        <TouchableOpacity
                            key={food.id}
                            style={[styles.foodItem, { backgroundColor: theme.card }]}
                            onLongPress={() => handleDeleteFood(food.id)}
                        >
                            <View style={{ flex: 1 }}>
                                <ThemedText type="defaultSemiBold">{food.name}</ThemedText>
                                <ThemedText style={styles.foodMacros}>
                                    {Math.round(food.calories)} kcal • P: {Math.round(food.protein)}g • C: {Math.round(food.carbs)}g • F: {Math.round(food.fat)}g
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {foods.length === 0 && (
                        <ThemedText style={styles.emptyText}>No food logged today</ThemedText>
                    )}
                </View>
            </ScrollView>

            {/* Add Food Modal */}
            {showAddForm && (
                <View style={[styles.modal, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText type="subtitle">Add Food</ThemedText>
                        <TouchableOpacity onPress={() => setShowAddForm(false)}>
                            <ThemedText style={{ fontSize: 24 }}>×</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.formContent}>
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Food Name *</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={foodName}
                                onChangeText={setFoodName}
                                placeholder="e.g., Chicken Breast"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Calories *</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={calories}
                                onChangeText={setCalories}
                                placeholder="e.g., 165"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Protein (g)</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={protein}
                                onChangeText={setProtein}
                                placeholder="e.g., 30"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Carbs (g)</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={carbs}
                                onChangeText={setCarbs}
                                placeholder="e.g., 0"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Fat (g)</ThemedText>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                                value={fat}
                                onChangeText={setFat}
                                placeholder="e.g., 5"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.tint }]}
                            onPress={handleAddFood}
                        >
                            <ThemedText style={[styles.submitButtonText, { color: theme.background }]}>Add Food</ThemedText>
                        </TouchableOpacity>
                    </ScrollView>
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
        padding: 20,
        paddingTop: 60,
    },
    scrollContent: {
        padding: 20,
    },
    calorieCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    calorieDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginVertical: 12,
    },
    macrosCard: {
        marginBottom: 20,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    macroItem: {
        marginBottom: 16,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    macroLabel: {
        fontSize: 14,
    },
    macroValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    addButton: {
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 20,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    foodList: {
        marginBottom: 20,
    },
    foodItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
    },
    foodMacros: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 4,
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
        marginBottom: 20,
    },
    formContent: {
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        marginBottom: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
