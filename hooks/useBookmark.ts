import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as bookmarksService from '@/services/bookmarks';

export function useBookmark(artworkId: string, initialBookmarked: boolean) {
  const user = useAuthStore((state) => state.user);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const pendingRef = useRef(false);

  const toggle = useCallback(async () => {
    if (!user) return;
    if (pendingRef.current) return;
    pendingRef.current = true;

    const prevBookmarked = bookmarked;
    setBookmarked(!bookmarked);

    const result = await bookmarksService.toggleBookmark(user.id, artworkId);
    if (!result.success) {
      setBookmarked(prevBookmarked);
    }

    pendingRef.current = false;
  }, [user, artworkId, bookmarked]);

  return { bookmarked, toggle };
}
