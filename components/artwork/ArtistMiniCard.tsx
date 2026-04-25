import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Avatar } from '@/components/common/Avatar';

interface ArtistMiniCardProps {
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  onPress: () => void;
}

export function ArtistMiniCard({
  authorNickname,
  authorProfileImageUrl,
  onPress,
}: ArtistMiniCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl bg-surface p-3"
      accessibilityLabel={`${authorNickname} 프로필`}
      accessibilityRole="button"
    >
      <Avatar
        uri={authorProfileImageUrl}
        size={40}
        fallbackText={authorNickname}
      />
      <Text className="ml-3 flex-1 text-base font-medium text-text-primary">
        {authorNickname}
      </Text>
      <Text className="text-lg text-text-tertiary">{'\u203A'}</Text>
    </Pressable>
  );
}
