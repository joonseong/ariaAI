import { create } from 'zustand';
import { Artwork } from '@/types/artwork';

interface FeedState {
  artworks: Artwork[];
  cursor: Date | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  setArtworks: (artworks: Artwork[]) => void;
  appendArtworks: (artworks: Artwork[], cursor: Date | null, hasMore: boolean) => void;
  reset: () => void;
  updateArtworkLike: (artworkId: string, liked: boolean, likesCount: number) => void;
  removeArtwork: (artworkId: string) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setCursor: (cursor: Date | null) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  artworks: [],
  cursor: null,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,

  setArtworks: (artworks) => set({ artworks }),

  appendArtworks: (newArtworks, cursor, hasMore) =>
    set((state) => {
      const existingIds = new Set(state.artworks.map((a) => a.id));
      const uniqueNew = newArtworks.filter((a) => !existingIds.has(a.id));
      return {
        artworks: [...state.artworks, ...uniqueNew],
        cursor,
        hasMore,
      };
    }),

  reset: () =>
    set({
      artworks: [],
      cursor: null,
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
    }),

  updateArtworkLike: (artworkId, _liked, likesCount) =>
    set((state) => ({
      artworks: state.artworks.map((a) =>
        a.id === artworkId ? { ...a, likesCount } : a,
      ),
    })),

  removeArtwork: (artworkId) =>
    set((state) => ({
      artworks: state.artworks.filter((a) => a.id !== artworkId),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  setError: (error) => set({ error }),
  setCursor: (cursor) => set({ cursor }),
  setHasMore: (hasMore) => set({ hasMore }),
}));
