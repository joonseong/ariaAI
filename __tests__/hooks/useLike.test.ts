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
jest.mock('@/services/likes');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as likesService from '@/services/likes';
import { useLike } from '@/hooks/useLike';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';
import { User } from '@/types/user';

const mockToggleLike = likesService.toggleLike as jest.MockedFunction<
  typeof likesService.toggleLike
>;

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  nickname: 'tester',
  normalizedNickname: 'tester',
  bio: '',
  profileImageUrl: null,
  followersCount: 0,
  followingCount: 0,
  artworksCount: 0,
  bookmarksCount: 0,
    pointBalance: 0,
    creatorPointBalance: 0,
  loginProvider: 'email',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().clear();
  useFeedStore.getState().reset();
});

describe('useLike', () => {
  it('좋아요 성공 시 UI를 즉시 반영한다 (낙관적 업데이트)', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleLike.mockResolvedValue({ success: true, data: { liked: true } });

    const { result } = renderHook(() => useLike('artwork-1', false, 10));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.liked).toBe(true);
    expect(result.current.count).toBe(11);
  });

  it('좋아요 취소 성공 시 UI를 즉시 반영한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleLike.mockResolvedValue({ success: true, data: { liked: false } });

    const { result } = renderHook(() => useLike('artwork-1', true, 10));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.liked).toBe(false);
    expect(result.current.count).toBe(9);
  });

  it('좋아요 실패 시 UI를 원래대로 롤백한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleLike.mockResolvedValue({
      success: false,
      error: { code: 'unavailable', message: '서버에 연결할 수 없습니다.' },
    });

    const { result } = renderHook(() => useLike('artwork-1', false, 10));

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.liked).toBe(false);
    expect(result.current.count).toBe(10);
  });

  it('비회원이면 toggle을 무시한다', async () => {
    // user is null (not logged in)
    const { result } = renderHook(() => useLike('artwork-1', false, 10));

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockToggleLike).not.toHaveBeenCalled();
    expect(result.current.liked).toBe(false);
    expect(result.current.count).toBe(10);
  });

  it('중복 요청을 방지한다 (pendingRef)', async () => {
    useAuthStore.getState().setUser(mockUser);

    let resolveToggle: (value: { success: true; data: { liked: boolean } }) => void;
    mockToggleLike.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve;
        }),
    );

    const { result } = renderHook(() => useLike('artwork-1', false, 10));

    // First toggle - starts pending
    act(() => {
      result.current.toggle();
    });

    // Second toggle - should be ignored because pending
    act(() => {
      result.current.toggle();
    });

    expect(mockToggleLike).toHaveBeenCalledTimes(1);

    // Resolve the pending request
    await act(async () => {
      resolveToggle!({ success: true, data: { liked: true } });
    });
  });

  it('피드 스토어의 좋아요 상태도 동기화한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    useFeedStore.getState().setArtworks([
      {
        id: 'artwork-1',
        authorId: 'author-1',
        authorNickname: 'author',
        authorProfileImageUrl: null,
        title: 'Test',
        description: '',
        imageUrls: ['url'],
        thumbnailUrl: 'url',
        tags: [],
        tool: 'Midjourney',
        prompt: null,
        hasPrompt: false,
        likesCount: 10,
        reportCount: 0,
        isHidden: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    mockToggleLike.mockResolvedValue({ success: true, data: { liked: true } });

    const { result } = renderHook(() => useLike('artwork-1', false, 10));

    await act(async () => {
      await result.current.toggle();
    });

    const feedArtwork = useFeedStore.getState().artworks.find((a) => a.id === 'artwork-1');
    expect(feedArtwork?.likesCount).toBe(11);
  });
});
