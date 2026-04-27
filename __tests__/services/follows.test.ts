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
  runTransaction,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
} from 'firebase/firestore';

import {
  toggleFollow,
  checkFollowing,
  getFollowers,
  getFollowing,
} from '@/services/follows';

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockServerTimestamp = serverTimestamp as jest.Mock;
const mockIncrement = increment as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockQuery = query as jest.Mock;
const mockWhere = where as jest.Mock;
const mockOrderBy = orderBy as jest.Mock;
const mockFirestoreLimit = firestoreLimit as jest.Mock;
const mockStartAfter = startAfter as jest.Mock;

mockDoc.mockImplementation((_db: unknown, col: string, id: string) => ({
  path: `${col}/${id}`,
  id,
}));
mockCollection.mockImplementation((_db: unknown, col: string) => ({
  path: col,
}));
mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');
mockIncrement.mockImplementation((n: number) => ({ increment: n }));
mockQuery.mockImplementation((...args: unknown[]) => ({ _query: args }));
mockWhere.mockImplementation((...args: unknown[]) => ({ _where: args }));
mockOrderBy.mockImplementation((...args: unknown[]) => ({ _orderBy: args }));
mockFirestoreLimit.mockImplementation((n: number) => ({ _limit: n }));
mockStartAfter.mockImplementation((...args: unknown[]) => ({
  _startAfter: args,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockImplementation((_db: unknown, col: string, id: string) => ({
    path: `${col}/${id}`,
    id,
  }));
  mockCollection.mockImplementation((_db: unknown, col: string) => ({
    path: col,
  }));
  mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');
  mockIncrement.mockImplementation((n: number) => ({ increment: n }));
  mockQuery.mockImplementation((...args: unknown[]) => ({ _query: args }));
  mockWhere.mockImplementation((...args: unknown[]) => ({ _where: args }));
  mockOrderBy.mockImplementation((...args: unknown[]) => ({ _orderBy: args }));
  mockFirestoreLimit.mockImplementation((n: number) => ({ _limit: n }));
  mockStartAfter.mockImplementation((...args: unknown[]) => ({
    _startAfter: args,
  }));
});

describe('toggleFollow', () => {
  it('팔로우가 없으면 생성하고 following: true를 반환한다', async () => {
    mockRunTransaction.mockImplementation(
      async (_db: unknown, fn: Function) => {
        const tx = {
          get: jest.fn().mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
          update: jest.fn(),
        };
        return fn(tx);
      },
    );

    const result = await toggleFollow('user1', 'user2');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.following).toBe(true);
    }
  });

  it('팔로우가 이미 있으면 삭제하고 following: false를 반환한다', async () => {
    mockRunTransaction.mockImplementation(
      async (_db: unknown, fn: Function) => {
        const tx = {
          get: jest.fn().mockResolvedValue({ exists: () => true }),
          delete: jest.fn(),
          update: jest.fn(),
        };
        return fn(tx);
      },
    );

    const result = await toggleFollow('user1', 'user2');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.following).toBe(false);
    }
  });

  it('Transaction으로 follows 문서와 카운트를 동시에 처리한다', async () => {
    let txActions: { set?: boolean; update?: number } = {};
    mockRunTransaction.mockImplementation(
      async (_db: unknown, fn: Function) => {
        const tx = {
          get: jest.fn().mockResolvedValue({ exists: () => false }),
          set: jest.fn(() => {
            txActions.set = true;
          }),
          update: jest.fn(() => {
            txActions.update = (txActions.update ?? 0) + 1;
          }),
          delete: jest.fn(),
        };
        return fn(tx);
      },
    );

    await toggleFollow('user1', 'user2');

    expect(txActions.set).toBe(true);
    expect(txActions.update).toBe(2);
  });

  it('자기 자신을 팔로우하면 에러를 반환한다', async () => {
    const result = await toggleFollow('user1', 'user1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('invalid-argument');
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockRunTransaction.mockRejectedValue({ code: 'permission-denied' });

    const result = await toggleFollow('user1', 'user2');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('permission-denied');
    }
  });

  it('절대 throw하지 않는다', async () => {
    mockRunTransaction.mockRejectedValue(new Error('unexpected'));

    const result = await toggleFollow('user1', 'user2');

    expect(result.success).toBe(false);
  });
});

describe('checkFollowing', () => {
  it('팔로우 중이면 true를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const result = await checkFollowing('user1', 'user2');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it('팔로우하지 않으면 false를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await checkFollowing('user1', 'user2');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(false);
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDoc.mockRejectedValue({ code: 'unavailable' });

    const result = await checkFollowing('user1', 'user2');

    expect(result.success).toBe(false);
  });
});

describe('getFollowers', () => {
  const now = new Date();
  const firestoreTimestamp = { toDate: () => now };

  it('팔로워 목록을 반환한다', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'user2_user1',
          data: () => ({
            followerId: 'user2',
            followingId: 'user1',
            createdAt: firestoreTimestamp,
          }),
        },
      ],
    });
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'user2',
      data: () => ({
        email: 'user2@test.com',
        nickname: 'User2',
        normalizedNickname: 'user2',
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
        createdAt: firestoreTimestamp,
        updatedAt: firestoreTimestamp,
      }),
    });

    const result = await getFollowers('user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('user2');
    }
  });

  it('탈퇴한 유저는 목록에서 제외한다', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'user2_user1',
          data: () => ({
            followerId: 'user2',
            followingId: 'user1',
            createdAt: firestoreTimestamp,
          }),
        },
      ],
    });
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const result = await getFollowers('user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await getFollowers('user1');

    expect(result.success).toBe(false);
  });
});

describe('getFollowing', () => {
  const now = new Date();
  const firestoreTimestamp = { toDate: () => now };

  it('팔로잉 목록을 반환한다', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'user1_user3',
          data: () => ({
            followerId: 'user1',
            followingId: 'user3',
            createdAt: firestoreTimestamp,
          }),
        },
      ],
    });
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'user3',
      data: () => ({
        email: 'user3@test.com',
        nickname: 'User3',
        normalizedNickname: 'user3',
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
        createdAt: firestoreTimestamp,
        updatedAt: firestoreTimestamp,
      }),
    });

    const result = await getFollowing('user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('user3');
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await getFollowing('user1');

    expect(result.success).toBe(false);
  });
});
