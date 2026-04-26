import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { LIMITS } from '@/lib/constants';
import { Result } from '@/types/common';
import { User, UserProfileUpdate } from '@/types/user';
import { uploadImage, deleteImage } from '@/services/storage';

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
    pointBalance: (data.pointBalance as number) ?? 0,
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

// 프로필 사진 업로드 + 사용자 문서 업데이트
export async function updateProfileImage(
  userId: string,
  imageUri: string,
): Promise<Result<string>> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const oldImageUrl: string | null = userSnap.exists()
      ? (userSnap.data().profileImageUrl as string | null) ?? null
      : null;

    const path = `profiles/${userId}/profile_${Date.now()}.jpg`;
    const uploadResult = await uploadImage(path, imageUri);
    if (!uploadResult.success) {
      return uploadResult as Result<string>;
    }

    const newUrl = uploadResult.data;
    await updateDoc(userRef, {
      profileImageUrl: newUrl,
      updatedAt: serverTimestamp(),
    });

    if (oldImageUrl) {
      await deleteImage(oldImageUrl).catch(() => {});
    }

    return { success: true, data: newUrl };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

// 한 줄 소개 수정
export async function updateBio(
  userId: string,
  bio: string,
): Promise<Result<void>> {
  if (bio.length > LIMITS.BIO_MAX) {
    return {
      success: false,
      error: {
        code: 'validation/bio-too-long',
        message: `소개는 ${LIMITS.BIO_MAX}자 이하로 입력해주세요.`,
      },
    };
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { bio, updatedAt: serverTimestamp() });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

// 회원 탈퇴 — 모든 사용자 데이터 삭제 (Firebase Auth 계정 삭제는 훅에서 처리)
export async function deleteAccount(userId: string): Promise<Result<void>> {
  try {
    // 1. 작품 전체 삭제 + 이미지 URL 수집
    const artworkSnap = await getDocs(
      query(collection(db, 'artworks'), where('authorId', '==', userId)),
    );
    const imageUrls: string[] = [];
    for (const artworkDoc of artworkSnap.docs) {
      const urls = artworkDoc.data().imageUrls as string[];
      if (Array.isArray(urls)) {
        imageUrls.push(...urls);
      }
      await deleteDoc(artworkDoc.ref);
    }

    // 2. 좋아요 전체 삭제
    const likeSnap = await getDocs(
      query(collection(db, 'likes'), where('userId', '==', userId)),
    );
    for (const likeDoc of likeSnap.docs) {
      await deleteDoc(likeDoc.ref);
    }

    // 3. 팔로우 관계 전체 삭제 (팔로잉 + 팔로워)
    const followingSnap = await getDocs(
      query(collection(db, 'follows'), where('followerId', '==', userId)),
    );
    for (const followDoc of followingSnap.docs) {
      await deleteDoc(followDoc.ref);
    }

    const followerSnap = await getDocs(
      query(collection(db, 'follows'), where('followingId', '==', userId)),
    );
    for (const followDoc of followerSnap.docs) {
      await deleteDoc(followDoc.ref);
    }

    // 4. 북마크 전체 삭제
    const bookmarkSnap = await getDocs(
      query(collection(db, 'bookmarks'), where('userId', '==', userId)),
    );
    for (const bookmarkDoc of bookmarkSnap.docs) {
      await deleteDoc(bookmarkDoc.ref);
    }

    // 5. 이 사용자가 작성한 방명록 메시지 삭제 (collectionGroup)
    const guestbookSnap = await getDocs(
      query(collectionGroup(db, 'messages'), where('authorId', '==', userId)),
    );
    for (const msgDoc of guestbookSnap.docs) {
      await deleteDoc(msgDoc.ref);
    }

    // 6. 이 사용자의 포트폴리오 방명록 메시지 삭제
    const ownGuestbookSnap = await getDocs(
      collection(db, 'guestbooks', userId, 'messages'),
    );
    for (const msgDoc of ownGuestbookSnap.docs) {
      await deleteDoc(msgDoc.ref);
    }

    // 7. Storage 이미지 삭제 (작품 이미지)
    for (const url of imageUrls) {
      await deleteImage(url).catch(() => {});
    }

    // 8. 프로필 이미지 삭제
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      const profileImageUrl = userSnap.data().profileImageUrl as string | null;
      if (profileImageUrl) {
        await deleteImage(profileImageUrl).catch(() => {});
      }
    }

    // 9. 사용자 문서 삭제
    await deleteDoc(doc(db, 'users', userId));

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
