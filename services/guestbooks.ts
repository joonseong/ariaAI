import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
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
import { GuestbookMessage } from '@/types/guestbook';

interface FirestoreTimestamp {
  toDate: () => Date;
}

function toGuestbookMessage(
  id: string,
  data: Record<string, unknown>,
): GuestbookMessage {
  return {
    id,
    authorId: data.authorId as string,
    authorNickname: data.authorNickname as string,
    authorProfileImageUrl:
      (data.authorProfileImageUrl as string | null) ?? null,
    content: data.content as string,
    replyContent: (data.replyContent as string | null) ?? null,
    replyCreatedAt: data.replyCreatedAt
      ? (data.replyCreatedAt as FirestoreTimestamp).toDate()
      : null,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
  };
}

export async function createGuestbookMessage(
  artistId: string,
  authorId: string,
  authorNickname: string,
  content: string,
): Promise<Result<string>> {
  try {
    const messagesRef = collection(
      db,
      'guestbooks',
      artistId,
      'messages',
    );
    const docRef = await addDoc(messagesRef, {
      authorId,
      authorNickname,
      authorProfileImageUrl: null,
      content,
      replyContent: null,
      replyCreatedAt: null,
      createdAt: serverTimestamp(),
    });

    return { success: true, data: docRef.id };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function createReply(
  messageId: string,
  artistId: string,
  content: string,
): Promise<Result<void>> {
  try {
    const messageRef = doc(
      db,
      'guestbooks',
      artistId,
      'messages',
      messageId,
    );
    await updateDoc(messageRef, {
      replyContent: content,
      replyCreatedAt: serverTimestamp(),
    });

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteGuestbookMessage(
  messageId: string,
  requesterId: string,
  artistId: string,
): Promise<Result<void>> {
  try {
    const messageRef = doc(
      db,
      'guestbooks',
      artistId,
      'messages',
      messageId,
    );
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'not-found',
          message: '요청한 데이터를 찾을 수 없습니다.',
        },
      };
    }

    const data = messageSnap.data();
    const isAuthor = data.authorId === requesterId;
    const isArtist = requesterId === artistId;

    if (!isAuthor && !isArtist) {
      return {
        success: false,
        error: {
          code: 'permission-denied',
          message: '접근 권한이 없습니다.',
        },
      };
    }

    await deleteDoc(messageRef);

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getGuestbookMessages(
  artistId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<GuestbookMessage>>> {
  try {
    const pageSize = limit ?? LIMITS.GUESTBOOK_PAGE_SIZE;
    const messagesRef = collection(
      db,
      'guestbooks',
      artistId,
      'messages',
    );

    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(messagesRef, ...constraints);
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((docSnap) =>
      toGuestbookMessage(docSnap.id, docSnap.data()),
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
