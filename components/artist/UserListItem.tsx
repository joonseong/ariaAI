import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { User } from '@/types/user';
import { Avatar } from '@/components/common/Avatar';
import { useAuthStore } from '@/stores/authStore';
import FollowButton from './FollowButton';

interface UserListItemProps {
  user: User;
  showFollowButton?: boolean;
}

export default function UserListItem({
  user,
  showFollowButton = false,
}: UserListItemProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const isMe = currentUser?.id === user.id;

  const handlePress = () => {
    router.push(`/artist/${user.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center px-4 py-3"
      accessibilityLabel={`${user.nickname} 프로필`}
    >
      <Avatar uri={user.profileImageUrl} size={44} fallbackText={user.nickname} />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-medium text-text-primary" numberOfLines={1}>
          {user.nickname}
        </Text>
        {user.bio ? (
          <Text className="mt-0.5 text-xs text-text-secondary" numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>
      {showFollowButton && !isMe && (
        <FollowButton
          targetUserId={user.id}
          initialFollowing={false}
          initialFollowersCount={user.followersCount}
        />
      )}
    </Pressable>
  );
}
