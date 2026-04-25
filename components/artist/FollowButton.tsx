import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useFollow } from '@/hooks/useFollow';
import { useAuthStore } from '@/stores/authStore';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import { haptics } from '@/lib/haptics';

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
  initialFollowersCount: number;
  onFollowChange?: (following: boolean, count: number) => void;
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowersCount,
  onFollowChange,
}: FollowButtonProps) {
  const user = useAuthStore((state) => state.user);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { following, followersCount, toggle } = useFollow(
    targetUserId,
    initialFollowing,
    initialFollowersCount,
  );

  const handlePress = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    haptics.light();
    const expectedFollowing = !following;
    const expectedCount = expectedFollowing
      ? followersCount + 1
      : Math.max(0, followersCount - 1);
    await toggle();
    onFollowChange?.(expectedFollowing, expectedCount);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className={`h-9 items-center justify-center rounded-lg px-4 ${
          following ? 'border border-border' : 'bg-accent-primary'
        }`}
        accessibilityRole="button"
        accessibilityLabel={following ? '팔로잉' : '팔로우'}
      >
        <Text
          className={`text-sm font-medium ${
            following ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {following ? '팔로잉' : '팔로우'}
        </Text>
      </Pressable>

      <LoginPromptSheet
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="팔로우하려면 로그인이 필요합니다"
      />
    </>
  );
}
