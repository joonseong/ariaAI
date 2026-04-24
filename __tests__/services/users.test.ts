jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({}));

jest.mock('firebase/firestore');

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  updateNickname,
  updateProfile,
  checkNicknameAvailable,
} from '@/services/users';

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockServerTimestamp = serverTimestamp as jest.Mock;

mockDoc.mockImplementation((_db: unknown, collection: string, id: string) => ({
  path: `${collection}/${id}`,
  id,
}));
mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockImplementation((_db: unknown, collection: string, id: string) => ({
    path: `${collection}/${id}`,
    id,
  }));
  mockServerTimestamp.mockReturnValue('SERVER_TIMESTAMP');
});

describe('updateNickname', () => {
  it('Transaction으로 닉네임을 변경한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        delete: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      };
      await fn(tx);
      expect(tx.get).toHaveBeenCalled();
      expect(tx.delete).toHaveBeenCalled();
      expect(tx.set).toHaveBeenCalled();
      expect(tx.update).toHaveBeenCalled();
    });

    const result = await updateNickname('uid-1', 'OldNick', 'NewNick');

    expect(result.success).toBe(true);
    expect(mockRunTransaction).toHaveBeenCalled();
  });

  it('닉네임이 이미 사용 중이면 실패를 반환한다', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        delete: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      };
      await fn(tx);
    });

    const result = await updateNickname('uid-1', 'OldNick', 'TakenNick');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('auth/nickname-taken');
    }
  });

  it('트랜잭션 에러 시 Result failure를 반환한다', async () => {
    mockRunTransaction.mockRejectedValue({ code: 'unavailable' });

    const result = await updateNickname('uid-1', 'Old', 'New');

    expect(result.success).toBe(false);
  });
});

describe('updateProfile', () => {
  it('프로필 필드를 업데이트한다', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await updateProfile('uid-1', { bio: 'New bio' });

    expect(result.success).toBe(true);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-1' }),
      expect.objectContaining({ bio: 'New bio' }),
    );
  });

  it('실패 시 에러를 반환하고 throw하지 않는다', async () => {
    mockUpdateDoc.mockRejectedValue({ code: 'permission-denied' });

    const result = await updateProfile('uid-1', { bio: 'fail' });

    expect(result.success).toBe(false);
  });
});

describe('checkNicknameAvailable', () => {
  it('사용 가능한 닉네임이면 true를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await checkNicknameAvailable('available');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(true);
    }
  });

  it('이미 사용 중인 닉네임이면 false를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const result = await checkNicknameAvailable('taken');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(false);
    }
  });

  it('Firestore 에러 시 Result failure를 반환한다', async () => {
    mockGetDoc.mockRejectedValue({ code: 'unavailable' });

    const result = await checkNicknameAvailable('error');

    expect(result.success).toBe(false);
  });
});
