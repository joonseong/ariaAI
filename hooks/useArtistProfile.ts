import { useState, useCallback, useRef } from 'react';
import * as usersService from '@/services/users';
import * as artworksService from '@/services/artworks';
import { User } from '@/types/user';
import { Artwork } from '@/types/artwork';

export function useArtistProfile(artistId: string) {
  const [artist, setArtist] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreArtworks, setHasMoreArtworks] = useState(true);
  const [isLoadingMoreArtworks, setIsLoadingMoreArtworks] = useState(false);
  const artworkCursorRef = useRef<Date | undefined>(undefined);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    artworkCursorRef.current = undefined;
    setHasMoreArtworks(true);

    const [profileResult, artworksResult] = await Promise.all([
      usersService.getUserProfile(artistId),
      artworksService.getUserArtworks(artistId),
    ]);

    if (!profileResult.success) {
      setError(profileResult.error.message);
      setIsLoading(false);
      return;
    }

    setArtist(profileResult.data);

    if (artworksResult.success) {
      setArtworks(artworksResult.data.items);
      setHasMoreArtworks(artworksResult.data.hasMore);
      artworkCursorRef.current = artworksResult.data.lastCursor as Date | undefined;
    }

    setIsLoading(false);
  }, [artistId]);

  const loadMoreArtworks = useCallback(async () => {
    if (isLoadingMoreArtworks || !hasMoreArtworks) return;
    setIsLoadingMoreArtworks(true);

    const result = await artworksService.getUserArtworks(
      artistId,
      artworkCursorRef.current,
    );

    if (result.success) {
      setArtworks((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newItems = result.data.items.filter((a) => !existingIds.has(a.id));
        return [...prev, ...newItems];
      });
      setHasMoreArtworks(result.data.hasMore);
      artworkCursorRef.current = result.data.lastCursor as Date | undefined;
    }

    setIsLoadingMoreArtworks(false);
  }, [artistId, isLoadingMoreArtworks, hasMoreArtworks]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    artist,
    artworks,
    isLoading,
    error,
    hasMoreArtworks,
    isLoadingMoreArtworks,
    load,
    loadMoreArtworks,
    refresh,
  };
}
