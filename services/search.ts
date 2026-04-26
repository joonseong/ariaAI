import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { LIMITS } from '@/lib/constants';
import { Result, PaginatedResult } from '@/types/common';
import { Artwork } from '@/types/artwork';
import { User } from '@/types/user';

const SEARCH_PAGE_SIZE = LIMITS.FEED_PAGE_SIZE;
const MAX_QUERY_LENGTH = 50;

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

// 작품 검색 — title prefix 매칭
export async function searchArtworks(
  searchQuery: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<Artwork>>> {
  const trimmed = searchQuery.trim().slice(0, MAX_QUERY_LENGTH);

  if (!trimmed) {
    return { success: true, data: { items: [], hasMore: false, lastCursor: null } };
  }

  try {
    const pageSize = limit ?? SEARCH_PAGE_SIZE;
    const artworksRef = collection(db, 'artworks');

    const constraints: QueryConstraint[] = [
      where('isHidden', '==', false),
      where('title', '>=', trimmed),
      where('title', '<=', trimmed + '\uf8ff'),
      orderBy('title'),
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

// 작가 검색 — normalizedNickname prefix 매칭
export async function searchUsers(
  searchQuery: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<User>>> {
  const trimmed = searchQuery.trim().toLowerCase().slice(0, MAX_QUERY_LENGTH);

  if (!trimmed) {
    return { success: true, data: { items: [], hasMore: false, lastCursor: null } };
  }

  try {
    const pageSize = limit ?? SEARCH_PAGE_SIZE;
    const usersRef = collection(db, 'users');

    const constraints: QueryConstraint[] = [
      where('isDeleted', '==', false),
      where('normalizedNickname', '>=', trimmed),
      where('normalizedNickname', '<=', trimmed + '\uf8ff'),
      orderBy('normalizedNickname'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }

    constraints.push(firestoreLimit(pageSize));

    const q = query(usersRef, ...constraints);
    const snapshot = await getDocs(q);

    const items = snapshot.docs.map((docSnap) =>
      toUser(docSnap.id, docSnap.data()),
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

// 태그로 작품 검색 — array-contains
export async function searchByTag(
  tag: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<Artwork>>> {
  const trimmed = tag.trim();

  if (!trimmed) {
    return { success: true, data: { items: [], hasMore: false, lastCursor: null } };
  }

  try {
    const pageSize = limit ?? SEARCH_PAGE_SIZE;
    const artworksRef = collection(db, 'artworks');

    const constraints: QueryConstraint[] = [
      where('isHidden', '==', false),
      where('tags', 'array-contains', trimmed),
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

// 인기 태그 조회 — 최근 100개 작품에서 태그 빈도 계산
export async function getPopularTags(): Promise<Result<string[]>> {
  try {
    const artworksRef = collection(db, 'artworks');
    const q = query(
      artworksRef,
      where('isHidden', '==', false),
      orderBy('createdAt', 'desc'),
      firestoreLimit(100),
    );

    const snapshot = await getDocs(q);

    const tagCounts = new Map<string, number>();
    for (const docSnap of snapshot.docs) {
      const tags = docSnap.data().tags as string[];
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
    }

    const popularTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return { success: true, data: popularTags };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
