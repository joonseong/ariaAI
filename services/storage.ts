import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';

export async function uploadImage(
  path: string,
  uri: string,
  onProgress?: (progress: number) => void,
): Promise<Result<string>> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);

    const url = await new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, blob);
      task.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            onProgress(snapshot.bytesTransferred / snapshot.totalBytes);
          }
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            resolve(downloadUrl);
          } catch (error) {
            reject(error);
          }
        },
      );
    });

    return { success: true, data: url };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteImage(url: string): Promise<Result<void>> {
  try {
    const path = decodeURIComponent(
      url.split('/o/')[1]?.split('?')[0] ?? '',
    );
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function uploadImages(
  basePath: string,
  uris: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<Result<string[]>> {
  const uploadedUrls: string[] = [];

  try {
    for (let i = 0; i < uris.length; i++) {
      const timestamp = Date.now();
      const path = `${basePath}/${timestamp}_${i}.jpg`;
      const result = await uploadImage(path, uris[i]);

      if (!result.success) {
        for (const url of uploadedUrls) {
          await deleteImage(url).catch(() => {});
        }
        return result as Result<string[]>;
      }

      uploadedUrls.push(result.data);
      if (onProgress) {
        onProgress(i + 1, uris.length);
      }
    }

    return { success: true, data: uploadedUrls };
  } catch (error) {
    for (const url of uploadedUrls) {
      await deleteImage(url).catch(() => {});
    }
    return { success: false, error: mapFirebaseError(error) };
  }
}
