import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createArtwork } from '@/services/artworks';
import { resizeImage } from '@/lib/image';
import { isValidTitle, isValidDescription, isValidTags, isValidTag } from '@/lib/validators';
import { LIMITS } from '@/lib/constants';
import { Result } from '@/types/common';
import { SelectedImage } from '@/hooks/useImagePicker';

export const TOOL_PRESETS = [
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
  'ComfyUI',
  'Leonardo AI',
  'Adobe Firefly',
  '기타',
] as const;

export function useArtworkUpload() {
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tool, setTool] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });

  const isDirty = useMemo(
    () => title.trim().length > 0,
    [title],
  );

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!isValidTag(trimmed)) return;
    setTags((prev) => {
      if (prev.length >= LIMITS.TAGS_MAX) return prev;
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  }, []);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const validate = useCallback(
    (images: SelectedImage[]) => {
      const errors: Record<string, string> = {};

      if (images.length === 0) {
        errors.images = '이미지를 1장 이상 선택해주세요';
      } else if (images.length > LIMITS.IMAGES_MAX) {
        errors.images = `이미지는 최대 ${LIMITS.IMAGES_MAX}장까지 가능합니다`;
      }

      if (!isValidTitle(title)) {
        if (title.trim().length === 0) {
          errors.title = '제목을 입력해주세요';
        } else {
          errors.title = `제목은 ${LIMITS.TITLE_MAX}자 이내로 입력해주세요`;
        }
      }

      if (!isValidDescription(description)) {
        errors.description = `설명은 ${LIMITS.DESCRIPTION_MAX}자 이내로 입력해주세요`;
      }

      if (!isValidTags(tags)) {
        errors.tags = `태그는 최대 ${LIMITS.TAGS_MAX}개까지 가능합니다`;
      }

      if (prompt.trim().length > LIMITS.DESCRIPTION_MAX) {
        errors.prompt = `프롬프트는 ${LIMITS.DESCRIPTION_MAX}자 이내로 입력해주세요`;
      }

      return { valid: Object.keys(errors).length === 0, errors };
    },
    [title, description, tags, prompt],
  );

  const submit = useCallback(
    async (images: SelectedImage[]): Promise<Result<string>> => {
      if (!user) {
        return {
          success: false,
          error: { code: 'auth/no-user', message: '로그인이 필요합니다.' },
        };
      }

      setIsUploading(true);
      setUploadProgress({ completed: 0, total: images.length });

      try {
        const resizedUris: string[] = [];
        for (const image of images) {
          const resized = await resizeImage(image.uri);
          resizedUris.push(resized);
        }

        const result = await createArtwork(
          user.id,
          {
            title: title.trim(),
            description: description.trim(),
            prompt: prompt.trim(),
            images: resizedUris,
            tags,
            tool: tool ?? '',
            authorNickname: user.nickname,
            authorProfileImageUrl: user.profileImageUrl,
          },
          (completed, total) => {
            setUploadProgress({ completed, total });
          },
        );

        return result;
      } finally {
        setIsUploading(false);
        setUploadProgress({ completed: 0, total: 0 });
      }
    },
    [user, title, description, tags, tool],
  );

  const reset = useCallback(() => {
    setTitle('');
    setDescription('');
    setPrompt('');
    setTags([]);
    setTool(null);
    setIsUploading(false);
    setUploadProgress({ completed: 0, total: 0 });
  }, []);

  return {
    title,
    setTitle,
    description,
    setDescription,
    prompt,
    setPrompt,
    tags,
    addTag,
    removeTag,
    tool,
    setTool,
    isDirty,
    isUploading,
    uploadProgress,
    validate,
    submit,
    reset,
  };
}
