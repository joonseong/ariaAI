import { useState, useCallback, useEffect } from 'react';
import { Artwork } from '@/types/artwork';
import * as artworksService from '@/services/artworks';

export function useArtworkDetail(artworkId: string) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await artworksService.getArtwork(artworkId);

    if (result.success) {
      setArtwork(result.data);
    } else {
      setError(result.error.message);
    }

    setIsLoading(false);
  }, [artworkId]);

  const refresh = useCallback(async () => {
    setError(null);

    const result = await artworksService.getArtwork(artworkId);

    if (result.success) {
      setArtwork(result.data);
    } else {
      setError(result.error.message);
    }
  }, [artworkId]);

  useEffect(() => {
    load();
  }, [load]);

  return { artwork, isLoading, error, refresh };
}
