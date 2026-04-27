import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';
import { User, SignUpInput } from '@/types/user';

interface FirestoreTimestamp {
  toDate: () => Date;
}

function toUser(uid: string, data: Record<string, unknown>): User {
  return {
    id: uid,
    email: data.email as string,
    nickname: data.nickname as string,
    normalizedNickname: data.normalizedNickname as string,
    bio: data.bio as string,
    profileImageUrl: (data.profileImageUrl as string | null) ?? null,
    followersCount: data.followersCount as number,
    followingCount: data.followingCount as number,
    artworksCount: data.artworksCount as number,
    bookmarksCount: data.bookmarksCount as number,
    pointBalance: (data.pointBalance as number) ?? 0,
    creatorPointBalance: (data.creatorPointBalance as number) ?? 0,
    loginProvider: data.loginProvider as 'email' | 'google' | 'apple',
    isDeleted: data.isDeleted as boolean,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
    updatedAt: (data.updatedAt as FirestoreTimestamp).toDate(),
  };
}

export async function signUpWithEmail(
  input: SignUpInput,
): Promise<Result<User>> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password,
    );
    const uid = credential.user.uid;
    const normalized = input.nickname.toLowerCase().trim();
    const now = new Date();

    await runTransaction(db, async (transaction) => {
      const nicknameRef = doc(db, 'nicknames', normalized);
      const nicknameSnap = await transaction.get(nicknameRef);

      if (nicknameSnap.exists()) {
        throw { code: 'auth/nickname-taken', message: '이미 사용 중인 닉네임입니다.' };
      }

      const userRef = doc(db, 'users', uid);
      transaction.set(nicknameRef, {
        userId: uid,
        createdAt: serverTimestamp(),
      });
      transaction.set(userRef, {
        email: input.email,
        nickname: input.nickname,
        normalizedNickname: normalized,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    return {
      success: true,
      data: {
        id: uid,
        email: input.email,
        nickname: input.nickname,
        normalizedNickname: normalized,
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
        createdAt: now,
        updatedAt: now,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Result<User>> {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const uid = credential.user.uid;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' },
      };
    }

    const data = userSnap.data();

    if (data.isDeleted) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: { code: 'auth/user-disabled', message: '비활성화된 계정입니다.' },
      };
    }

    return { success: true, data: toUser(uid, data) };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signInWithGoogle(): Promise<Result<User>> {
  // Google 소셜 로그인은 네이티브 SDK 설정(google-services.json 등)이 필요합니다.
  // 함수 시그니처만 구현하고, 실제 로직은 Firebase 프로젝트 생성 후 구현합니다.
  return {
    success: false,
    error: {
      code: 'auth/not-implemented',
      message: 'Google 로그인은 Firebase 프로젝트 설정 후 사용할 수 있습니다.',
    },
  };
}

export async function signInWithApple(): Promise<Result<User>> {
  // Apple 소셜 로그인은 Apple Developer 계정 설정이 필요합니다.
  // 함수 시그니처만 구현하고, 실제 로직은 별도 설정 후 구현합니다.
  return {
    success: false,
    error: {
      code: 'auth/not-implemented',
      message: 'Apple 로그인은 Firebase 프로젝트 설정 후 사용할 수 있습니다.',
    },
  };
}

export async function signOut(): Promise<Result<void>> {
  try {
    await firebaseSignOut(auth);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function sendPasswordReset(
  email: string,
): Promise<Result<void>> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getCurrentUser(uid: string): Promise<Result<User>> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' },
      };
    }

    return { success: true, data: toUser(uid, userSnap.data()) };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteAccount(uid: string): Promise<Result<void>> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteCurrentUser(): Promise<Result<void>> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'auth/no-current-user', message: '로그인이 필요합니다.' },
      };
    }
    await deleteUser(currentUser);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export function subscribeToAuthState(
  callback: (uid: string | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    callback(firebaseUser?.uid ?? null);
  });
}
