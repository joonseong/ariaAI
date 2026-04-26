import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard } from 'react-native';
import IconClose from '@/assets/icons/icon.close.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useImagePicker, SelectedImage } from '@/hooks/useImagePicker';
import { useArtworkUpload, TOOL_PRESETS } from '@/hooks/useArtworkUpload';
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

  useEffect(() => {
    if (!isAuthenticated) {
      setLoginPromptVisible(true);
    }
  }, [isAuthenticated]);

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
      router.replace(`/artwork/${result.data}`);
    } else {
      showToast(result.error.message, 'error');
    }
  }, [isAuthenticated, images, upload, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const canSubmit = images.length > 0 && upload.title.trim().length > 0 && !upload.isUploading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={handleClose} accessibilityLabel="닫기" hitSlop={8}>
          <IconClose width={24} height={24} color="#E5E5E5" />
        </Pressable>
        <Text className="text-base font-semibold text-text-primary">작품 등록</Text>
        <View style={{ width: 28 }} />
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

        <View className="mt-4">
          <Input
            label="생성 프롬프트"
            placeholder="사용한 프롬프트를 입력해주세요 (선택)"
            value={upload.prompt}
            onChangeText={upload.setPrompt}
            maxLength={LIMITS.DESCRIPTION_MAX}
            multiline
            error={errors.prompt}
          />
          {upload.prompt.trim().length > 0 && (
            <Text className="mt-1 text-xs text-text-tertiary">
              프롬프트는 잠금 상태로 저장됩니다. 다른 사용자가 열람하려면 100P가 필요합니다.
            </Text>
          )}
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
        <View style={{ flexDirection: 'row', gap: 12, paddingTop: 10, paddingRight: 10 }}>
          {canAddMore && (
            <Pressable
              onPress={onPick}
              style={{ width: 112, height: 112, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="이미지 추가"
              accessibilityRole="button"
            >
              <Text className="text-2xl text-text-tertiary">+</Text>
              <Text className="mt-1 text-xs text-text-tertiary">추가</Text>
            </Pressable>
          )}
          {images.map((image, index) => (
            <View key={image.uri} style={{ position: 'relative' }}>
              <Image
                source={{ uri: image.uri }}
                style={{ width: 112, height: 112, borderRadius: 8 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => onRemove(index)}
                style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}
                accessibilityLabel={`이미지 ${index + 1} 삭제`}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#F5F5F5' }}>X</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
      {error && (
        <Text className="mt-1 text-xs text-semantic-error">{error}</Text>
      )}
    </View>
  );
}
