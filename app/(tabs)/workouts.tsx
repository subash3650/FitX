import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB } from '@/services/database';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Workout {
    id: number;
    title: string;
    exercises: string;
    created_at: string;
    is_template: number;
}

export default function WorkoutsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadWorkouts();
    }, []);

    const loadWorkouts = async () => {
        try {
            const db = getDB();
            const result = await db.getAllAsync<Workout>('SELECT * FROM workouts WHERE is_template = 1 ORDER BY created_at DESC');
            setWorkouts(result);
        } catch (error) {
            console.error('Error loading workouts:', error);
        }
    };

    const deleteWorkout = async (id: number) => {
        Alert.alert(
            'Delete Workout',
            'Are you sure you want to delete this workout template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const db = getDB();
                            await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
                            loadWorkouts();
                        } catch (error) {
                            console.error('Error deleting workout:', error);
                        }
                    },
                },
            ]
        );
    };

    const renderWorkoutCard = ({ item }: { item: Workout }) => {
        const exercises = JSON.parse(item.exercises);
        return (
            <TouchableOpacity
                style={[styles.workoutCard, { backgroundColor: theme.card }]}
                onPress={() => router.push(`/workout/${item.id}`)}
                onLongPress={() => deleteWorkout(item.id)}
            >
                <ThemedText type="defaultSemiBold" style={styles.workoutTitle}>
                    {item.title}
                </ThemedText>
                <ThemedText style={styles.workoutMeta}>
                    {exercises.length} exercises
                </ThemedText>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">My Workouts</ThemedText>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: theme.tint }]}
                    onPress={() => router.push('/workout/create')}
                >
                    <ThemedText style={[styles.createButtonText, { color: theme.background }]}>+ New Workout</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={workouts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderWorkoutCard}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyText}>No workout templates yet</ThemedText>
                        <ThemedText style={styles.emptySubtext}>Create your first workout to get started</ThemedText>
                    </View>
                }
            />
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
    createButton: {
        marginTop: 15,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        padding: 20,
    },
    workoutCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    workoutTitle: {
        marginBottom: 6,
        fontSize: 18,
    },
    workoutMeta: {
        opacity: 0.7,
        fontSize: 14,
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        opacity: 0.5,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        opacity: 0.4,
    },
});
