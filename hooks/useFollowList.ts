import { useState, useCallback, useRef } from 'react';
import { User } from '@/types/user';
import { getFollowers, getFollowing } from '@/services/follows';

export function useFollowList(userId: string, type: 'followers' | 'following') {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<Date | undefined>(undefined);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    cursorRef.current = undefined;

    const fetchFn = type === 'followers' ? getFollowers : getFollowing;
    const result = await fetchFn(userId);

    if (result.success) {
      setUsers(result.data.items);
      setHasMore(result.data.hasMore);
      cursorRef.current = result.data.lastCursor as Date | undefined;
    } else {
      setError(result.error.message);
    }

    setIsLoading(false);
    loadingRef.current = false;
  }, [userId, type]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoadingMore(true);

    const fetchFn = type === 'followers' ? getFollowers : getFollowing;
    const result = await fetchFn(userId, cursorRef.current);

    if (result.success) {
      setUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const newItems = result.data.items.filter((u) => !existingIds.has(u.id));
        return [...prev, ...newItems];
      });
      setHasMore(result.data.hasMore);
      cursorRef.current = result.data.lastCursor as Date | undefined;
    }

    setIsLoadingMore(false);
    loadingRef.current = false;
  }, [userId, type, hasMore]);

  return { users, isLoading, isLoadingMore, hasMore, error, load, loadMore };
}
