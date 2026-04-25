import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { LIMITS } from '@/lib/constants';

export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
}

export function useImagePicker(maxImages: number = LIMITS.IMAGES_MAX) {
  const [images, setImages] = useState<SelectedImage[]>([]);

  const pickImages = useCallback(async () => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) return;

    const validImages: SelectedImage[] = [];
    for (const asset of result.assets) {
      const isDuplicate = images.some((img) => img.uri === asset.uri);
      if (isDuplicate) {
        continue;
      }

      validImages.push({
        uri: asset.uri,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
      });
    }

    if (validImages.length > 0) {
      setImages((prev) => [...prev, ...validImages].slice(0, maxImages));
    }
  }, [images, maxImages]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  return {
    images,
    pickImages,
    removeImage,
    reorderImages,
    canAddMore: images.length < maxImages,
  };
}
