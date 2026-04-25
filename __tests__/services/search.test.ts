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
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

import {
  searchArtworks,
  searchUsers,
  searchByTag,
  getPopularTags,
} from '@/services/search';

const mockCollection = collection as jest.Mock;
const mockQuery = query as jest.Mock;
const mockWhere = where as jest.Mock;
const mockOrderBy = orderBy as jest.Mock;
const mockFirestoreLimit = firestoreLimit as jest.Mock;
const mockStartAfter = startAfter as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockTimestamp = Timestamp as jest.Mocked<typeof Timestamp>;

const now = new Date();
const firestoreTimestamp = { toDate: () => now };

function makeArtworkDoc(id: string, overrides?: Record<string, unknown>) {
  return {
    id,
    data: () => ({
      authorId: 'user1',
      authorNickname: 'Artist',
      authorProfileImageUrl: null,
      title: '환상의 숲',
      description: 'Test artwork',
      imageUrls: ['https://example.com/img.jpg'],
      thumbnailUrl: 'https://example.com/img.jpg',
      tags: ['Midjourney'],
      tool: 'Midjourney',
      likesCount: 10,
      reportCount: 0,
      isHidden: false,
      createdAt: firestoreTimestamp,
      updatedAt: firestoreTimestamp,
      ...overrides,
    }),
  };
}

function makeUserDoc(id: string, overrides?: Record<string, unknown>) {
  return {
    id,
    data: () => ({
      email: 'test@example.com',
      nickname: '아리아작가',
      normalizedNickname: '아리아작가',
      bio: '안녕하세요',
      profileImageUrl: null,
      followersCount: 0,
      followingCount: 0,
      artworksCount: 0,
      bookmarksCount: 0,
      loginProvider: 'email',
      isDeleted: false,
      createdAt: firestoreTimestamp,
      updatedAt: firestoreTimestamp,
      ...overrides,
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockImplementation((_db: unknown, col: string) => ({ path: col }));
  mockQuery.mockImplementation((...args: unknown[]) => ({ _query: args }));
  mockWhere.mockImplementation((...args: unknown[]) => ({ _where: args }));
  mockOrderBy.mockImplementation((...args: unknown[]) => ({ _orderBy: args }));
  mockFirestoreLimit.mockImplementation((n: number) => ({ _limit: n }));
  mockStartAfter.mockImplementation((...args: unknown[]) => ({ _startAfter: args }));
  (mockTimestamp.fromDate as jest.Mock) = jest.fn((d: Date) => ({ seconds: d.getTime() / 1000 }));
});

describe('searchArtworks', () => {
  it('빈 쿼리는 빈 결과를 반환한다 (Firestore 쿼리 없음)', async () => {
    const result = await searchArtworks('');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
      expect(result.data.hasMore).toBe(false);
    }
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('공백만 있는 쿼리도 빈 결과를 반환한다', async () => {
    const result = await searchArtworks('   ');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
    }
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('유효한 쿼리로 작품 목록을 반환한다', async () => {
    const docs = [makeArtworkDoc('art-1'), makeArtworkDoc('art-2')];
    mockGetDocs.mockResolvedValue({
      docs: docs.map((d) => ({ id: d.id, data: d.data })),
    });

    const result = await searchArtworks('환상');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].id).toBe('art-1');
    }
    expect(mockGetDocs).toHaveBeenCalled();
  });

  it('prefix 매칭 where 조건이 포함된다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await searchArtworks('환상');

    expect(mockWhere).toHaveBeenCalledWith('title', '>=', '환상');
    expect(mockWhere).toHaveBeenCalledWith('title', '<=', '환상\uf8ff');
  });

  it('결과 수가 pageSize보다 적으면 hasMore가 false이다', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'art-1', data: makeArtworkDoc('art-1').data }],
    });

    const result = await searchArtworks('환상');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasMore).toBe(false);
    }
  });

  it('커서를 전달하면 startAfter를 호출한다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const cursor = new Date();

    await searchArtworks('환상', cursor);

    expect(mockStartAfter).toHaveBeenCalled();
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await searchArtworks('환상');

    expect(result.success).toBe(false);
  });

  it('쿼리가 50자를 초과하면 잘린다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const longQuery = 'a'.repeat(60);

    await searchArtworks(longQuery);

    expect(mockWhere).toHaveBeenCalledWith('title', '>=', 'a'.repeat(50));
  });
});

describe('searchUsers', () => {
  it('빈 쿼리는 빈 결과를 반환한다', async () => {
    const result = await searchUsers('');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
    }
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('유효한 쿼리로 사용자 목록을 반환한다', async () => {
    const docs = [makeUserDoc('user-1'), makeUserDoc('user-2')];
    mockGetDocs.mockResolvedValue({
      docs: docs.map((d) => ({ id: d.id, data: d.data })),
    });

    const result = await searchUsers('아리아');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].id).toBe('user-1');
    }
  });

  it('normalizedNickname prefix 매칭 조건이 포함된다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await searchUsers('아리아');

    expect(mockWhere).toHaveBeenCalledWith('normalizedNickname', '>=', '아리아');
    expect(mockWhere).toHaveBeenCalledWith('normalizedNickname', '<=', '아리아\uf8ff');
  });

  it('쿼리를 소문자로 변환한다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await searchUsers('Artist');

    expect(mockWhere).toHaveBeenCalledWith('normalizedNickname', '>=', 'artist');
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await searchUsers('아리아');

    expect(result.success).toBe(false);
  });
});

describe('searchByTag', () => {
  it('빈 태그는 빈 결과를 반환한다', async () => {
    const result = await searchByTag('');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
    }
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('태그로 작품 목록을 반환한다', async () => {
    const docs = [makeArtworkDoc('art-1')];
    mockGetDocs.mockResolvedValue({
      docs: docs.map((d) => ({ id: d.id, data: d.data })),
    });

    const result = await searchByTag('Midjourney');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
    }
  });

  it('array-contains 조건이 포함된다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await searchByTag('Midjourney');

    expect(mockWhere).toHaveBeenCalledWith('tags', 'array-contains', 'Midjourney');
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await searchByTag('Midjourney');

    expect(result.success).toBe(false);
  });
});

describe('getPopularTags', () => {
  it('태그 빈도순으로 최대 10개를 반환한다', async () => {
    const docs = [
      makeArtworkDoc('art-1', { tags: ['Midjourney', 'fantasy'] }),
      makeArtworkDoc('art-2', { tags: ['Midjourney', 'landscape'] }),
      makeArtworkDoc('art-3', { tags: ['DALL-E', 'fantasy'] }),
    ];
    mockGetDocs.mockResolvedValue({
      docs: docs.map((d) => ({ id: d.id, data: d.data })),
    });

    const result = await getPopularTags();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0]).toBe('Midjourney'); // 2번 등장
      expect(result.data[1]).toBe('fantasy');    // 2번 등장
      expect(result.data.length).toBeLessThanOrEqual(10);
    }
  });

  it('작품이 없으면 빈 배열을 반환한다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const result = await getPopularTags();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await getPopularTags();

    expect(result.success).toBe(false);
  });
});
