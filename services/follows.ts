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
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { LIMITS } from '@/lib/constants';
import { Result, PaginatedResult } from '@/types/common';
import { User } from '@/types/user';

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

export async function toggleFollow(
  followerId: string,
  followingId: string,
): Promise<Result<{ following: boolean }>> {
  if (followerId === followingId) {
    return {
      success: false,
      error: {
        code: 'invalid-argument',
        message: '자기 자신을 팔로우할 수 없습니다.',
      },
    };
  }

  try {
    const followId = `${followerId}_${followingId}`;
    let following = false;

    await runTransaction(db, async (transaction) => {
      const followRef = doc(db, 'follows', followId);
      const followSnap = await transaction.get(followRef);
      const followerUserRef = doc(db, 'users', followerId);
      const followingUserRef = doc(db, 'users', followingId);

      if (followSnap.exists()) {
        transaction.delete(followRef);
        transaction.update(followerUserRef, {
          followingCount: increment(-1),
        });
        transaction.update(followingUserRef, {
          followersCount: increment(-1),
        });
        following = false;
      } else {
        transaction.set(followRef, {
          followerId,
          followingId,
          createdAt: serverTimestamp(),
        });
        transaction.update(followerUserRef, {
          followingCount: increment(1),
        });
        transaction.update(followingUserRef, {
          followersCount: increment(1),
        });
        following = true;
      }
    });

    return { success: true, data: { following } };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function checkFollowing(
  followerId: string,
  followingId: string,
): Promise<Result<boolean>> {
  try {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    const followSnap = await getDoc(followRef);

    return { success: true, data: followSnap.exists() };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getFollowers(
  userId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<User>>> {
  try {
    const pageSize = limit ?? LIMITS.FEED_PAGE_SIZE;
    const followsRef = collection(db, 'follows');

    const constraints: QueryConstraint[] = [
      where('followingId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(followsRef, ...constraints);
    const followsSnapshot = await getDocs(q);

    const items: User[] = [];
    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      const userRef = doc(db, 'users', followData.followerId as string);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.isDeleted) {
          items.push(toUser(userSnap.id, userData));
        }
      }
    }

    return {
      success: true,
      data: {
        items,
        hasMore: followsSnapshot.docs.length >= pageSize,
        lastCursor:
          followsSnapshot.docs.length > 0
            ? (
                followsSnapshot.docs[followsSnapshot.docs.length - 1].data()
                  .createdAt as FirestoreTimestamp
              ).toDate()
            : null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getFollowing(
  userId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<User>>> {
  try {
    const pageSize = limit ?? LIMITS.FEED_PAGE_SIZE;
    const followsRef = collection(db, 'follows');

    const constraints: QueryConstraint[] = [
      where('followerId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(followsRef, ...constraints);
    const followsSnapshot = await getDocs(q);

    const items: User[] = [];
    for (const followDoc of followsSnapshot.docs) {
      const followData = followDoc.data();
      const userRef = doc(db, 'users', followData.followingId as string);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.isDeleted) {
          items.push(toUser(userSnap.id, userData));
        }
      }
    }

    return {
      success: true,
      data: {
        items,
        hasMore: followsSnapshot.docs.length >= pageSize,
        lastCursor:
          followsSnapshot.docs.length > 0
            ? (
                followsSnapshot.docs[followsSnapshot.docs.length - 1].data()
                  .createdAt as FirestoreTimestamp
              ).toDate()
            : null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
