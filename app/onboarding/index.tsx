import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { importDatabase } from '@/services/database';
import { downloadFromDrive, GOOGLE_CLIENT_IDS, GOOGLE_SCOPES, listBackups } from '@/services/google-drive';
import * as Google from 'expo-auth-session/providers/google';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function OnboardingWelcome() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: GOOGLE_CLIENT_IDS.android,
        iosClientId: GOOGLE_CLIENT_IDS.ios,
        webClientId: GOOGLE_CLIENT_IDS.web,
        scopes: GOOGLE_SCOPES,
    });

    const [loading, setLoading] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [showRestoreOptions, setShowRestoreOptions] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        if (response?.type === 'success') {
            setAccessToken(response.authentication?.accessToken || null);
            fetchBackups(response.authentication?.accessToken || '');
        } else if (response?.type === 'error') {
            Alert.alert('Error', 'Google Sign-In failed');
        }
    }, [response]);

    const fetchBackups = async (token: string) => {
        setLoading(true);
        try {
            const files = await listBackups(token);
            if (files.length === 0) {
                Alert.alert('No Backups', 'No FitX backups found in your Google Drive.');
            } else {
                setBackups(files);
                setShowBackupModal(true);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to list backups: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLocalRestore = async () => {
        setShowRestoreOptions(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/octet-stream', 'application/x-sqlite3', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            setLoading(true);
            const asset = result.assets[0];
            await importDatabase(asset.uri);
            Alert.alert('Success', 'Data restored successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to restore local backup: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDriveRestoreInit = () => {
        setShowRestoreOptions(false);
        if (!request) {
            Alert.alert('Error', 'Google Sign-In not initialized. Please check your configuration.');
            return;
        }
        promptAsync();
    };

    const handleRestore = async (fileId: string, fileName: string) => {
        if (!accessToken) return;
        setLoading(true);
        setShowBackupModal(false);
        try {
            const cacheDir = FileSystem.cacheDirectory;
            if (!cacheDir) throw new Error('Cache directory not available');
            const destPath = `${cacheDir}${fileName}`;
            await downloadFromDrive(accessToken, fileId, destPath);
            await importDatabase(destPath);
            Alert.alert('Success', 'Data restored successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to restore backup: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Welcome to FitX</ThemedText>
            <ThemedText style={styles.subtitle}>Your personal fitness and nutrition companion.</ThemedText>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#0a7ea4' }]}
                onPress={() => router.push('/onboarding/personal-info')}
            >
                <ThemedText style={styles.buttonText}>Get Started</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.tint }]}
                onPress={() => setShowRestoreOptions(true)}
            >
                <ThemedText style={{ color: theme.tint }}>Restore from Backup</ThemedText>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            )}

            {/* Restore Options Modal */}
            <Modal
                visible={showRestoreOptions}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowRestoreOptions(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <ThemedText type="subtitle" style={{ marginBottom: 20, textAlign: 'center' }}>Restore Data</ThemedText>

                        <TouchableOpacity
                            style={[styles.optionButton, { backgroundColor: theme.card, marginBottom: 10, borderColor: theme.icon }]}
                            onPress={handleLocalRestore}
                        >
                            <ThemedText>📁 Local Storage</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionButton, { backgroundColor: theme.card, borderColor: theme.icon }]}
                            onPress={handleDriveRestoreInit}
                            disabled={!request}
                        >
                            <ThemedText>☁️ Google Drive</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: 'transparent', marginTop: 10 }]}
                            onPress={() => setShowRestoreOptions(false)}
                        >
                            <ThemedText style={{ color: theme.tint }}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Drive Backup List Modal */}
            <Modal
                visible={showBackupModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBackupModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <ThemedText type="subtitle" style={{ marginBottom: 15 }}>Select Backup</ThemedText>
                        <FlatList
                            data={backups}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.backupItem, { borderBottomColor: theme.icon }]}
                                    onPress={() => handleRestore(item.id, item.name)}
                                >
                                    <ThemedText>{item.name}</ThemedText>
                                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                                        {new Date(item.createdTime).toLocaleString()}
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: theme.card }]}
                            onPress={() => setShowBackupModal(false)}
                        >
                            <ThemedText>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButton: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        borderWidth: 1,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 15,
        padding: 20,
        maxHeight: '60%',
    },
    backupItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    closeButton: {
        marginTop: 15,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    optionButton: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        width: '100%',
    },
});
