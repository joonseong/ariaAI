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
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

import { createReport, checkReported } from '@/services/reports';

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockServerTimestamp = serverTimestamp as jest.Mock;
const mockIncrement = increment as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockImplementation((_db: unknown, col: string, id: string) => ({
    path: `${col}/${id}`,
    id,
  }));
  mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');
  mockIncrement.mockImplementation((n: number) => ({ increment: n }));
});

describe('createReport', () => {
  it('신고 문서를 생성하고 reportId를 반환한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn().mockResolvedValueOnce({ exists: () => false })
                     .mockResolvedValueOnce({ exists: () => true, data: () => ({ reportCount: 0 }) }),
        set: jest.fn(),
        update: jest.fn(),
      };
      await fn(tx);
    });

    const result = await createReport('user1', 'artwork', 'art-1', 'spam');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user1_artwork_art-1');
    }
  });

  it('이미 신고한 경우 failure를 반환한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        set: jest.fn(),
        update: jest.fn(),
      };
      await fn(tx);
    });

    const result = await createReport('user1', 'artwork', 'art-1', 'spam');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('already-reported');
    }
  });

  it('작품 신고 시 reportCount를 증가시킨다', async () => {
    let updateCalled = false;
    let updateData: unknown = null;

    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ reportCount: 2 }),
          }),
        set: jest.fn(),
        update: jest.fn((_ref: unknown, data: unknown) => {
          updateCalled = true;
          updateData = data;
        }),
      };
      await fn(tx);
    });

    await createReport('user1', 'artwork', 'art-1', 'offensive');

    expect(updateCalled).toBe(true);
    expect(updateData).toMatchObject({ reportCount: { increment: 1 } });
  });

  it('신고 5건 이상이면 작품을 자동 숨김 처리한다', async () => {
    let updateData: Record<string, unknown> = {};

    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ reportCount: 4 }), // 4 + 1 = 5 → 숨김
          }),
        set: jest.fn(),
        update: jest.fn((_ref: unknown, data: Record<string, unknown>) => {
          updateData = data;
        }),
      };
      await fn(tx);
    });

    await createReport('user1', 'artwork', 'art-1', 'spam');

    expect(updateData.isHidden).toBe(true);
  });

  it('신고 4건일 때는 자동 숨김 처리하지 않는다', async () => {
    let updateData: Record<string, unknown> = {};

    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ reportCount: 3 }), // 3 + 1 = 4 → 숨김 안 함
          }),
        set: jest.fn(),
        update: jest.fn((_ref: unknown, data: Record<string, unknown>) => {
          updateData = data;
        }),
      };
      await fn(tx);
    });

    await createReport('user1', 'artwork', 'art-1', 'spam');

    expect(updateData.isHidden).toBeUndefined();
  });

  it('detail 파라미터를 포함하여 저장한다', async () => {
    let savedData: Record<string, unknown> = {};

    mockRunTransaction.mockImplementation(async (_db: unknown, fn: Function) => {
      const tx = {
        get: jest.fn()
          .mockResolvedValueOnce({ exists: () => false })
          .mockResolvedValueOnce({ exists: () => false }),
        set: jest.fn((_ref: unknown, data: Record<string, unknown>) => {
          savedData = data;
        }),
        update: jest.fn(),
      };
      await fn(tx);
    });

    await createReport('user1', 'user', 'user-2', 'other', '부적절한 내용');

    expect(savedData.description).toBe('부적절한 내용');
    expect(savedData.reason).toBe('other');
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockRunTransaction.mockRejectedValue({ code: 'unavailable' });

    const result = await createReport('user1', 'artwork', 'art-1', 'spam');

    expect(result.success).toBe(false);
  });

  it('절대 throw하지 않는다', async () => {
    mockRunTransaction.mockRejectedValue(new Error('unexpected'));

    const result = await createReport('user1', 'artwork', 'art-1', 'spam');

    expect(result.success).toBe(false);
  });
});

describe('checkReported', () => {
  it('신고한 적 없으면 false를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await checkReported('user1', 'artwork', 'art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(false);
    }
  });

  it('이미 신고했으면 true를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const result = await checkReported('user1', 'artwork', 'art-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it('reportId가 올바른 형식으로 생성된다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await checkReported('user1', 'guestbook', 'msg-1');

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'reports',
      'user1_guestbook_msg-1',
    );
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockGetDoc.mockRejectedValue({ code: 'permission-denied' });

    const result = await checkReported('user1', 'artwork', 'art-1');

    expect(result.success).toBe(false);
  });
});
