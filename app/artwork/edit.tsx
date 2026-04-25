import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArtworkEdit } from '@/hooks/useArtworkEdit';
import { useDiscardGuard } from '@/hooks/useDiscardGuard';
import { showToast } from '@/stores/toastStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { TagChip } from '@/components/artwork/TagChip';
import { LIMITS } from '@/lib/constants';

const PRESET_TOOLS = [
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
  'ComfyUI',
  'Leonardo AI',
  'Adobe Firefly',
  '기타',
];

export default function ArtworkEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    isSubmitting,
    isDirty,
    loadArtwork,
    save,
  } = useArtworkEdit(id ?? '');

  const [isLoading, setIsLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [titleError, setTitleError] = useState('');

  useDiscardGuard(isDirty);

  useEffect(() => {
    loadArtwork().then(() => setIsLoading(false));
  }, [loadArtwork]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= LIMITS.TAGS_MAX) {
      showToast(`태그는 최대 ${LIMITS.TAGS_MAX}개까지 가능합니다`, 'error');
      return;
    }
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  }, [tagInput, tags, setTags]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      setTags(tags.filter((t) => t !== tag));
    },
    [tags, setTags],
  );

  const handleSave = useCallback(async () => {
    setTitleError('');
    const result = await save();
    if (!result.success) {
      if (result.error.code.startsWith('validation/')) {
        setTitleError(result.error.message);
      } else {
        showToast(result.error.message, 'error');
      }
      return;
    }
    showToast('수정되었습니다', 'success');
    router.back();
  }, [save, router]);

  const handleBack = useCallback(() => router.back(), [router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={handleBack} accessibilityLabel="뒤로가기">
            <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-text-primary">작품 수정</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="px-4 gap-5 pt-2">
            <Input
              label="제목 *"
              placeholder="작품 제목을 입력해주세요 (최대 100자)"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setTitleError('');
              }}
              maxLength={LIMITS.TITLE_MAX}
              error={titleError}
              autoCapitalize="none"
            />

            <Input
              label="설명"
              placeholder="작품 설명을 입력해주세요 (선택, 최대 2000자)"
              value={description}
              onChangeText={setDescription}
              maxLength={LIMITS.DESCRIPTION_MAX}
              multiline
              autoCapitalize="none"
            />

            <View>
              <Text className="mb-1.5 text-sm font-medium text-text-primary">태그</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg bg-elevated px-4 py-3 text-sm text-text-primary"
                  placeholder="태그 입력 후 추가"
                  placeholderTextColor="#808080"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                  maxLength={30}
                  accessibilityLabel="태그 입력"
                />
                <Pressable
                  onPress={handleAddTag}
                  className="h-12 items-center justify-center rounded-lg bg-elevated px-4"
                  accessibilityRole="button"
                  accessibilityLabel="태그 추가"
                >
                  <Text className="text-sm text-accent-primary">추가</Text>
                </Pressable>
              </View>

              {tags.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {tags.map((tag) => (
                    <TagChip
                      key={tag}
                      label={tag}
                      removable
                      onRemove={() => handleRemoveTag(tag)}
                    />
                  ))}
                </View>
              )}
              <Text className="mt-1 text-xs text-text-tertiary">
                {tags.length}/{LIMITS.TAGS_MAX}
              </Text>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-text-primary">프리셋 도구 태그</Text>
              <View className="flex-row flex-wrap gap-2">
                {PRESET_TOOLS.map((tool) => (
                  <TagChip
                    key={tool}
                    label={tool}
                    selected={tags.includes(tool)}
                    onPress={() => {
                      if (tags.includes(tool)) {
                        handleRemoveTag(tool);
                      } else {
                        if (tags.length >= LIMITS.TAGS_MAX) {
                          showToast(`태그는 최대 ${LIMITS.TAGS_MAX}개까지 가능합니다`, 'error');
                          return;
                        }
                        setTags([...tags, tool]);
                      }
                    }}
                  />
                ))}
              </View>
            </View>

            <Button
              title="저장"
              onPress={handleSave}
              loading={isSubmitting}
              disabled={!isDirty}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
