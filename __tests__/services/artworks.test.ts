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

jest.mock('@/services/storage');

import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

import { uploadImages, deleteImage } from '@/services/storage';

import {
  createArtwork,
  getArtwork,
  deleteArtwork,
  updateArtwork,
  getFeedArtworks,
  getUserArtworks,
} from '@/services/artworks';

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockAddDoc = addDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockQuery = query as jest.Mock;
const mockWhere = where as jest.Mock;
const mockOrderBy = orderBy as jest.Mock;
const mockFirestoreLimit = firestoreLimit as jest.Mock;
const mockStartAfter = startAfter as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockServerTimestamp = serverTimestamp as jest.Mock;
const mockIncrement = increment as jest.Mock;
const mockUploadImages = uploadImages as jest.MockedFunction<typeof uploadImages>;
const mockDeleteImage = deleteImage as jest.MockedFunction<typeof deleteImage>;

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

const now = new Date();
const firestoreTimestamp = { toDate: () => now };

function makeArtworkDoc(id: string, overrides?: Record<string, unknown>) {
  return {
    id,
    data: () => ({
      authorId: 'user1',
      authorNickname: 'Artist',
      authorProfileImageUrl: null,
      title: 'Test Artwork',
      description: 'A test artwork',
      imageUrls: ['https://storage.example.com/img1.jpg'],
      thumbnailUrl: 'https://storage.example.com/img1.jpg',
      tags: ['midjourney'],
      tool: 'Midjourney',
        prompt: null,
        hasPrompt: false,
      likesCount: 0,
      reportCount: 0,
      isHidden: false,
      createdAt: firestoreTimestamp,
      updatedAt: firestoreTimestamp,
      ...overrides,
    }),
  };
}

describe('createArtwork', () => {
  const formData = {
    title: 'New Art',
    description: 'Description',
    images: ['file:///img1.jpg', 'file:///img2.jpg'],
    tags: ['stable-diffusion'],
    tool: 'Stable Diffusion',
    prompt: '',
    authorNickname: 'Artist',
    authorProfileImageUrl: null,
  };

  it('이미지 업로드 + Firestore 문서 생성 후 artworkId를 반환한다', async () => {
    mockUploadImages.mockResolvedValue({
      success: true,
      data: ['https://storage.example.com/img1.jpg', 'https://storage.example.com/img2.jpg'],
    });
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        set: jest.fn(),
        update: jest.fn(),
      };
      return fn(tx);
    });
    mockDoc.mockImplementation((_dbOrCol: unknown, colOrId?: string, id?: string) => {
      if (id) return { path: `${colOrId}/${id}`, id };
      return { path: `artworks/${colOrId}`, id: colOrId };
    });
    mockCollection.mockReturnValue({ path: 'artworks' });

    const result = await createArtwork('user1', formData);

    expect(result.success).toBe(true);
    expect(mockUploadImages).toHaveBeenCalled();
  });

  it('이미지 업로드 실패 시 Result failure를 반환한다', async () => {
    mockUploadImages.mockResolvedValue({
      success: false,
      error: { code: 'storage/unauthorized', message: '파일 업로드 권한이 없습니다.' },
    });

    const result = await createArtwork('user1', formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('storage/unauthorized');
    }
  });

  it('Firestore 문서 생성 실패 시 업로드된 이미지를 롤백 삭제한다', async () => {
    mockUploadImages.mockResolvedValue({
      success: true,
      data: ['https://storage.example.com/img1.jpg'],
    });
    mockRunTransaction.mockRejectedValue({ code: 'permission-denied' });
    mockDeleteImage.mockResolvedValue({ success: true, data: undefined });

    const result = await createArtwork('user1', formData);

    expect(result.success).toBe(false);
    expect(mockDeleteImage).toHaveBeenCalledWith('https://storage.example.com/img1.jpg');
  });

  it('절대 throw하지 않는다', async () => {
    mockUploadImages.mockRejectedValue(new Error('unexpected'));

    const result = await createArtwork('user1', formData);

    expect(result.success).toBe(false);
  });
});

describe('getArtwork', () => {
  it('성공 시 Artwork 데이터를 반환한다', async () => {
    const artworkDoc = makeArtworkDoc('art-1');
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: artworkDoc.id,
      data: artworkDoc.data,
    });

    const result = await getArtwork('art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('art-1');
      expect(result.data.title).toBe('Test Artwork');
      expect(result.data.createdAt).toBeInstanceOf(Date);
    }
  });

  it('존재하지 않는 작품은 failure를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getArtwork('nonexistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('not-found');
    }
  });

  it('절대 throw하지 않는다', async () => {
    mockGetDoc.mockRejectedValue(new Error('unexpected'));

    const result = await getArtwork('art-1');

    expect(result.success).toBe(false);
  });
});

describe('deleteArtwork', () => {
  it('Firestore 문서 삭제 + Storage 이미지 삭제를 수행한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ authorId: 'user1' }),
        }),
        delete: jest.fn(),
        update: jest.fn(),
      };
      return fn(tx);
    });
    mockDeleteImage.mockResolvedValue({ success: true, data: undefined });

    const result = await deleteArtwork('art-1', ['https://img1.jpg']);

    expect(result.success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith('https://img1.jpg');
  });

  it('Firestore 삭제 실패 시 Result failure를 반환한다', async () => {
    mockRunTransaction.mockRejectedValue({ code: 'permission-denied' });

    const result = await deleteArtwork('art-1', ['https://img1.jpg']);

    expect(result.success).toBe(false);
  });
});

describe('updateArtwork', () => {
  it('성공 시 Result<void> success를 반환한다', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await updateArtwork('art-1', { title: 'Updated Title' });

    expect(result.success).toBe(true);
    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockUpdateDoc.mockRejectedValue({ code: 'permission-denied' });

    const result = await updateArtwork('art-1', { title: 'Updated' });

    expect(result.success).toBe(false);
  });
});

describe('getFeedArtworks', () => {
  it('작품 목록과 페이지네이션 정보를 반환한다', async () => {
    const docs = [makeArtworkDoc('art-1'), makeArtworkDoc('art-2')];
    mockGetDocs.mockResolvedValue({
      docs: docs.map((d) => ({
        id: d.id,
        data: d.data,
      })),
    });

    const result = await getFeedArtworks();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].id).toBe('art-1');
    }
  });

  it('결과가 페이지 사이즈보다 적으면 hasMore가 false이다', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'art-1', data: makeArtworkDoc('art-1').data }],
    });

    const result = await getFeedArtworks();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasMore).toBe(false);
    }
  });

  it('커서를 전달하면 startAfter를 사용한다', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const cursor = new Date();

    await getFeedArtworks(cursor);

    expect(mockStartAfter).toHaveBeenCalled();
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'unavailable' });

    const result = await getFeedArtworks();

    expect(result.success).toBe(false);
  });
});

describe('getUserArtworks', () => {
  it('특정 사용자의 작품 목록을 반환한다', async () => {
    const docs = [makeArtworkDoc('art-1')];
    mockGetDocs.mockResolvedValue({
      docs: docs.map((d) => ({
        id: d.id,
        data: d.data,
      })),
    });

    const result = await getUserArtworks('user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
    }
  });

  it('실패 시 Result failure를 반환한다', async () => {
    mockGetDocs.mockRejectedValue({ code: 'permission-denied' });

    const result = await getUserArtworks('user1');

    expect(result.success).toBe(false);
  });
});
