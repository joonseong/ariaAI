import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as artworksService from '@/services/artworks';
import { Result } from '@/types/common';

export function useArtworkDelete() {
  const user = useAuthStore((state) => state.user);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteArtwork = useCallback(
    async (artworkId: string): Promise<Result<void>> => {
      if (!user) {
        return {
          success: false,
          error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
        };
      }

      const artworkResult = await artworksService.getArtwork(artworkId);
      if (!artworkResult.success) {
        return artworkResult;
      }

      setIsDeleting(true);
      const result = await artworksService.deleteArtwork(
        artworkId,
        artworkResult.data.imageUrls,
      );
      setIsDeleting(false);

      return result;
    },
    [user],
  );

  return { isDeleting, deleteArtwork };
}
