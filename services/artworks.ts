import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  runTransaction,
  serverTimestamp,
  increment,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { LIMITS } from '@/lib/constants';
import { Result, PaginatedResult } from '@/types/common';
import { Artwork, ArtworkFormData, ArtworkUpdateData } from '@/types/artwork';
import { uploadImages, deleteImage } from '@/services/storage';

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

export async function createArtwork(
  userId: string,
  formData: ArtworkFormData,
  onProgress?: (completed: number, total: number) => void,
): Promise<Result<string>> {
  try {
    const uploadResult = await uploadImages(
      `artworks/${userId}`,
      formData.images,
      onProgress,
    );

    if (!uploadResult.success) {
      return uploadResult as Result<string>;
    }

    const imageUrls = uploadResult.data;

    try {
      let artworkId = '';
      await runTransaction(db, async (transaction) => {
        const artworkRef = doc(collection(db, 'artworks'));
        artworkId = artworkRef.id;

        transaction.set(artworkRef, {
          authorId: userId,
          authorNickname: formData.authorNickname,
          authorProfileImageUrl: formData.authorProfileImageUrl,
          title: formData.title,
          description: formData.description,
          imageUrls,
          thumbnailUrl: imageUrls[0],
          tags: formData.tags,
          tool: formData.tool,
          likesCount: 0,
          reportCount: 0,
          isHidden: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const userRef = doc(db, 'users', userId);
        transaction.update(userRef, {
          artworksCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      });

      return { success: true, data: artworkId };
    } catch (error) {
      for (const url of imageUrls) {
        await deleteImage(url).catch(() => {});
      }
      return { success: false, error: mapFirebaseError(error) };
    }
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getArtwork(artworkId: string): Promise<Result<Artwork>> {
  try {
    const artworkRef = doc(db, 'artworks', artworkId);
    const artworkSnap = await getDoc(artworkRef);

    if (!artworkSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' },
      };
    }

    return {
      success: true,
      data: toArtwork(artworkSnap.id, artworkSnap.data()),
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteArtwork(
  artworkId: string,
  imageUrls: string[],
): Promise<Result<void>> {
  try {
    await runTransaction(db, async (transaction) => {
      const artworkRef = doc(db, 'artworks', artworkId);
      const artworkSnap = await transaction.get(artworkRef);

      if (!artworkSnap.exists()) {
        throw { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' };
      }

      const data = artworkSnap.data();
      const userRef = doc(db, 'users', data.authorId as string);

      transaction.delete(artworkRef);
      transaction.update(userRef, {
        artworksCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    });

    for (const url of imageUrls) {
      await deleteImage(url).catch(() => {});
    }

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function updateArtwork(
  artworkId: string,
  data: ArtworkUpdateData,
): Promise<Result<void>> {
  try {
    const artworkRef = doc(db, 'artworks', artworkId);
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.tool !== undefined) updateData.tool = data.tool;

    await updateDoc(artworkRef, updateData);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getFeedArtworks(
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<Artwork>>> {
  try {
    const pageSize = limit ?? LIMITS.FEED_PAGE_SIZE;
    const artworksRef = collection(db, 'artworks');

    const constraints: QueryConstraint[] = [
      where('isHidden', '==', false),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(artworksRef, ...constraints);
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((docSnap) =>
      toArtwork(docSnap.id, docSnap.data()),
    );

    const lastItem = items[items.length - 1] ?? null;

    return {
      success: true,
      data: {
        items,
        hasMore: items.length >= pageSize,
        lastCursor: lastItem?.createdAt ?? null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getUserArtworks(
  userId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<Artwork>>> {
  try {
    const pageSize = limit ?? LIMITS.FEED_PAGE_SIZE;
    const artworksRef = collection(db, 'artworks');

    const constraints: QueryConstraint[] = [
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(artworksRef, ...constraints);
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((docSnap) =>
      toArtwork(docSnap.id, docSnap.data()),
    );

    const lastItem = items[items.length - 1] ?? null;

    return {
      success: true,
      data: {
        items,
        hasMore: items.length >= pageSize,
        lastCursor: lastItem?.createdAt ?? null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
