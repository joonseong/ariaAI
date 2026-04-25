import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '@/stores/feedStore';
import * as artworksService from '@/services/artworks';

export function useArtworks() {
  const store = useFeedStore();
  const loadingRef = useRef(false);

  const loadFeed = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    store.setLoading(true);
    store.setError(null);

    const result = await artworksService.getFeedArtworks();

    if (result.success) {
      store.setArtworks(result.data.items);
      store.setCursor(result.data.lastCursor as Date | null);
      store.setHasMore(result.data.hasMore);
    } else {
      store.setError(result.error.message);
    }

    store.setLoading(false);
    loadingRef.current = false;
  }, [store]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || store.isLoadingMore || !store.hasMore) return;
    loadingRef.current = true;
    store.setLoadingMore(true);

    const result = await artworksService.getFeedArtworks(
      store.cursor ?? undefined,
    );

    if (result.success) {
      store.appendArtworks(
        result.data.items,
        result.data.lastCursor as Date | null,
        result.data.hasMore,
      );
    } else {
      store.setError(result.error.message);
    }

    store.setLoadingMore(false);
    loadingRef.current = false;
  }, [store]);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    store.setRefreshing(true);
    store.setError(null);

    const result = await artworksService.getFeedArtworks();

    if (result.success) {
      store.setArtworks(result.data.items);
      store.setCursor(result.data.lastCursor as Date | null);
      store.setHasMore(result.data.hasMore);
    } else {
      store.setError(result.error.message);
    }

    store.setRefreshing(false);
    loadingRef.current = false;
  }, [store]);

  return {
    artworks: store.artworks,
    isLoading: store.isLoading,
    isLoadingMore: store.isLoadingMore,
    isRefreshing: store.isRefreshing,
    hasMore: store.hasMore,
    error: store.error,
    loadFeed,
    loadMore,
    refresh,
  };
}
