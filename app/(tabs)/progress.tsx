import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDB } from '@/services/database';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

interface WorkoutLog {
    id: number;
    date: string;
    exercises_done: string;
}

interface GroupedWorkouts {
    [date: string]: WorkoutLog[];
}

export default function ProgressScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [allWorkouts, setAllWorkouts] = useState<WorkoutLog[]>([]);
    const [groupedWorkouts, setGroupedWorkouts] = useState<GroupedWorkouts>({});
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFromDate, setExportFromDate] = useState<string | null>(null);
    const [exportToDate, setExportToDate] = useState<string | null>(null);
    const [selectingFromDate, setSelectingFromDate] = useState(true);
    const [accountCreationDate, setAccountCreationDate] = useState<string>('');

    // Reload data when tab gains focus
    useFocusEffect(
        useCallback(() => {
            loadData();
            loadAccountDate();
        }, [])
    );

    const loadAccountDate = async () => {
        try {
            const db = getDB();
            const user = await db.getFirstAsync<{ created_at: string }>(
                'SELECT created_at FROM users ORDER BY id ASC LIMIT 1'
            );
            if (user?.created_at) {
                setAccountCreationDate(user.created_at.split('T')[0]);
            }
        } catch (error) {
            console.error('Error loading account date:', error);
        }
    };

    const loadData = async () => {
        try {
            const db = getDB();

            // Get all workouts
            const workouts = await db.getAllAsync<WorkoutLog>(
                'SELECT * FROM workout_sessions ORDER BY date DESC'
            );
            setAllWorkouts(workouts);

            // Group workouts by date
            const grouped: GroupedWorkouts = {};
            const marked: any = {};

            workouts.forEach((workout) => {
                const dateKey = new Date(workout.date).toISOString().split('T')[0];
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(workout);

                // Mark this date on calendar
                marked[dateKey] = {
                    marked: true,
                    dotColor: theme.tint,
                };
            });

            setGroupedWorkouts(grouped);
            setMarkedDates(marked);
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    };

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
        setShowCalendar(false);
    };

    const handleExportDateSelect = (date: string) => {
        if (selectingFromDate) {
            setExportFromDate(date);
            setSelectingFromDate(false);
        } else {
            setExportToDate(date);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateKey = date.toISOString().split('T')[0];
        const todayKey = today.toISOString().split('T')[0];
        const yesterdayKey = yesterday.toISOString().split('T')[0];

        if (dateKey === todayKey) return 'Today';
        if (dateKey === yesterdayKey) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const generatePDF = async () => {
        if (!exportFromDate || !exportToDate) {
            Alert.alert('Error', 'Please select both from and to dates');
            return;
        }

        try {
            // Filter workouts by date range
            const filteredWorkouts = Object.keys(groupedWorkouts)
                .filter(dateKey => {
                    return dateKey >= exportFromDate && dateKey <= exportToDate;
                })
                .sort();

            if (filteredWorkouts.length === 0) {
                Alert.alert('No Data', 'No workouts found in the selected date range');
                return;
            }

            // Generate HTML for PDF
            let htmlContent = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #007AFF; text-align: center; }
                        h2 { color: #333; margin-top: 20px; border-bottom: 2px solid #007AFF; padding-bottom: 5px; }
                        .workout { margin-bottom: 30px; }
                        .exercise { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
                        .exercise-name { font-weight: bold; color: #007AFF; }
                        .exercise-details { color: #666; margin-top: 5px; }
                        .date-range { text-align: center; color: #666; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <h1>FitX Workout Report</h1>
                    <p class="date-range">
                        ${formatDate(exportFromDate)} - ${formatDate(exportToDate)}
                    </p>
            `;

            filteredWorkouts.forEach(dateKey => {
                const dayWorkouts = groupedWorkouts[dateKey];
                const allExercises: any[] = [];

                dayWorkouts.forEach((workout) => {
                    try {
                        const exercises = JSON.parse(workout.exercises_done);
                        allExercises.push(...exercises);
                    } catch (e) {
                        console.error('Error parsing:', e);
                    }
                });

                htmlContent += `
                    <div class="workout">
                        <h2>${formatDate(dateKey)}</h2>
                `;

                allExercises.forEach(ex => {
                    const details = ex.is_timed
                        ? `${ex.sets} sets × ${ex.duration} seconds`
                        : `${ex.sets} sets × ${ex.reps} reps${ex.weight ? ` @ ${ex.weight}kg` : ''}`;

                    htmlContent += `
                        <div class="exercise">
                            <div class="exercise-name">${ex.name}</div>
                            <div class="exercise-details">${details}</div>
                        </div>
                    `;
                });

                htmlContent += `</div>`;
            });

            htmlContent += `
                    <p style="text-align: center; margin-top: 40px; color: #999; font-size: 12px;">
                        Generated by FitX on ${new Date().toLocaleDateString()}
                    </p>
                </body>
                </html>
            `;

            // Create PDF
            const { uri } = await Print.printToFileAsync({ html: htmlContent });

            // Share the PDF
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share Workout Report',
                UTI: 'com.adobe.pdf'
            });

            setShowExportModal(false);
            setExportFromDate(null);
            setExportToDate(null);
            setSelectingFromDate(true);

        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    // Get workouts to display (filtered or all)
    const getWorkoutsToDisplay = () => {
        if (selectedDate && groupedWorkouts[selectedDate]) {
            return { [selectedDate]: groupedWorkouts[selectedDate] };
        }
        // Show last 30 days by default
        const result: GroupedWorkouts = {};
        Object.keys(groupedWorkouts)
            .slice(0, 30)
            .forEach(date => {
                result[date] = groupedWorkouts[date];
            });
        return result;
    };

    const displayWorkouts = getWorkoutsToDisplay();

    // Create disabled dates for export calendar (before account creation)
    const getDisabledDates = () => {
        if (!accountCreationDate) return {};

        const disabled: any = {};
        const creationDate = new Date(accountCreationDate);
        const today = new Date();

        // Disable all dates before account creation
        for (let d = new Date('2020-01-01'); d < creationDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            disabled[dateKey] = { disabled: true, disableTouchEvent: true };
        }

        return disabled;
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Progress</ThemedText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => setShowCalendar(true)}>
                        <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>📅 Calendar</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowExportModal(true)}>
                        <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>Export</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Selected Date Filter */}
                {selectedDate && (
                    <View style={[styles.filterBanner, { backgroundColor: '#0a7ea4' }]}>
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>
                            Showing: {formatDate(selectedDate)}
                        </ThemedText>
                        <TouchableOpacity onPress={() => setSelectedDate(null)}>
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Clear ✕</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Workout History - Grouped by Date */}
                <View style={styles.historySection}>
                    <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                        {selectedDate ? 'Workouts on this day' : 'Recent Workouts'}
                    </ThemedText>

                    {Object.keys(displayWorkouts).length > 0 ? (
                        Object.keys(displayWorkouts).map((dateKey) => {
                            const dayWorkouts = displayWorkouts[dateKey];
                            const allExercises: any[] = [];

                            // Combine all exercises from all workouts on this day
                            dayWorkouts.forEach((workout) => {
                                try {
                                    const exercises = JSON.parse(workout.exercises_done);
                                    allExercises.push(...exercises);
                                } catch (e) {
                                    console.error('Error parsing:', e);
                                }
                            });

                            return (
                                <View
                                    key={dateKey}
                                    style={[styles.workoutCard, { backgroundColor: theme.card }]}
                                >
                                    <View style={[styles.workoutHeader, { borderBottomColor: theme.icon }]}>
                                        <ThemedText type="defaultSemiBold">{formatDate(dateKey)}</ThemedText>
                                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                            {allExercises.length} exercise{allExercises.length !== 1 ? 's' : ''}
                                        </ThemedText>
                                    </View>

                                    {allExercises.map((ex: any, idx: number) => (
                                        <View key={idx} style={styles.exerciseRow}>
                                            <ThemedText>{ex.name}</ThemedText>
                                            <ThemedText style={{ opacity: 0.7 }}>
                                                {ex.is_timed ? (
                                                    `${ex.sets} sets × ${ex.duration}s`
                                                ) : (
                                                    `${ex.sets}×${ex.reps}${ex.weight ? ` @ ${ex.weight}kg` : ''}`
                                                )}
                                            </ThemedText>
                                        </View>
                                    ))}
                                </View>
                            );
                        })
                    ) : (
                        <ThemedText style={styles.emptyText}>
                            {selectedDate
                                ? 'No workouts on this date'
                                : 'No workouts logged yet. Start by selecting an exercise!'}
                        </ThemedText>
                    )}
                </View>
            </ScrollView>

            {/* Calendar Modal */}
            <Modal
                visible={showCalendar}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.calendarContainer, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="subtitle">Select Date</ThemedText>
                            <TouchableOpacity onPress={() => setShowCalendar(false)}>
                                <ThemedText style={{ fontSize: 24 }}>✕</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            markedDates={{
                                ...markedDates,
                                ...(selectedDate ? {
                                    [selectedDate]: {
                                        ...markedDates[selectedDate],
                                        selected: true,
                                        selectedColor: '#0a7ea4',
                                    }
                                } : {})
                            }}
                            onDayPress={(day) => handleDateSelect(day.dateString)}
                            theme={{
                                backgroundColor: theme.background,
                                calendarBackground: theme.background,
                                textSectionTitleColor: theme.text,
                                selectedDayBackgroundColor: '#0a7ea4',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#0a7ea4',
                                dayTextColor: theme.text,
                                textDisabledColor: '#666',
                                dotColor: '#0a7ea4',
                                selectedDotColor: '#ffffff',
                                arrowColor: '#0a7ea4',
                                monthTextColor: theme.text,
                                textDayFontWeight: '400',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                            }}
                        />

                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: '#0a7ea4' }]}
                            onPress={() => setShowCalendar(false)}
                        >
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Close</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Export Date Range Modal */}
            <Modal
                visible={showExportModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowExportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.calendarContainer, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="subtitle">Export Workouts</ThemedText>
                            <TouchableOpacity onPress={() => {
                                setShowExportModal(false);
                                setExportFromDate(null);
                                setExportToDate(null);
                                setSelectingFromDate(true);
                            }}>
                                <ThemedText style={{ fontSize: 24 }}>✕</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>
                                {selectingFromDate ? '📅 Select FROM date' : '📅 Select TO date'}
                            </ThemedText>
                            {exportFromDate && (
                                <ThemedText style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>
                                    From: {formatDate(exportFromDate)}
                                </ThemedText>
                            )}
                            {exportToDate && (
                                <ThemedText style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>
                                    To: {formatDate(exportToDate)}
                                </ThemedText>
                            )}
                        </View>

                        <Calendar
                            markedDates={{
                                ...getDisabledDates(),
                                ...(exportFromDate ? {
                                    [exportFromDate]: {
                                        selected: true,
                                        selectedColor: '#0a7ea4',
                                    }
                                } : {}),
                                ...(exportToDate ? {
                                    [exportToDate]: {
                                        selected: true,
                                        selectedColor: '#0a7ea4',
                                    }
                                } : {})
                            }}
                            onDayPress={(day) => handleExportDateSelect(day.dateString)}
                            minDate={accountCreationDate || '2020-01-01'}
                            maxDate={new Date().toISOString().split('T')[0]}
                            theme={{
                                backgroundColor: theme.background,
                                calendarBackground: theme.background,
                                textSectionTitleColor: theme.text,
                                selectedDayBackgroundColor: '#0a7ea4',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#0a7ea4',
                                dayTextColor: theme.text,
                                textDisabledColor: '#333',
                                dotColor: '#0a7ea4',
                                selectedDotColor: '#ffffff',
                                arrowColor: '#0a7ea4',
                                monthTextColor: theme.text,
                                textDayFontWeight: '400',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                            }}
                        />

                        <View style={styles.exportButtons}>
                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: '#666' }]}
                                onPress={() => {
                                    if (!selectingFromDate) {
                                        setExportToDate(null);
                                        setSelectingFromDate(true);
                                    }
                                }}
                                disabled={selectingFromDate}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Back</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.exportButton, {
                                    backgroundColor: exportFromDate && exportToDate ? '#0a7ea4' : '#999'
                                }]}
                                onPress={generatePDF}
                                disabled={!exportFromDate || !exportToDate}
                            >
                                <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Generate PDF</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
    },
    scrollContent: {
        padding: 20,
    },
    filterBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    historySection: {
        marginBottom: 20,
    },
    workoutCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    emptyText: {
        textAlign: 'center',
        opacity: 0.5,
        marginTop: 20,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarContainer: {
        width: '90%',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        marginTop: 20,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    exportButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    exportButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
});
