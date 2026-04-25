import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as artworksService from '@/services/artworks';
import { isValidTitle, isValidDescription, isValidTags } from '@/lib/validators';
import { Result } from '@/types/common';

export function useArtworkEdit(artworkId: string) {
  const user = useAuthStore((state) => state.user);
  const [title, setTitleState] = useState('');
  const [description, setDescriptionState] = useState('');
  const [tags, setTagsState] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadArtwork = useCallback(async () => {
    const result = await artworksService.getArtwork(artworkId);
    if (result.success) {
      setTitleState(result.data.title);
      setDescriptionState(result.data.description);
      setTagsState(result.data.tags);
      setIsDirty(false);
    }
  }, [artworkId]);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setIsDirty(true);
  }, []);

  const setDescription = useCallback((value: string) => {
    setDescriptionState(value);
    setIsDirty(true);
  }, []);

  const setTags = useCallback((value: string[]) => {
    setTagsState(value);
    setIsDirty(true);
  }, []);

  const save = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
      };
    }

    if (!isValidTitle(title)) {
      return {
        success: false,
        error: {
          code: 'validation/invalid-title',
          message: '제목을 입력해주세요. (1~100자)',
        },
      };
    }

    if (!isValidDescription(description)) {
      return {
        success: false,
        error: {
          code: 'validation/description-too-long',
          message: '설명은 2000자 이하로 입력해주세요.',
        },
      };
    }

    if (!isValidTags(tags)) {
      return {
        success: false,
        error: {
          code: 'validation/invalid-tags',
          message: '태그는 최대 10개까지 가능합니다.',
        },
      };
    }

    setIsSubmitting(true);
    const result = await artworksService.updateArtwork(artworkId, { title, description, tags });
    setIsSubmitting(false);

    if (result.success) {
      setIsDirty(false);
    }

    return result;
  }, [user, artworkId, title, description, tags]);

  return {
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
  };
}
