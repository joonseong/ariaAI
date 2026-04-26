import React from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconShare from '@/assets/icons/icon.share.svg';
import IconMore from '@/assets/icons/icon.more.svg';
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
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center border-t border-border bg-elevated px-4 py-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
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
        <IconShare width={22} height={22} color="#A0A0A0" />
      </Pressable>

      <View className="flex-1" />

      <Pressable
        onPress={onMorePress}
        hitSlop={8}
        accessibilityLabel="더보기"
        accessibilityRole="button"
      >
        <IconMore width={22} height={22} color="#A0A0A0" />
      </Pressable>
    </View>
  );
}
