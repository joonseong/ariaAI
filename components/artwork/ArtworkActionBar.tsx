import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LikeButton } from './LikeButton';

interface ArtworkActionBarProps {
  liked: boolean;
  likeCount: number;
  onLikePress: () => void;
  onSharePress: () => void;
  onMorePress: () => void;
}

export function ArtworkActionBar({
  liked,
  likeCount,
  onLikePress,
  onSharePress,
  onMorePress,
}: ArtworkActionBarProps) {
  return (
    <View className="flex-row items-center border-t border-border bg-elevated px-4 py-3">
      <LikeButton
        active={liked}
        count={likeCount}
        onPress={onLikePress}
        size="large"
      />

      <Pressable
        onPress={onSharePress}
        className="ml-6"
        hitSlop={8}
        accessibilityLabel="공유"
        accessibilityRole="button"
      >
        <Text className="text-xl text-text-secondary">{'\u21AA'}</Text>
      </Pressable>

      <View className="flex-1" />

      <Pressable
        onPress={onMorePress}
        hitSlop={8}
        accessibilityLabel="더보기"
        accessibilityRole="button"
      >
        <Text className="text-xl text-text-secondary">{'\u22EF'}</Text>
      </Pressable>
    </View>
  );
}
