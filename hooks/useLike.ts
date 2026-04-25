import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';
import * as likesService from '@/services/likes';
import { haptics } from '@/lib/haptics';

export function useLike(artworkId: string, initialLiked: boolean, initialCount: number) {
  const user = useAuthStore((state) => state.user);
  const updateArtworkLike = useFeedStore((state) => state.updateArtworkLike);
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const pendingRef = useRef(false);

  const toggle = useCallback(async () => {
    if (!user) return;
    if (pendingRef.current) return;
    pendingRef.current = true;

    haptics.light();

    const prevLiked = liked;
    const prevCount = count;
    const newLiked = !liked;
    const newCount = liked ? count - 1 : count + 1;

    setLiked(newLiked);
    setCount(newCount);
    updateArtworkLike(artworkId, newLiked, newCount);

    const result = await likesService.toggleLike(user.id, artworkId);
    if (!result.success) {
      setLiked(prevLiked);
      setCount(prevCount);
      updateArtworkLike(artworkId, prevLiked, prevCount);
    }

    pendingRef.current = false;
  }, [user, artworkId, liked, count, updateArtworkLike]);

  return { liked, count, toggle };
}
