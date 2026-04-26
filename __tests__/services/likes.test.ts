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

import { toggleLike, checkLiked, getLikedArtworks } from '@/services/likes';

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
mockStartAfter.mockImplementation((...args: unknown[]) => ({ _startAfter: args }));

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
  mockStartAfter.mockImplementation((...args: unknown[]) => ({ _startAfter: args }));
});

describe('toggleLike', () => {
  it('좋아요가 없으면 생성하고 liked: true를 반환한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(),
        update: jest.fn(),
      };
      return fn(tx);
    });

    const result = await toggleLike('user1', 'art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.liked).toBe(true);
    }
  });

  it('좋아요가 이미 있으면 삭제하고 liked: false를 반환한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        delete: jest.fn(),
        update: jest.fn(),
      };
      return fn(tx);
    });

    const result = await toggleLike('user1', 'art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.liked).toBe(false);
    }
  });

  it('Transaction으로 likes 문서와 artworks.likesCount를 동시에 처리한다', async () => {
    let txActions: { set?: boolean; update?: boolean; delete?: boolean } = {};
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(() => { txActions.set = true; }),
        update: jest.fn(() => { txActions.update = true; }),
        delete: jest.fn(() => { txActions.delete = true; }),
      };
      return fn(tx);
    });

    await toggleLike('user1', 'art-1');

    expect(txActions.set).toBe(true);
    expect(txActions.update).toBe(true);
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockRunTransaction.mockRejectedValue({ code: 'permission-denied' });

    const result = await toggleLike('user1', 'art-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('permission-denied');
    }
  });

  it('절대 throw하지 않는다', async () => {
    mockRunTransaction.mockRejectedValue(new Error('unexpected'));

    const result = await toggleLike('user1', 'art-1');

    expect(result.success).toBe(false);
  });
});

describe('checkLiked', () => {
  it('좋아요가 있으면 true를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const result = await checkLiked('user1', 'art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it('좋아요가 없으면 false를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await checkLiked('user1', 'art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(false);
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDoc.mockRejectedValue({ code: 'unavailable' });

    const result = await checkLiked('user1', 'art-1');

    expect(result.success).toBe(false);
  });
});

describe('getLikedArtworks', () => {
  const now = new Date();
  const firestoreTimestamp = { toDate: () => now };

  it('좋아요한 작품 목록을 반환한다', async () => {
    // First query returns like documents
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'user1_art-1',
          data: () => ({
            userId: 'user1',
            artworkId: 'art-1',
            createdAt: firestoreTimestamp,
          }),
        },
      ],
    });
    // Then getDoc for each artwork
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'art-1',
      data: () => ({
        authorId: 'user2',
        authorNickname: 'Artist',
        authorProfileImageUrl: null,
        title: 'Liked Art',
        description: '',
        imageUrls: ['https://img.jpg'],
        thumbnailUrl: 'https://img.jpg',
        tags: [],
        tool: 'Midjourney',
        prompt: null,
        hasPrompt: false,
        likesCount: 5,
        reportCount: 0,
        isHidden: false,
        createdAt: firestoreTimestamp,
        updatedAt: firestoreTimestamp,
      }),
    });

    const result = await getLikedArtworks('user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].id).toBe('art-1');
    }
  });

  it('좋아요한 작품이 삭제된 경우 목록에서 제외한다', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'user1_art-1',
          data: () => ({
            userId: 'user1',
            artworkId: 'art-1',
            createdAt: firestoreTimestamp,
          }),
        },
      ],
    });
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    const result = await getLikedArtworks('user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await getLikedArtworks('user1');

    expect(result.success).toBe(false);
  });
});
