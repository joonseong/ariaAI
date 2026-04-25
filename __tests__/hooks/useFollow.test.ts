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
jest.mock('@/services/follows');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as followsService from '@/services/follows';
import { useFollow } from '@/hooks/useFollow';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types/user';

const mockToggleFollow = followsService.toggleFollow as jest.MockedFunction<
  typeof followsService.toggleFollow
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
  loginProvider: 'email',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().clear();
});

describe('useFollow', () => {
  it('팔로우 성공 시 UI를 즉시 반영한다 (낙관적 업데이트)', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleFollow.mockResolvedValue({
      success: true,
      data: { following: true },
    });

    const { result } = renderHook(() =>
      useFollow('target-user', false, 10),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.following).toBe(true);
    expect(result.current.followersCount).toBe(11);
  });

  it('언팔로우 성공 시 UI를 즉시 반영한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleFollow.mockResolvedValue({
      success: true,
      data: { following: false },
    });

    const { result } = renderHook(() =>
      useFollow('target-user', true, 10),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.following).toBe(false);
    expect(result.current.followersCount).toBe(9);
  });

  it('팔로우 실패 시 UI를 원래대로 롤백한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleFollow.mockResolvedValue({
      success: false,
      error: { code: 'unavailable', message: '서버에 연결할 수 없습니다.' },
    });

    const { result } = renderHook(() =>
      useFollow('target-user', false, 10),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.following).toBe(false);
    expect(result.current.followersCount).toBe(10);
  });

  it('비회원이면 toggle을 무시한다', async () => {
    const { result } = renderHook(() =>
      useFollow('target-user', false, 10),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(mockToggleFollow).not.toHaveBeenCalled();
    expect(result.current.following).toBe(false);
    expect(result.current.followersCount).toBe(10);
  });

  it('중복 요청을 방지한다 (pendingRef)', async () => {
    useAuthStore.getState().setUser(mockUser);

    let resolveToggle: (value: {
      success: true;
      data: { following: boolean };
    }) => void;
    mockToggleFollow.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useFollow('target-user', false, 10),
    );

    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.toggle();
    });

    expect(mockToggleFollow).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveToggle!({ success: true, data: { following: true } });
    });
  });

  it('언팔로우 시 팔로워 수가 음수가 되지 않는다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockToggleFollow.mockResolvedValue({
      success: true,
      data: { following: false },
    });

    const { result } = renderHook(() =>
      useFollow('target-user', true, 0),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.followersCount).toBe(0);
  });
});
