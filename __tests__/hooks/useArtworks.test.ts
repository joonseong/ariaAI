jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));
jest.mock('@/services/artworks');

import { renderHook, act } from '@testing-library/react-native';
import * as artworksService from '@/services/artworks';
import { useArtworks } from '@/hooks/useArtworks';
import { useFeedStore } from '@/stores/feedStore';
import { Artwork } from '@/types/artwork';

const mockGetFeedArtworks = artworksService.getFeedArtworks as jest.MockedFunction<
  typeof artworksService.getFeedArtworks
>;

function createMockArtwork(id: string, createdAt?: Date): Artwork {
  return {
    id,
    authorId: 'author-1',
    authorNickname: 'author',
    authorProfileImageUrl: null,
    title: `Artwork ${id}`,
    description: '',
    imageUrls: ['url'],
    thumbnailUrl: 'url',
    tags: [],
    tool: 'Midjourney',
    likesCount: 0,
    reportCount: 0,
    isHidden: false,
    createdAt: createdAt ?? new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useFeedStore.getState().reset();
});

describe('useArtworks', () => {
  describe('loadFeed', () => {
    it('초기 피드를 로드하고 스토어에 저장한다', async () => {
      const artworks = [createMockArtwork('1'), createMockArtwork('2')];
      mockGetFeedArtworks.mockResolvedValue({
        success: true,
        data: {
          items: artworks,
          hasMore: true,
          lastCursor: new Date('2026-01-01'),
        },
      });

      const { result } = renderHook(() => useArtworks());

      await act(async () => {
        await result.current.loadFeed();
      });

      expect(result.current.artworks).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('로딩 실패 시 에러를 설정한다', async () => {
      mockGetFeedArtworks.mockResolvedValue({
        success: false,
        error: { code: 'unavailable', message: '서버에 연결할 수 없습니다.' },
      });

      const { result } = renderHook(() => useArtworks());

      await act(async () => {
        await result.current.loadFeed();
      });

      expect(result.current.artworks).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('서버에 연결할 수 없습니다.');
    });
  });

  describe('loadMore', () => {
    it('추가 페이지를 로드하고 기존 데이터에 추가한다', async () => {
      const firstPage = [createMockArtwork('1'), createMockArtwork('2')];
      const secondPage = [createMockArtwork('3'), createMockArtwork('4')];
      const cursor = new Date('2026-01-01');

      // Load first page
      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: firstPage, hasMore: true, lastCursor: cursor },
      });

      const { result } = renderHook(() => useArtworks());

      await act(async () => {
        await result.current.loadFeed();
      });

      // Load second page
      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: secondPage, hasMore: false, lastCursor: null },
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.artworks).toHaveLength(4);
      expect(result.current.hasMore).toBe(false);
      expect(mockGetFeedArtworks).toHaveBeenCalledTimes(2);
      expect(mockGetFeedArtworks).toHaveBeenLastCalledWith(cursor);
    });

    it('hasMore가 false이면 추가 로딩하지 않는다', async () => {
      const artworks = [createMockArtwork('1')];
      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: artworks, hasMore: false, lastCursor: null },
      });

      const { result } = renderHook(() => useArtworks());

      await act(async () => {
        await result.current.loadFeed();
      });

      mockGetFeedArtworks.mockClear();

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockGetFeedArtworks).not.toHaveBeenCalled();
    });

    it('중복 작품을 필터링한다', async () => {
      const firstPage = [createMockArtwork('1'), createMockArtwork('2')];
      const cursor = new Date('2026-01-01');

      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: firstPage, hasMore: true, lastCursor: cursor },
      });

      const { result } = renderHook(() => useArtworks());

      await act(async () => {
        await result.current.loadFeed();
      });

      // Second page has a duplicate (id: '2') and a new one (id: '3')
      const secondPage = [createMockArtwork('2'), createMockArtwork('3')];
      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: secondPage, hasMore: false, lastCursor: null },
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.artworks).toHaveLength(3);
      const ids = result.current.artworks.map((a) => a.id);
      expect(ids).toEqual(['1', '2', '3']);
    });
  });

  describe('refresh', () => {
    it('피드를 새로고침한다', async () => {
      const oldArtworks = [createMockArtwork('1')];
      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: oldArtworks, hasMore: true, lastCursor: new Date() },
      });

      const { result } = renderHook(() => useArtworks());

      await act(async () => {
        await result.current.loadFeed();
      });

      const newArtworks = [createMockArtwork('new-1'), createMockArtwork('new-2')];
      mockGetFeedArtworks.mockResolvedValueOnce({
        success: true,
        data: { items: newArtworks, hasMore: false, lastCursor: null },
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.artworks).toHaveLength(2);
      expect(result.current.artworks[0].id).toBe('new-1');
      expect(result.current.isRefreshing).toBe(false);
    });
  });
});
