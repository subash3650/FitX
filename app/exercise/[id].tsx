import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB, toggleFavorite } from '@/services/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Exercise {
    id: number;
    name: string;
    category: string;
    muscles: string;
    equipment: string;
    default_sets: number;
    default_reps: number;
    is_timed: number;
    demo_video_url: string;
    cues: string;
    is_favorite: number;
}

export default function ExerciseDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExercise();
    }, [id]);

    const loadExercise = async () => {
        try {
            const db = getDB();
            const result = await db.getFirstAsync<Exercise>(
                'SELECT * FROM exercises WHERE id = ?',
                [parseInt(Array.isArray(id) ? id[0] : id)]
            );
            if (result) {
                setExercise(result);
            }
        } catch (error) {
            console.error('Error loading exercise:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!exercise) return;
        await toggleFavorite(exercise.id, exercise.is_favorite);
        setExercise({ ...exercise, is_favorite: exercise.is_favorite ? 0 : 1 });
    };

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator size="large" color={theme.tint} />
            </ThemedView>
        );
    }

    if (!exercise) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText>Exercise not found</ThemedText>
            </ThemedView>
        );
    }

    const cues = JSON.parse(exercise.cues) as string[];

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.right" size={24} color={theme.text} style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleFavorite}>
                    <IconSymbol
                        name="heart.fill"
                        size={28}
                        color={exercise.is_favorite ? '#ff6b6b' : theme.icon}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedText type="title" style={styles.title}>{exercise.name}</ThemedText>

                <View style={styles.metaContainer}>
                    <View style={[styles.metaBadge, { backgroundColor: theme.tint }]}>
                        <ThemedText style={[styles.metaBadgeText, { color: theme.background }]}>{exercise.category}</ThemedText>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle">Muscles Worked</ThemedText>
                    <ThemedText style={styles.sectionText}>{exercise.muscles}</ThemedText>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle">Equipment</ThemedText>
                    <ThemedText style={styles.sectionText}>{exercise.equipment}</ThemedText>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle">Recommended Sets × Reps</ThemedText>
                    <ThemedText style={styles.sectionText}>
                        {exercise.default_sets} sets × {exercise.default_reps} {exercise.is_timed ? 'seconds' : 'reps'}
                    </ThemedText>
                </View>

                <View style={styles.section}>
                    <ThemedText type="subtitle">Form Cues</ThemedText>
                    {cues.map((cue, index) => (
                        <View key={index} style={styles.cueItem}>
                            <ThemedText style={styles.cueNumber}>{index + 1}.</ThemedText>
                            <ThemedText style={styles.cueText}>{cue}</ThemedText>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.tint }]}
                    onPress={() => {
                        // TODO: Add to workout
                        router.back();
                    }}
                >
                    <ThemedText style={[styles.addButtonText, { color: theme.background }]}>Add to Workout</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    backButton: {
        padding: 8,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
    },
    title: {
        marginBottom: 15,
    },
    metaContainer: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    metaBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    metaBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 25,
    },
    sectionText: {
        marginTop: 8,
        opacity: 0.8,
        lineHeight: 22,
    },
    cueItem: {
        flexDirection: 'row',
        marginTop: 10,
    },
    cueNumber: {
        fontWeight: 'bold',
        marginRight: 8,
        minWidth: 20,
    },
    cueText: {
        flex: 1,
        opacity: 0.8,
        lineHeight: 22,
    },
    addButton: {
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
