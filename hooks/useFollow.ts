import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as followsService from '@/services/follows';

export function useFollow(
  targetUserId: string,
  initialFollowing: boolean,
  initialFollowersCount: number,
) {
  const user = useAuthStore((state) => state.user);
  const [following, setFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const pendingRef = useRef(false);

  const toggle = useCallback(async () => {
    if (!user) return;
    if (pendingRef.current) return;
    pendingRef.current = true;

    const prevFollowing = following;
    const prevFollowersCount = followersCount;
    const newFollowing = !following;
    const newFollowersCount = following
      ? Math.max(0, followersCount - 1)
      : followersCount + 1;

    setFollowing(newFollowing);
    setFollowersCount(newFollowersCount);

    const result = await followsService.toggleFollow(user.id, targetUserId);
    if (!result.success) {
      setFollowing(prevFollowing);
      setFollowersCount(prevFollowersCount);
    }

    pendingRef.current = false;
  }, [user, targetUserId, following, followersCount]);

  return { following, followersCount, toggle };
}
