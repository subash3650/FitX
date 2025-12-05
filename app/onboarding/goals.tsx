import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const ACTIVITY_LEVELS = [
    { label: 'Sedentary', value: 'sedentary', desc: 'Little or no exercise' },
    { label: 'Lightly Active', value: 'light', desc: 'Exercise 1-3 times/week' },
    { label: 'Moderately Active', value: 'moderate', desc: 'Exercise 4-5 times/week' },
    { label: 'Very Active', value: 'active', desc: 'Daily exercise or intense exercise 3-4 times/week' },
];

const GOALS = [
    { label: 'Lose Weight', value: 'cut' },
    { label: 'Maintain Weight', value: 'maintain' },
    { label: 'Gain Muscle', value: 'bulk' },
];

export default function GoalsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [activityLevel, setActivityLevel] = useState('');
    const [goal, setGoal] = useState('');

    const handleNext = () => {
        if (activityLevel && goal) {
            router.push({
                pathname: '/onboarding/summary',
                params: { ...params, activityLevel, goal }
            });
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedText type="subtitle" style={styles.title}>Goals & Activity</ThemedText>

                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Activity Level</ThemedText>
                        {ACTIVITY_LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level.value}
                                style={[
                                    styles.optionButton,
                                    { borderColor: theme.icon },
                                    activityLevel === level.value && { backgroundColor: theme.tint, borderColor: theme.tint }
                                ]}
                                onPress={() => setActivityLevel(level.value)}
                            >
                                <ThemedText style={activityLevel === level.value ? styles.selectedText : undefined}>
                                    {level.label}
                                </ThemedText>
                                <ThemedText style={[styles.descText, activityLevel === level.value ? styles.selectedText : { color: '#888' }]}>
                                    {level.desc}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Goal</ThemedText>
                        {GOALS.map((g) => (
                            <TouchableOpacity
                                key={g.value}
                                style={[
                                    styles.optionButton,
                                    { borderColor: theme.icon },
                                    goal === g.value && { backgroundColor: theme.tint, borderColor: theme.tint }
                                ]}
                                onPress={() => setGoal(g.value)}
                            >
                                <ThemedText style={goal === g.value ? styles.selectedText : undefined}>
                                    {g.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.tint }]}
                        onPress={handleNext}
                    >
                        <ThemedText style={styles.buttonText}>Calculate Plan</ThemedText>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
        marginTop: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        marginBottom: 10,
    },
    optionButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
    },
    selectedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    descText: {
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        marginTop: 10,
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 40,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
