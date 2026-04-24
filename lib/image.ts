import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { LIMITS } from '@/lib/constants';

const DEFAULT_MAX_WIDTH = 2048;
const DEFAULT_QUALITY = 0.8;

export async function resizeImage(uri: string, maxWidth: number = DEFAULT_MAX_WIDTH): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: DEFAULT_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function compressImage(uri: string, quality: number = DEFAULT_QUALITY): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function validateImageSize(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return false;
  const maxBytes = LIMITS.IMAGE_SIZE_MB * 1024 * 1024;
  return (info.size ?? 0) <= maxBytes;
}
