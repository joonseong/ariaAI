import { useCallback, useRef } from 'react';
import { useFeedStore } from '@/stores/feedStore';
import * as artworksService from '@/services/artworks';

export function useArtworks() {
  const artworks = useFeedStore((s) => s.artworks);
  const isLoading = useFeedStore((s) => s.isLoading);
  const isLoadingMore = useFeedStore((s) => s.isLoadingMore);
  const isRefreshing = useFeedStore((s) => s.isRefreshing);
  const hasMore = useFeedStore((s) => s.hasMore);
  const error = useFeedStore((s) => s.error);
  const loadingRef = useRef(false);

  const loadFeed = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const store = useFeedStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const result = await artworksService.getFeedArtworks();

      if (result.success) {
        const s = useFeedStore.getState();
        s.setArtworks(result.data.items);
        s.setCursor(result.data.lastCursor as Date | null);
        s.setHasMore(result.data.hasMore);
      } else {
        useFeedStore.getState().setError(result.error.message);
      }
    } finally {
      useFeedStore.getState().setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    const store = useFeedStore.getState();
    if (loadingRef.current || store.isLoadingMore || !store.hasMore) return;
    loadingRef.current = true;
    store.setLoadingMore(true);

    try {
      const result = await artworksService.getFeedArtworks(
        store.cursor ?? undefined,
      );

      if (result.success) {
        useFeedStore.getState().appendArtworks(
          result.data.items,
          result.data.lastCursor as Date | null,
          result.data.hasMore,
        );
      } else {
        useFeedStore.getState().setError(result.error.message);
      }
    } finally {
      useFeedStore.getState().setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const store = useFeedStore.getState();
    store.setRefreshing(true);
    store.setError(null);

    try {
      const result = await artworksService.getFeedArtworks();

      if (result.success) {
        const s = useFeedStore.getState();
        s.setArtworks(result.data.items);
        s.setCursor(result.data.lastCursor as Date | null);
        s.setHasMore(result.data.hasMore);
      } else {
        useFeedStore.getState().setError(result.error.message);
      }
    } finally {
      useFeedStore.getState().setRefreshing(false);
      loadingRef.current = false;
    }
  }, []);

  return {
    artworks,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    loadFeed,
    loadMore,
    refresh,
  };
}
