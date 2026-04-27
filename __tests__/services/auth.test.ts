// Mock firebase/app — prevent real initialization
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

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import {
  signUpWithEmail,
  signInWithEmail,
  signOut as authSignOut,
  sendPasswordReset,
  getCurrentUser,
  deleteAccount,
} from '@/services/auth';

const mockCreateUser = createUserWithEmailAndPassword as jest.Mock;
const mockSignIn = signInWithEmailAndPassword as jest.Mock;
const mockSignOut = fbSignOut as jest.Mock;
const mockSendReset = sendPasswordResetEmail as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockServerTimestamp = serverTimestamp as jest.Mock;

// Setup doc mock to return identifiable refs
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

describe('signUpWithEmail', () => {
  it('성공 시 User 데이터를 반환한다', async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: 'uid-123' } });
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(),
      };
      await fn(tx);
    });

    const result = await signUpWithEmail({
      email: 'test@example.com',
      password: 'password1',
      nickname: 'TestUser',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('uid-123');
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.nickname).toBe('TestUser');
      expect(result.data.normalizedNickname).toBe('testuser');
      expect(result.data.loginProvider).toBe('email');
      expect(result.data.followersCount).toBe(0);
      expect(result.data.artworksCount).toBe(0);
      expect(result.data.isDeleted).toBe(false);
    }
  });

  it('닉네임이 이미 사용 중이면 실패를 반환한다', async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: 'uid-123' } });
    mockRunTransaction.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true }),
        set: jest.fn(),
      };
      await fn(tx);
    });

    const result = await signUpWithEmail({
      email: 'test@example.com',
      password: 'password1',
      nickname: 'TakenName',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('auth/nickname-taken');
    }
  });

  it('Firebase Auth 에러 시 Result failure를 반환한다', async () => {
    mockCreateUser.mockRejectedValue({ code: 'auth/email-already-in-use' });

    const result = await signUpWithEmail({
      email: 'test@example.com',
      password: 'password1',
      nickname: 'TestUser',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('auth/email-already-in-use');
      expect(result.error.message).toBe('이미 가입된 이메일입니다.');
    }
  });

  it('절대 throw하지 않는다', async () => {
    mockCreateUser.mockRejectedValue(new Error('unexpected'));

    const result = await signUpWithEmail({
      email: 'test@example.com',
      password: 'password1',
      nickname: 'TestUser',
    });

    expect(result.success).toBe(false);
  });
});

describe('signInWithEmail', () => {
  it('성공 시 Firestore에서 User 데이터를 조회하여 반환한다', async () => {
    const now = new Date();
    mockSignIn.mockResolvedValue({ user: { uid: 'uid-456' } });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'user@example.com',
        nickname: 'ExistingUser',
        normalizedNickname: 'existinguser',
        bio: 'hello',
        profileImageUrl: null,
        followersCount: 10,
        followingCount: 5,
        artworksCount: 3,
        bookmarksCount: 1,
        loginProvider: 'email',
        isDeleted: false,
        createdAt: { toDate: () => now },
        updatedAt: { toDate: () => now },
      }),
    });

    const result = await signInWithEmail('user@example.com', 'password1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('uid-456');
      expect(result.data.nickname).toBe('ExistingUser');
      expect(result.data.followersCount).toBe(10);
    }
  });

  it('Firestore에 유저 문서가 없으면 실패를 반환한다', async () => {
    mockSignIn.mockResolvedValue({ user: { uid: 'uid-456' } });
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await signInWithEmail('user@example.com', 'password1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('not-found');
    }
  });

  it('isDeleted가 true인 유저는 실패를 반환한다', async () => {
    mockSignIn.mockResolvedValue({ user: { uid: 'uid-456' } });
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'user@example.com',
        nickname: 'Deleted',
        normalizedNickname: 'deleted',
        bio: '',
        profileImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        artworksCount: 0,
        bookmarksCount: 0,
        pointBalance: 0,
        creatorPointBalance: 0,
        loginProvider: 'email',
        isDeleted: true,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      }),
    });

    const result = await signInWithEmail('user@example.com', 'password1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('auth/user-disabled');
    }
  });

  it('잘못된 비밀번호로 로그인 시 실패를 반환한다', async () => {
    mockSignIn.mockRejectedValue({ code: 'auth/wrong-password' });

    const result = await signInWithEmail('user@example.com', 'wrongpw1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('auth/wrong-password');
    }
  });
});

describe('signOut', () => {
  it('성공 시 Result<void> success를 반환한다', async () => {
    mockSignOut.mockResolvedValue(undefined);
    const result = await authSignOut();
    expect(result.success).toBe(true);
  });

  it('실패 시 에러를 반환하고 throw하지 않는다', async () => {
    mockSignOut.mockRejectedValue({ code: 'auth/network-request-failed' });
    const result = await authSignOut();
    expect(result.success).toBe(false);
  });
});

describe('sendPasswordReset', () => {
  it('성공 시 Result<void> success를 반환한다', async () => {
    mockSendReset.mockResolvedValue(undefined);
    const result = await sendPasswordReset('user@example.com');
    expect(result.success).toBe(true);
  });

  it('실패 시 에러를 반환하고 throw하지 않는다', async () => {
    mockSendReset.mockRejectedValue({ code: 'auth/user-not-found' });
    const result = await sendPasswordReset('no@example.com');
    expect(result.success).toBe(false);
  });
});

describe('getCurrentUser', () => {
  it('Firestore에서 유저를 조회하여 반환한다', async () => {
    const now = new Date();
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'test@test.com',
        nickname: 'Nick',
        normalizedNickname: 'nick',
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
        createdAt: { toDate: () => now },
        updatedAt: { toDate: () => now },
      }),
    });

    const result = await getCurrentUser('uid-789');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('uid-789');
      expect(result.data.createdAt).toBeInstanceOf(Date);
    }
  });

  it('유저 문서가 없으면 실패를 반환한다', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getCurrentUser('nonexistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('not-found');
    }
  });
});

describe('deleteAccount', () => {
  it('소프트 삭제 처리한다 (isDeleted = true)', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await deleteAccount('uid-123');

    expect(result.success).toBe(true);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-123' }),
      expect.objectContaining({ isDeleted: true }),
    );
  });

  it('실패 시 에러를 반환하고 throw하지 않는다', async () => {
    mockUpdateDoc.mockRejectedValue({ code: 'permission-denied' });

    const result = await deleteAccount('uid-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('permission-denied');
    }
  });
});
