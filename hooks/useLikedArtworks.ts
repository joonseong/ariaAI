import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getLikedArtworks } from '@/services/likes';
import { Artwork } from '@/types/artwork';

export function useLikedArtworks() {
  const user = useAuthStore((state) => state.user);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<Date | undefined>(undefined);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    cursorRef.current = undefined;

    const result = await getLikedArtworks(user.id);

    if (result.success) {
      setArtworks(result.data.items);
      setHasMore(result.data.hasMore);
      cursorRef.current = result.data.lastCursor as Date | undefined;
    } else {
      setError(result.error.message);
    }

    setIsLoading(false);
    loadingRef.current = false;
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoadingMore(true);

    const result = await getLikedArtworks(user.id, cursorRef.current);

    if (result.success) {
      setArtworks((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newItems = result.data.items.filter((a) => !existingIds.has(a.id));
        return [...prev, ...newItems];
      });
      setHasMore(result.data.hasMore);
      cursorRef.current = result.data.lastCursor as Date | undefined;
    }

    setIsLoadingMore(false);
    loadingRef.current = false;
  }, [user, hasMore]);

  return { artworks, isLoading, isLoadingMore, hasMore, error, load, loadMore };
}
