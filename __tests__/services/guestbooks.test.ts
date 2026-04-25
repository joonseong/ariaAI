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

import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';

import {
  createGuestbookMessage,
  createReply,
  deleteGuestbookMessage,
  getGuestbookMessages,
} from '@/services/guestbooks';

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockAddDoc = addDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockServerTimestamp = serverTimestamp as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockQuery = query as jest.Mock;
const mockOrderBy = orderBy as jest.Mock;
const mockFirestoreLimit = firestoreLimit as jest.Mock;
const mockStartAfter = startAfter as jest.Mock;

mockDoc.mockImplementation(
  (_db: unknown, ...segments: string[]) => ({
    path: segments.join('/'),
    id: segments[segments.length - 1],
  }),
);
mockCollection.mockImplementation(
  (_db: unknown, ...segments: string[]) => ({
    path: segments.join('/'),
  }),
);
mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');
mockQuery.mockImplementation((...args: unknown[]) => ({ _query: args }));
mockOrderBy.mockImplementation((...args: unknown[]) => ({ _orderBy: args }));
mockFirestoreLimit.mockImplementation((n: number) => ({ _limit: n }));
mockStartAfter.mockImplementation((...args: unknown[]) => ({
  _startAfter: args,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockImplementation(
    (_db: unknown, ...segments: string[]) => ({
      path: segments.join('/'),
      id: segments[segments.length - 1],
    }),
  );
  mockCollection.mockImplementation(
    (_db: unknown, ...segments: string[]) => ({
      path: segments.join('/'),
    }),
  );
  mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');
  mockQuery.mockImplementation((...args: unknown[]) => ({ _query: args }));
  mockOrderBy.mockImplementation((...args: unknown[]) => ({
    _orderBy: args,
  }));
  mockFirestoreLimit.mockImplementation((n: number) => ({ _limit: n }));
  mockStartAfter.mockImplementation((...args: unknown[]) => ({
    _startAfter: args,
  }));
});

describe('createGuestbookMessage', () => {
  it('메시지를 생성하고 ID를 반환한다', async () => {
    mockAddDoc.mockResolvedValue({ id: 'msg-1' });

    const result = await createGuestbookMessage(
      'artist-1',
      'user1',
      'UserNick',
      '멋진 작품이에요!',
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('msg-1');
    }
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockAddDoc.mockRejectedValue({ code: 'permission-denied' });

    const result = await createGuestbookMessage(
      'artist-1',
      'user1',
      'UserNick',
      '멋진 작품이에요!',
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('permission-denied');
    }
  });

  it('절대 throw하지 않는다', async () => {
    mockAddDoc.mockRejectedValue(new Error('unexpected'));

    const result = await createGuestbookMessage(
      'artist-1',
      'user1',
      'UserNick',
      '멋진 작품이에요!',
    );

    expect(result.success).toBe(false);
  });
});

describe('createReply', () => {
  it('답글을 작성한다', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await createReply('msg-1', 'artist-1', '감사합니다!');

    expect(result.success).toBe(true);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockUpdateDoc.mockRejectedValue({ code: 'not-found' });

    const result = await createReply('msg-1', 'artist-1', '감사합니다!');

    expect(result.success).toBe(false);
  });
});

describe('deleteGuestbookMessage', () => {
  it('메시지 작성자가 삭제할 수 있다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ authorId: 'user1' }),
    });
    mockDeleteDoc.mockResolvedValue(undefined);

    const result = await deleteGuestbookMessage('msg-1', 'user1', 'artist-1');

    expect(result.success).toBe(true);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('포트폴리오 주인이 삭제할 수 있다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ authorId: 'user1' }),
    });
    mockDeleteDoc.mockResolvedValue(undefined);

    const result = await deleteGuestbookMessage('msg-1', 'artist-1', 'artist-1');

    expect(result.success).toBe(true);
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('권한 없는 사용자는 삭제할 수 없다', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ authorId: 'user1' }),
    });

    const result = await deleteGuestbookMessage(
      'msg-1',
      'other-user',
      'artist-1',
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('permission-denied');
    }
  });

  it('존재하지 않는 메시지는 에러를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await deleteGuestbookMessage('msg-1', 'user1', 'artist-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('not-found');
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDoc.mockRejectedValue({ code: 'unavailable' });

    const result = await deleteGuestbookMessage('msg-1', 'user1', 'artist-1');

    expect(result.success).toBe(false);
  });
});

describe('getGuestbookMessages', () => {
  const now = new Date();
  const firestoreTimestamp = { toDate: () => now };

  it('방명록 목록을 반환한다', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'msg-1',
          data: () => ({
            authorId: 'user1',
            authorNickname: 'User1',
            authorProfileImageUrl: null,
            content: '멋진 작품이에요!',
            replyContent: null,
            replyCreatedAt: null,
            createdAt: firestoreTimestamp,
          }),
        },
      ],
    });

    const result = await getGuestbookMessages('artist-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('msg-1');
      expect(result.data.items[0].content).toBe('멋진 작품이에요!');
    }
  });

  it('빈 방명록을 반환한다', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const result = await getGuestbookMessages('artist-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
      expect(result.data.hasMore).toBe(false);
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await getGuestbookMessages('artist-1');

    expect(result.success).toBe(false);
  });
});
