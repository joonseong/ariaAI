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
import { Artwork } from '@/types/artwork';

interface FirestoreTimestamp {
  toDate: () => Date;
}

function toArtwork(id: string, data: Record<string, unknown>): Artwork {
  return {
    id,
    authorId: data.authorId as string,
    authorNickname: data.authorNickname as string,
    authorProfileImageUrl: (data.authorProfileImageUrl as string | null) ?? null,
    title: data.title as string,
    description: data.description as string,
    imageUrls: data.imageUrls as string[],
    thumbnailUrl: data.thumbnailUrl as string,
    tags: data.tags as string[],
    tool: data.tool as string,
    likesCount: data.likesCount as number,
    reportCount: data.reportCount as number,
    isHidden: data.isHidden as boolean,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
    updatedAt: (data.updatedAt as FirestoreTimestamp).toDate(),
  };
}

export async function toggleLike(
  userId: string,
  artworkId: string,
): Promise<Result<{ liked: boolean }>> {
  try {
    const likeId = `${userId}_${artworkId}`;
    let liked = false;

    await runTransaction(db, async (transaction) => {
      const likeRef = doc(db, 'likes', likeId);
      const likeSnap = await transaction.get(likeRef);
      const artworkRef = doc(db, 'artworks', artworkId);

      if (likeSnap.exists()) {
        transaction.delete(likeRef);
        transaction.update(artworkRef, {
          likesCount: increment(-1),
        });
        liked = false;
      } else {
        transaction.set(likeRef, {
          userId,
          artworkId,
          createdAt: serverTimestamp(),
        });
        transaction.update(artworkRef, {
          likesCount: increment(1),
        });
        liked = true;
      }
    });

    return { success: true, data: { liked } };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function checkLiked(
  userId: string,
  artworkId: string,
): Promise<Result<boolean>> {
  try {
    const likeId = `${userId}_${artworkId}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeSnap = await getDoc(likeRef);

    return { success: true, data: likeSnap.exists() };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getLikedArtworks(
  userId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<Artwork>>> {
  try {
    const pageSize = limit ?? LIMITS.FEED_PAGE_SIZE;
    const likesRef = collection(db, 'likes');

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(likesRef, ...constraints);
    const likesSnapshot = await getDocs(q);

    const items: Artwork[] = [];
    for (const likeDoc of likesSnapshot.docs) {
      const likeData = likeDoc.data();
      const artworkRef = doc(db, 'artworks', likeData.artworkId as string);
      const artworkSnap = await getDoc(artworkRef);

      if (artworkSnap.exists()) {
        items.push(toArtwork(artworkSnap.id, artworkSnap.data()));
      }
    }

    return {
      success: true,
      data: {
        items,
        hasMore: likesSnapshot.docs.length >= pageSize,
        lastCursor: likesSnapshot.docs.length > 0
          ? (likesSnapshot.docs[likesSnapshot.docs.length - 1].data().createdAt as FirestoreTimestamp).toDate()
          : null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
