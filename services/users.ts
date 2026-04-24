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
import { UserProfileUpdate } from '@/types/user';

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
