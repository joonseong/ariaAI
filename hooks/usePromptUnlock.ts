import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { checkUnlocked, unlockPrompt } from '@/services/promptUnlocks';
import { PROMPT_UNLOCK_COST } from '@/services/points';

export function usePromptUnlock(artworkId: string, artworkAuthorId: string) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isOwner = user?.id === artworkAuthorId;

  const [isUnlocked, setIsUnlocked] = useState(isOwner);
  const [isChecking, setIsChecking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (isOwner) {
      setIsUnlocked(true);
      return;
    }

    if (!user || !artworkId) return;

    setIsChecking(true);
    checkUnlocked(user.id, artworkId).then((result) => {
      if (result.success) {
        setIsUnlocked(result.data);
      }
      setIsChecking(false);
    });
  }, [user, artworkId, isOwner]);

  const unlock = useCallback(async (): Promise<{ success: boolean; prompt?: string; errorMessage?: string }> => {
    if (!user || !isAuthenticated) {
      return { success: false, errorMessage: '로그인이 필요합니다.' };
    }

    setIsUnlocking(true);
    const result = await unlockPrompt(user.id, artworkId);
    setIsUnlocking(false);

    if (result.success) {
      setIsUnlocked(true);
      return { success: true, prompt: result.data };
    }

    return { success: false, errorMessage: result.error.message };
  }, [user, isAuthenticated, artworkId]);

  return {
    isUnlocked,
    isChecking,
    isUnlocking,
    isOwner,
    costPoints: PROMPT_UNLOCK_COST,
    unlock,
  };
}
