import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB } from '@/services/database';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [todayWorkouts, setTodayWorkouts] = useState(0);
  const [userName, setUserName] = useState('');

  // Reload data when tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const db = getDB();

      // Get user name
      const user = await db.getFirstAsync<{ name: string }>('SELECT name FROM users LIMIT 1');
      if (user) setUserName(user.name);

      // Count today's workouts
      const today = new Date().toISOString().split('T')[0];
      const count = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM workout_sessions WHERE date(date) = date(?)',
        [today]
      );
      setTodayWorkouts(count?.count || 0);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Hi {userName || 'there'}! 👋</ThemedText>
        <ThemedText style={{ opacity: 0.7, marginTop: 8 }}>
          {todayWorkouts === 0 ? "Let's log your workout!" : `${todayWorkouts} workout${todayWorkouts > 1 ? 's' : ''} logged today`}
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Action */}
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: '#0a7ea4' }]}
          onPress={() => router.push('/(tabs)/exercise-library')}
        >
          <ThemedText style={styles.mainButtonText}>📝 Log Today's Workout</ThemedText>
          <ThemedText style={styles.mainButtonSubtext}>Tap to pick an exercise</ThemedText>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={{ marginBottom: 12 }}>How to Log:</ThemedText>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>1</ThemedText>
            <ThemedText style={{ flex: 1 }}>Tap "Log Today's Workout" above</ThemedText>
          </View>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>2</ThemedText>
            <ThemedText style={{ flex: 1 }}>Pick an exercise (e.g., Push-ups)</ThemedText>
          </View>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>3</ThemedText>
            <ThemedText style={{ flex: 1 }}>Enter how many sets and reps you did</ThemedText>
          </View>
          <View style={styles.step}>
            <ThemedText style={styles.stepNumber}>4</ThemedText>
            <ThemedText style={{ flex: 1 }}>Tap Save - Done! ✅</ThemedText>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <ThemedText style={{ fontSize: 24 }}>📊</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>View Progress</ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>See your history</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(tabs)/exercise-library')}
          >
            <ThemedText style={{ fontSize: 24 }}>💪</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>All Exercises</ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>Browse library</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  mainButton: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mainButtonSubtext: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
});
