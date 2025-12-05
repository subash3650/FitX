import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleNext = () => {
        if (name && age && gender && email && phone) {
            router.push({
                pathname: '/onboarding/body-stats',
                params: { name, age, gender, email, phone }
            });
        } else {
            Alert.alert('Missing Details', 'Please fill in all the details to proceed.');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedText type="subtitle" style={styles.title}>Tell us about yourself</ThemedText>

                    <View style={styles.inputContainer}>
                        <ThemedText>Name</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#888"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText>Email</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="Enter your email"
                            placeholderTextColor="#888"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText>Phone Number</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="Enter your phone number"
                            placeholderTextColor="#888"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText>Age</ThemedText>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
                            value={age}
                            onChangeText={setAge}
                            keyboardType="numeric"
                            placeholder="Enter your age"
                            placeholderTextColor="#888"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText>Gender</ThemedText>
                        <View style={styles.genderContainer}>
                            {['Male', 'Female', 'Other'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.genderButton,
                                        { borderColor: theme.icon },
                                        gender === g && { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' }
                                    ]}
                                    onPress={() => setGender(g)}
                                >
                                    <ThemedText style={gender === g ? styles.selectedText : undefined}>{g}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#0a7ea4' }]}
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
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    genderButton: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        minWidth: '30%',
        alignItems: 'center',
    },
    selectedText: {
        color: '#fff',
        fontWeight: 'bold',
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
