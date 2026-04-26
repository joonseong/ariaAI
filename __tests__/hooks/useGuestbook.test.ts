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
jest.mock('@/services/guestbooks');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as guestbooksService from '@/services/guestbooks';
import { useGuestbook } from '@/hooks/useGuestbook';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types/user';
import { GuestbookMessage } from '@/types/guestbook';

const mockGetMessages = guestbooksService.getGuestbookMessages as jest.MockedFunction<
  typeof guestbooksService.getGuestbookMessages
>;
const mockCreateMessage = guestbooksService.createGuestbookMessage as jest.MockedFunction<
  typeof guestbooksService.createGuestbookMessage
>;
const mockDeleteMessage = guestbooksService.deleteGuestbookMessage as jest.MockedFunction<
  typeof guestbooksService.deleteGuestbookMessage
>;
const mockCreateReply = guestbooksService.createReply as jest.MockedFunction<
  typeof guestbooksService.createReply
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
  loginProvider: 'email',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeMessage = (id: string): GuestbookMessage => ({
  id,
  authorId: 'author-1',
  authorNickname: 'author',
  authorProfileImageUrl: null,
  content: `message ${id}`,
  replyContent: null,
  replyCreatedAt: null,
  createdAt: new Date(),
});

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().clear();
  mockGetMessages.mockResolvedValue({
    success: true,
    data: { items: [], hasMore: false, lastCursor: null },
  });
});

describe('useGuestbook', () => {
  it('메시지를 로드한다', async () => {
    const messages = [makeMessage('msg-1'), makeMessage('msg-2')];
    mockGetMessages.mockResolvedValue({
      success: true,
      data: { items: messages, hasMore: false, lastCursor: null },
    });

    const { result } = renderHook(() => useGuestbook('artist-1'));

    await act(async () => {
      await result.current.loadMessages();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('메시지 전송 성공 시 로컬 상태에 즉시 추가된다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockCreateMessage.mockResolvedValue({ success: true, data: 'new-msg-id' });

    const { result } = renderHook(() => useGuestbook('artist-1'));

    await act(async () => {
      await result.current.loadMessages();
    });

    await act(async () => {
      await result.current.sendMessage('안녕하세요');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('안녕하세요');
    expect(result.current.messages[0].authorId).toBe('user-1');
  });

  it('비회원이 메시지 전송 시도 시 에러를 반환한다', async () => {
    const { result } = renderHook(() => useGuestbook('artist-1'));

    let sendResult: { success: boolean } | undefined;
    await act(async () => {
      sendResult = await result.current.sendMessage('안녕하세요');
    });

    expect(sendResult?.success).toBe(false);
    expect(mockCreateMessage).not.toHaveBeenCalled();
  });

  it('1분 내 3회 초과 전송 시 스팸으로 차단한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    mockCreateMessage.mockResolvedValue({ success: true, data: 'msg-id' });

    const { result } = renderHook(() => useGuestbook('artist-1'));

    await act(async () => {
      await result.current.loadMessages();
    });

    // 3회 전송
    await act(async () => {
      await result.current.sendMessage('메시지 1');
      await result.current.sendMessage('메시지 2');
      await result.current.sendMessage('메시지 3');
    });

    // 4번째는 차단됨
    let fourthResult: { success: boolean; error?: { code: string } } | undefined;
    await act(async () => {
      fourthResult = await result.current.sendMessage('메시지 4') as typeof fourthResult;
    });

    expect(fourthResult?.success).toBe(false);
    expect((fourthResult as { success: false; error: { code: string } })?.error?.code).toBe(
      'rate-limited',
    );
  });

  it('메시지 삭제 시 로컬 상태에서 즉시 제거된다', async () => {
    useAuthStore.getState().setUser(mockUser);
    const messages = [makeMessage('msg-1'), makeMessage('msg-2')];
    mockGetMessages.mockResolvedValue({
      success: true,
      data: { items: messages, hasMore: false, lastCursor: null },
    });
    mockDeleteMessage.mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useGuestbook('artist-1'));

    await act(async () => {
      await result.current.loadMessages();
    });

    expect(result.current.messages).toHaveLength(2);

    await act(async () => {
      await result.current.deleteMessage('msg-1');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('msg-2');
  });

  it('답글 전송 성공 시 로컬 메시지 상태를 업데이트한다', async () => {
    useAuthStore.getState().setUser(mockUser);
    const messages = [makeMessage('msg-1')];
    mockGetMessages.mockResolvedValue({
      success: true,
      data: { items: messages, hasMore: false, lastCursor: null },
    });
    mockCreateReply.mockResolvedValue({ success: true, data: undefined });

    const { result } = renderHook(() => useGuestbook('artist-1'));

    await act(async () => {
      await result.current.loadMessages();
    });

    await act(async () => {
      await result.current.sendReply('msg-1', '답글입니다');
    });

    expect(result.current.messages[0].replyContent).toBe('답글입니다');
  });

  it('추가 로딩이 가능하다 (loadMore)', async () => {
    const firstPage = [makeMessage('msg-1')];
    const secondPage = [makeMessage('msg-2')];
    const cursor = new Date();

    mockGetMessages
      .mockResolvedValueOnce({
        success: true,
        data: { items: firstPage, hasMore: true, lastCursor: cursor },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { items: secondPage, hasMore: false, lastCursor: null },
      });

    const { result } = renderHook(() => useGuestbook('artist-1'));

    await act(async () => {
      await result.current.loadMessages();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
  });
});
