jest.mock('firebase/app', () => ({ initializeApp: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));
jest.mock('@/services/reports');

import { renderHook, act } from '@testing-library/react-native';
import * as reportsService from '@/services/reports';
import { useReport } from '@/hooks/useReport';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types/user';

const mockCreateReport = reportsService.createReport as jest.MockedFunction<
  typeof reportsService.createReport
>;
const mockCheckReported = reportsService.checkReported as jest.MockedFunction<
  typeof reportsService.checkReported
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
});

describe('useReport', () => {
  describe('submitReport', () => {
    it('비회원이면 에러를 반환한다', async () => {
      const { result } = renderHook(() => useReport());

      let returnValue: Awaited<ReturnType<typeof result.current.submitReport>>;
      await act(async () => {
        returnValue = await result.current.submitReport('artwork', 'artwork-1', 'spam');
      });

      expect(returnValue!).toEqual({
        success: false,
        error: expect.objectContaining({ code: 'auth/unauthenticated' }),
      });
      expect(mockCheckReported).not.toHaveBeenCalled();
      expect(mockCreateReport).not.toHaveBeenCalled();
    });

    it('이미 신고한 콘텐츠는 에러를 반환한다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: true });

      const { result } = renderHook(() => useReport());

      let returnValue: Awaited<ReturnType<typeof result.current.submitReport>>;
      await act(async () => {
        returnValue = await result.current.submitReport('artwork', 'artwork-1', 'spam');
      });

      expect(returnValue!).toEqual({
        success: false,
        error: expect.objectContaining({ message: '이미 신고한 콘텐츠입니다.' }),
      });
      expect(mockCreateReport).not.toHaveBeenCalled();
    });

    it('신고 성공 시 success: true를 반환한다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: false });
      mockCreateReport.mockResolvedValue({ success: true, data: 'report-id' });

      const { result } = renderHook(() => useReport());

      let returnValue: Awaited<ReturnType<typeof result.current.submitReport>>;
      await act(async () => {
        returnValue = await result.current.submitReport('artwork', 'artwork-1', 'spam');
      });

      expect(returnValue!).toEqual({ success: true, data: undefined });
      expect(mockCreateReport).toHaveBeenCalledWith(
        'user-1',
        'artwork',
        'artwork-1',
        'spam',
        undefined,
      );
    });

    it('detail 파라미터가 전달된다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: false });
      mockCreateReport.mockResolvedValue({ success: true, data: 'report-id' });

      const { result } = renderHook(() => useReport());

      await act(async () => {
        await result.current.submitReport('artwork', 'artwork-1', 'other', '상세 사유');
      });

      expect(mockCreateReport).toHaveBeenCalledWith(
        'user-1',
        'artwork',
        'artwork-1',
        'other',
        '상세 사유',
      );
    });

    it('신고 실패 시 에러를 반환한다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: false });
      mockCreateReport.mockResolvedValue({
        success: false,
        error: { code: 'unavailable', message: '서버에 연결할 수 없습니다.' },
      });

      const { result } = renderHook(() => useReport());

      let returnValue: Awaited<ReturnType<typeof result.current.submitReport>>;
      await act(async () => {
        returnValue = await result.current.submitReport('artwork', 'artwork-1', 'spam');
      });

      expect(returnValue!).toEqual({
        success: false,
        error: expect.objectContaining({ code: 'unavailable' }),
      });
    });

    it('isSubmitting이 요청 중에 true가 된다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: false });

      let resolveCreate!: (value: { success: true; data: string }) => void;
      mockCreateReport.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          }),
      );

      const { result } = renderHook(() => useReport());

      act(() => {
        void result.current.submitReport('artwork', 'artwork-1', 'spam');
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        resolveCreate({ success: true, data: 'report-id' });
        await Promise.resolve();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('checkAlreadyReported', () => {
    it('비회원이면 false를 반환한다', async () => {
      const { result } = renderHook(() => useReport());

      let returnValue: boolean;
      await act(async () => {
        returnValue = await result.current.checkAlreadyReported('artwork', 'artwork-1');
      });

      expect(returnValue!).toBe(false);
      expect(mockCheckReported).not.toHaveBeenCalled();
    });

    it('신고한 콘텐츠이면 true를 반환한다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: true });

      const { result } = renderHook(() => useReport());

      let returnValue: boolean;
      await act(async () => {
        returnValue = await result.current.checkAlreadyReported('artwork', 'artwork-1');
      });

      expect(returnValue!).toBe(true);
    });

    it('신고하지 않은 콘텐츠이면 false를 반환한다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({ success: true, data: false });

      const { result } = renderHook(() => useReport());

      let returnValue: boolean;
      await act(async () => {
        returnValue = await result.current.checkAlreadyReported('artwork', 'artwork-1');
      });

      expect(returnValue!).toBe(false);
    });

    it('서비스 호출 실패 시 false를 반환한다', async () => {
      useAuthStore.getState().setUser(mockUser);
      mockCheckReported.mockResolvedValue({
        success: false,
        error: { code: 'unavailable', message: '서버 오류' },
      });

      const { result } = renderHook(() => useReport());

      let returnValue: boolean;
      await act(async () => {
        returnValue = await result.current.checkAlreadyReported('artwork', 'artwork-1');
      });

      expect(returnValue!).toBe(false);
    });
  });
});
