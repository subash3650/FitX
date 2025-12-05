import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function OnboardingWelcome() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Welcome to FitX</ThemedText>
            <ThemedText style={styles.subtitle}>Your personal fitness and nutrition companion.</ThemedText>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.tint }]}
                onPress={() => router.push('/onboarding/personal-info')}
            >
                <ThemedText style={styles.buttonText}>Get Started</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        marginBottom: 40,
        textAlign: 'center',
        opacity: 0.8,
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
