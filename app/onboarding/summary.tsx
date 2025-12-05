import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB } from '@/services/database';
import * as MailComposer from 'expo-mail-composer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SummaryScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [bmr, setBmr] = useState(0);
    const [targetCalories, setTargetCalories] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        calculatePlan();
    }, []);

    const calculatePlan = () => {
        const weight = parseFloat(params.weight as string);
        const height = parseFloat(params.height as string);
        const age = parseInt(params.age as string);
        const gender = params.gender as string;
        const activity = params.activityLevel as string;
        const goal = params.goal as string;

        // Mifflin-St Jeor
        let baseBmr = (10 * weight) + (6.25 * height) - (5 * age);
        if (gender === 'Male') {
            baseBmr += 5;
        } else {
            baseBmr -= 161;
        }

        // Activity Multiplier
        let multiplier = 1.2;
        if (activity === 'light') multiplier = 1.375;
        if (activity === 'moderate') multiplier = 1.55;
        if (activity === 'active') multiplier = 1.725;

        const tdee = baseBmr * multiplier;
        setBmr(Math.round(tdee));

        // Goal Adjustment
        let target = tdee;
        if (goal === 'cut') target -= 500;
        if (goal === 'bulk') target += 300;

        setTargetCalories(Math.round(target));
    };

    const sendEmail = async () => {
        const isAvailable = await MailComposer.isAvailableAsync();
        if (isAvailable) {
            const body = `
New User Registration Details:

Name: ${params.name}
Age: ${params.age}
Gender: ${params.gender}
Email: ${params.email}
Phone: ${params.phone}
Height: ${params.height} cm
Weight: ${params.weight} kg
Activity Level: ${params.activityLevel}
Goal: ${params.goal}

Target Calories: ${targetCalories} kcal
            `;

            await MailComposer.composeAsync({
                recipients: ['subashprasanna66@gmail.com'],
                subject: 'New User Registration - FitX',
                body: body,
            });
        } else {
            Alert.alert('Error', 'Mail services are not available on this device');
        }
    };

    const handleFinish = async () => {
        setSaving(true);
        try {
            const db = getDB();
            await db.runAsync(
                `INSERT INTO users (name, email, phone, gender, height, starting_weight, activity_level, goal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    params.name as string,
                    params.email as string,
                    params.phone as string,
                    params.gender as string,
                    parseFloat(params.height as string),
                    parseFloat(params.weight as string),
                    params.activityLevel as string,
                    params.goal as string,
                    new Date().toISOString()
                ]
            );

            // Send email notification
            await sendEmail();

            // Navigate to main app
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving user:', error);
            Alert.alert('Error', 'Failed to save your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedText type="title" style={styles.title}>Your Plan</ThemedText>

                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle">Daily Calories</ThemedText>
                    <ThemedText type="title" style={{ color: colorScheme === 'dark' ? '#0a7ea4' : theme.tint }}>{targetCalories} kcal</ThemedText>
                    <ThemedText>Maintenance: {bmr} kcal</ThemedText>
                </View>

                <ThemedText style={styles.explanation}>
                    Based on your stats and goal to {params.goal === 'cut' ? 'lose weight' : params.goal === 'bulk' ? 'gain muscle' : 'maintain weight'},
                    we recommend consuming {targetCalories} calories per day.
                </ThemedText>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#0a7ea4' }]}
                    onPress={handleFinish}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <ThemedText style={styles.buttonText}>Let's Go!</ThemedText>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginBottom: 30,
    },
    card: {
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    explanation: {
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.8,
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
