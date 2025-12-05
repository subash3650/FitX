import { makeRedirectUri } from 'expo-auth-session';
import * as FileSystem from 'expo-file-system';

// Google Drive API Endpoints
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Client IDs - USER MUST REPLACE THESE
export const GOOGLE_CLIENT_IDS = {
    android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    web: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

export const REDIRECT_URI = makeRedirectUri({
    scheme: 'fitx'
});

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
}

/**
 * Uploads a file to Google Drive
 * @param accessToken Valid Google OAuth access token
 * @param filePath Local URI of the file to upload
 * @param fileName Name to save the file as on Drive
 * @param mimeType Mime type of the file
 */
export const uploadToDrive = async (accessToken: string, filePath: string, fileName: string, mimeType: string) => {
    const metadata = {
        name: fileName,
        mimeType: mimeType,
        // parents: ['appDataFolder'] // Optional: Use appDataFolder to hide from user's main drive
    };

    const body = new FormData();
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    // Read file as blob or use uri directly if supported by fetch in RN (it usually is)
    // However, React Native's fetch with FormData and file URI is tricky.
    // Using FileSystem.uploadAsync is more reliable for large files, but constructing multipart body there is hard.
    // Let's try the standard fetch with FormData which works in modern RN/Expo.

    // We need to fetch the file content first to create a blob
    const fileContent = await fetch(filePath);
    const blob = await fileContent.blob();

    body.append('file', blob);

    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: body,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload to Drive');
    }

    return await response.json();
};

/**
 * Lists FitX backup files from Google Drive
 * @param accessToken Valid Google OAuth access token
 */
export const listBackups = async (accessToken: string): Promise<DriveFile[]> => {
    // Query to find files with .fitx extension or specific name pattern
    // trashed = false ensures we don't see deleted files
    const q = "name contains 'FitX_Backup' and trashed = false";
    const fields = 'files(id, name, mimeType, createdTime)';
    const orderBy = 'createdTime desc';

    const response = await fetch(`${FILES_URL}?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to list backups');
    }

    const data = await response.json();
    return data.files || [];
};

/**
 * Downloads a file from Google Drive
 * @param accessToken Valid Google OAuth access token
 * @param fileId ID of the file to download
 * @param destPath Local path to save the file to
 */
export const downloadFromDrive = async (accessToken: string, fileId: string, destPath: string) => {
    const downloadRes = await FileSystem.downloadAsync(
        `${FILES_URL}/${fileId}?alt=media`,
        destPath,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (downloadRes.status !== 200) {
        throw new Error('Failed to download file from Drive');
    }

    return downloadRes.uri;
};
