import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useImagePicker, SelectedImage } from '@/hooks/useImagePicker';
import { useArtworkUpload, TOOL_PRESETS } from '@/hooks/useArtworkUpload';
import { useDiscardGuard } from '@/hooks/useDiscardGuard';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/toastStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { TagChip } from '@/components/artwork/TagChip';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import { LIMITS } from '@/lib/constants';

export default function UploadScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { images, pickImages, removeImage, canAddMore } = useImagePicker();
  const upload = useArtworkUpload();
  const [customTagInput, setCustomTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  const isDirty = upload.isDirty || images.length > 0;
  useDiscardGuard(isDirty && !upload.isUploading);

  const handlePickImages = useCallback(async () => {
    if (!isAuthenticated) {
      setLoginPromptVisible(true);
      return;
    }
    await pickImages();
  }, [isAuthenticated, pickImages]);

  const handleAddCustomTag = useCallback(() => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    upload.addTag(trimmed);
    setCustomTagInput('');
  }, [customTagInput, upload]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      setLoginPromptVisible(true);
      return;
    }

    Keyboard.dismiss();
    const validation = upload.validate(images);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    const result = await upload.submit(images);
    if (result.success) {
      showToast('작품이 등록되었습니다', 'success');
      upload.reset();
      router.push(`/artwork/${result.data}`);
    } else {
      showToast(result.error.message, 'error');
    }
  }, [isAuthenticated, images, upload, router]);

  const canSubmit = images.length > 0 && upload.title.trim().length > 0 && !upload.isUploading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3">
        <Text className="text-2xl font-bold text-text-primary">작품 등록</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ImageSelector
          images={images}
          canAddMore={canAddMore}
          onPick={handlePickImages}
          onRemove={removeImage}
          error={errors.images}
        />

        <View className="mt-6">
          <Input
            label="제목"
            placeholder="작품 제목을 입력해주세요"
            value={upload.title}
            onChangeText={upload.setTitle}
            maxLength={LIMITS.TITLE_MAX}
            error={errors.title}
          />
        </View>

        <View className="mt-4">
          <Input
            label="설명"
            placeholder="작품에 대한 설명을 입력해주세요 (선택)"
            value={upload.description}
            onChangeText={upload.setDescription}
            maxLength={LIMITS.DESCRIPTION_MAX}
            multiline
            error={errors.description}
          />
        </View>

        <View className="mt-6">
          <Text className="mb-2 text-sm font-medium text-text-primary">사용 도구</Text>
          <View className="flex-row flex-wrap gap-2">
            {TOOL_PRESETS.map((preset) => (
              <TagChip
                key={preset}
                label={preset}
                selected={upload.tool === preset}
                onPress={() => upload.setTool(upload.tool === preset ? null : preset)}
              />
            ))}
          </View>
        </View>

        <View className="mt-6">
          <Text className="mb-2 text-sm font-medium text-text-primary">
            태그 ({upload.tags.length}/{LIMITS.TAGS_MAX})
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                placeholder="태그 입력"
                value={customTagInput}
                onChangeText={setCustomTagInput}
                maxLength={30}
              />
            </View>
            <Button
              title="추가"
              variant="secondary"
              onPress={handleAddCustomTag}
              disabled={!customTagInput.trim() || upload.tags.length >= LIMITS.TAGS_MAX}
            />
          </View>
          {errors.tags && (
            <Text className="mt-1 text-xs text-semantic-error">{errors.tags}</Text>
          )}
          {upload.tags.length > 0 && (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {upload.tags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  removable
                  onRemove={() => upload.removeTag(tag)}
                />
              ))}
            </View>
          )}
        </View>

        <View className="mb-8 mt-6">
          <Button
            title={upload.isUploading
              ? `업로드 중... (${upload.uploadProgress.completed}/${upload.uploadProgress.total})`
              : '등록'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={upload.isUploading}
            fullWidth
          />
        </View>
      </ScrollView>

      {upload.isUploading && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="rounded-xl bg-surface p-6">
            <Text className="text-center text-base font-semibold text-text-primary">
              업로드 중...
            </Text>
            <Text className="mt-2 text-center text-sm text-text-secondary">
              {upload.uploadProgress.completed}/{upload.uploadProgress.total} 이미지 완료
            </Text>
          </View>
        </View>
      )}

      <LoginPromptSheet
        visible={loginPromptVisible}
        onClose={() => setLoginPromptVisible(false)}
        message="작품을 등록하려면 로그인이 필요합니다"
      />
    </SafeAreaView>
  );
}

function ImageSelector({
  images,
  canAddMore,
  onPick,
  onRemove,
  error,
}: {
  images: SelectedImage[];
  canAddMore: boolean;
  onPick: () => void;
  onRemove: (index: number) => void;
  error?: string;
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-text-primary">
        이미지 ({images.length}/{LIMITS.IMAGES_MAX})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {images.map((image, index) => (
            <View key={image.uri} className="relative">
              <Image
                source={{ uri: image.uri }}
                className="h-24 w-24 rounded-lg"
                contentFit="cover"
              />
              <Pressable
                onPress={() => onRemove(index)}
                className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-semantic-error"
                accessibilityLabel={`이미지 ${index + 1} 삭제`}
              >
                <Text className="text-xs font-bold text-text-primary">X</Text>
              </Pressable>
            </View>
          ))}
          {canAddMore && (
            <Pressable
              onPress={onPick}
              className="h-24 w-24 items-center justify-center rounded-lg border border-dashed border-border"
              accessibilityLabel="이미지 추가"
              accessibilityRole="button"
            >
              <Text className="text-2xl text-text-tertiary">+</Text>
              <Text className="mt-1 text-xs text-text-tertiary">추가</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      {error && (
        <Text className="mt-1 text-xs text-semantic-error">{error}</Text>
      )}
    </View>
  );
}
