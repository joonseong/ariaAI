import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';
import { User, UserProfileUpdate } from '@/types/user';

interface FirestoreTimestamp {
  toDate: () => Date;
}

function toUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    email: data.email as string,
    nickname: data.nickname as string,
    normalizedNickname: data.normalizedNickname as string,
    bio: data.bio as string,
    profileImageUrl: (data.profileImageUrl as string | null) ?? null,
    followersCount: data.followersCount as number,
    followingCount: data.followingCount as number,
    artworksCount: data.artworksCount as number,
    bookmarksCount: data.bookmarksCount as number,
    loginProvider: data.loginProvider as 'email' | 'google' | 'apple',
    isDeleted: data.isDeleted as boolean,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
    updatedAt: (data.updatedAt as FirestoreTimestamp).toDate(),
  };
}

export async function updateNickname(
  userId: string,
  oldNickname: string,
  newNickname: string,
): Promise<Result<void>> {
  const normalized = newNickname.toLowerCase().trim();

  try {
    await runTransaction(db, async (transaction) => {
      const nicknameRef = doc(db, 'nicknames', normalized);
      const nicknameSnap = await transaction.get(nicknameRef);

      if (nicknameSnap.exists()) {
        throw {
          code: 'auth/nickname-taken',
          message: '이미 사용 중인 닉네임입니다.',
        };
      }

      const oldRef = doc(
        db,
        'nicknames',
        oldNickname.toLowerCase().trim(),
      );
      transaction.delete(oldRef);

      transaction.set(nicknameRef, {
        userId,
        createdAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', userId);
      transaction.update(userRef, {
        nickname: newNickname,
        normalizedNickname: normalized,
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function updateProfile(
  userId: string,
  data: UserProfileUpdate,
): Promise<Result<void>> {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profileImageUrl !== undefined)
      updateData.profileImageUrl = data.profileImageUrl;

    await updateDoc(userRef, updateData);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function checkNicknameAvailable(
  nickname: string,
): Promise<Result<boolean>> {
  try {
    const normalized = nickname.toLowerCase().trim();
    const nicknameRef = doc(db, 'nicknames', normalized);
    const nicknameSnap = await getDoc(nicknameRef);

    return { success: true, data: !nicknameSnap.exists() };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getUserProfile(
  userId: string,
): Promise<Result<User>> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'not-found',
          message: '요청한 데이터를 찾을 수 없습니다.',
        },
      };
    }

    const data = userSnap.data();

    if (data.isDeleted) {
      return {
        success: false,
        error: {
          code: 'not-found',
          message: '탈퇴한 작가입니다.',
        },
      };
    }

    return { success: true, data: toUser(userId, data) };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
