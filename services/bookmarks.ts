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
    prompt: (data.prompt as string | null) ?? null,
    hasPrompt: (data.hasPrompt as boolean) ?? false,
    likesCount: data.likesCount as number,
    reportCount: data.reportCount as number,
    isHidden: data.isHidden as boolean,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
    updatedAt: (data.updatedAt as FirestoreTimestamp).toDate(),
  };
}

export async function toggleBookmark(
  userId: string,
  artworkId: string,
): Promise<Result<{ bookmarked: boolean }>> {
  try {
    const bookmarkId = `${userId}_${artworkId}`;
    let bookmarked = false;

    await runTransaction(db, async (transaction) => {
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      const bookmarkSnap = await transaction.get(bookmarkRef);
      const userRef = doc(db, 'users', userId);

      if (bookmarkSnap.exists()) {
        transaction.delete(bookmarkRef);
        transaction.update(userRef, {
          bookmarksCount: increment(-1),
        });
        bookmarked = false;
      } else {
        transaction.set(bookmarkRef, {
          userId,
          artworkId,
          createdAt: serverTimestamp(),
        });
        transaction.update(userRef, {
          bookmarksCount: increment(1),
        });
        bookmarked = true;
      }
    });

    return { success: true, data: { bookmarked } };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function checkBookmarked(
  userId: string,
  artworkId: string,
): Promise<Result<boolean>> {
  try {
    const bookmarkId = `${userId}_${artworkId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    const bookmarkSnap = await getDoc(bookmarkRef);

    return { success: true, data: bookmarkSnap.exists() };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getBookmarkedArtworks(
  userId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<Artwork>>> {
  try {
    const pageSize = limit ?? LIMITS.FEED_PAGE_SIZE;
    const bookmarksRef = collection(db, 'bookmarks');

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(bookmarksRef, ...constraints);
    const bookmarksSnapshot = await getDocs(q);

    const items: Artwork[] = [];
    for (const bookmarkDoc of bookmarksSnapshot.docs) {
      const bookmarkData = bookmarkDoc.data();
      const artworkRef = doc(db, 'artworks', bookmarkData.artworkId as string);
      const artworkSnap = await getDoc(artworkRef);

      if (artworkSnap.exists()) {
        items.push(toArtwork(artworkSnap.id, artworkSnap.data()));
      }
    }

    return {
      success: true,
      data: {
        items,
        hasMore: bookmarksSnapshot.docs.length >= pageSize,
        lastCursor:
          bookmarksSnapshot.docs.length > 0
            ? (
                bookmarksSnapshot.docs[bookmarksSnapshot.docs.length - 1].data()
                  .createdAt as FirestoreTimestamp
              ).toDate()
            : null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
