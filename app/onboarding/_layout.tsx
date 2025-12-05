import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="personal-info" />
            <Stack.Screen name="body-stats" />
            <Stack.Screen name="goals" />
            <Stack.Screen name="summary" />
        </Stack>
    );
}
