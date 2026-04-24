jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));
jest.mock('@/services/auth');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as authService from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types/user';

const mockSignUp = authService.signUpWithEmail as jest.MockedFunction<
  typeof authService.signUpWithEmail
>;
const mockSignIn = authService.signInWithEmail as jest.MockedFunction<
  typeof authService.signInWithEmail
>;
const mockSignOut = authService.signOut as jest.MockedFunction<
  typeof authService.signOut
>;
const mockSendPasswordReset =
  authService.sendPasswordReset as jest.MockedFunction<
    typeof authService.sendPasswordReset
  >;
const mockGetCurrentUser = authService.getCurrentUser as jest.MockedFunction<
  typeof authService.getCurrentUser
>;
const mockDeleteAccount = authService.deleteAccount as jest.MockedFunction<
  typeof authService.deleteAccount
>;
const mockSubscribeToAuthState =
  authService.subscribeToAuthState as jest.MockedFunction<
    typeof authService.subscribeToAuthState
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
  // Default: subscribeToAuthState does nothing (returns unsubscribe fn)
  mockSubscribeToAuthState.mockReturnValue(jest.fn());
});

describe('useAuth', () => {
  describe('signUp', () => {
    it('성공 시 스토어에 유저를 저장한다', async () => {
      mockSignUp.mockResolvedValue({ success: true, data: mockUser });

      const { result } = renderHook(() => useAuth());

      let signUpResult: Awaited<ReturnType<typeof result.current.signUp>>;
      await act(async () => {
        signUpResult = await result.current.signUp({
          email: 'test@example.com',
          password: 'password123',
          nickname: 'tester',
        });
      });

      expect(signUpResult!.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('실패 시 스토어를 변경하지 않는다', async () => {
      mockSignUp.mockResolvedValue({
        success: false,
        error: { code: 'auth/email-already-in-use', message: '이미 가입된 이메일입니다.' },
      });

      const { result } = renderHook(() => useAuth());

      let signUpResult: Awaited<ReturnType<typeof result.current.signUp>>;
      await act(async () => {
        signUpResult = await result.current.signUp({
          email: 'test@example.com',
          password: 'password123',
          nickname: 'tester',
        });
      });

      expect(signUpResult!.success).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signIn', () => {
    it('성공 시 스토어에 유저를 저장한다', async () => {
      mockSignIn.mockResolvedValue({ success: true, data: mockUser });

      const { result } = renderHook(() => useAuth());

      let signInResult: Awaited<ReturnType<typeof result.current.signIn>>;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInResult!.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('실패 시 스토어를 변경하지 않는다', async () => {
      mockSignIn.mockResolvedValue({
        success: false,
        error: { code: 'auth/wrong-password', message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      });

      const { result } = renderHook(() => useAuth());

      let signInResult: Awaited<ReturnType<typeof result.current.signIn>>;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrong');
      });

      expect(signInResult!.success).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('로그아웃 시 스토어를 초기화한다', async () => {
      mockSignOut.mockResolvedValue({ success: true, data: undefined });
      // Pre-set user in store
      useAuthStore.getState().setUser(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('서비스 함수를 호출하고 결과를 반환한다', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true, data: undefined });

      const { result } = renderHook(() => useAuth());

      let resetResult: Awaited<ReturnType<typeof result.current.resetPassword>>;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });

      expect(resetResult!.success).toBe(true);
      expect(mockSendPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('deleteAccount', () => {
    it('성공 시 로그아웃하고 스토어를 초기화한다', async () => {
      mockDeleteAccount.mockResolvedValue({ success: true, data: undefined });
      mockSignOut.mockResolvedValue({ success: true, data: undefined });
      useAuthStore.getState().setUser(mockUser);

      const { result } = renderHook(() => useAuth());

      let deleteResult: Awaited<ReturnType<typeof result.current.deleteAccount>>;
      await act(async () => {
        deleteResult = await result.current.deleteAccount();
      });

      expect(deleteResult!.success).toBe(true);
      expect(mockDeleteAccount).toHaveBeenCalledWith('user-1');
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('로그인하지 않은 상태에서 에러를 반환한다', async () => {
      const { result } = renderHook(() => useAuth());

      let deleteResult: Awaited<ReturnType<typeof result.current.deleteAccount>>;
      await act(async () => {
        deleteResult = await result.current.deleteAccount();
      });

      expect(deleteResult!.success).toBe(false);
      if (!deleteResult!.success) {
        expect(deleteResult!.error.code).toBe('auth/no-user');
      }
    });

    it('실패 시 스토어를 변경하지 않는다', async () => {
      mockDeleteAccount.mockResolvedValue({
        success: false,
        error: { code: 'unknown', message: '알 수 없는 오류' },
      });
      useAuthStore.getState().setUser(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('initializeAuth (onAuthStateChanged)', () => {
    it('유효한 유저가 있으면 스토어에 저장하고 로딩을 해제한다', async () => {
      mockGetCurrentUser.mockResolvedValue({ success: true, data: mockUser });

      let authCallback: (uid: string | null) => void;
      mockSubscribeToAuthState.mockImplementation((cb) => {
        authCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback!('user-1');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('uid가 null이면 유저를 null로 설정하고 로딩을 해제한다', async () => {
      let authCallback: (uid: string | null) => void;
      mockSubscribeToAuthState.mockImplementation((cb) => {
        authCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback!(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('삭제된 유저는 로그아웃 처리한다', async () => {
      const deletedUser = { ...mockUser, isDeleted: true };
      mockGetCurrentUser.mockResolvedValue({ success: true, data: deletedUser });
      mockSignOut.mockResolvedValue({ success: true, data: undefined });

      let authCallback: (uid: string | null) => void;
      mockSubscribeToAuthState.mockImplementation((cb) => {
        authCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback!('user-1');
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('유저 조회 실패 시 로그아웃 처리한다', async () => {
      mockGetCurrentUser.mockResolvedValue({
        success: false,
        error: { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' },
      });
      mockSignOut.mockResolvedValue({ success: true, data: undefined });

      let authCallback: (uid: string | null) => void;
      mockSubscribeToAuthState.mockImplementation((cb) => {
        authCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await authCallback!('user-1');
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('언마운트 시 리스너를 해제한다', () => {
      const unsubscribe = jest.fn();
      mockSubscribeToAuthState.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth());
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
