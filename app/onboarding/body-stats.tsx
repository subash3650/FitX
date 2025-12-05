import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function BodyStatsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const handleNext = () => {
        if (height && weight) {
            router.push({
                pathname: '/onboarding/goals',
                params: { ...params, height, weight }
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
                    <ThemedText type="subtitle" style={styles.title}>Body Stats</ThemedText>

                    <View style={styles.inputContainer}>
                        <ThemedText>Height (cm)</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                            placeholder="e.g. 175"
                            placeholderTextColor="#888"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText>Weight (kg)</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                            placeholder="e.g. 70"
                            placeholderTextColor="#888"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.tint }]}
                        onPress={handleNext}
                    >
                        <ThemedText style={styles.buttonText}>Next</ThemedText>
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
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        fontSize: 16,
    },
    button: {
        marginTop: 20,
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
