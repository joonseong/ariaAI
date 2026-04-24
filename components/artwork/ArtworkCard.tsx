import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Artwork } from '@/types/artwork';
import { formatRelativeTime } from '@/lib/formatters';
import { Avatar } from '@/components/common/Avatar';
import { LikeButton } from './LikeButton';

interface ArtworkCardProps {
  artwork: Artwork;
  onPress: () => void;
  onLikePress: () => void;
  onArtistPress: () => void;
  liked: boolean;
  isAuthenticated: boolean;
}

export const ArtworkCard = React.memo(function ArtworkCard({
  artwork,
  onPress,
  onLikePress,
  onArtistPress,
  liked,
  isAuthenticated,
}: ArtworkCardProps) {
  const handleLikePress = () => {
    onLikePress();
  };

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl bg-surface"
      accessibilityLabel={artwork.title}
    >
      <Image
        source={{ uri: artwork.thumbnailUrl }}
        style={{ width: '100%', aspectRatio: 4 / 3 }}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        accessibilityLabel={artwork.title}
      />

      <View className="p-3">
        <Text
          className="text-base font-medium text-text-primary"
          numberOfLines={1}
        >
          {artwork.title}
        </Text>

        <View className="mt-2 flex-row items-center justify-between">
          <Pressable
            onPress={onArtistPress}
            className="flex-1 flex-row items-center"
            accessibilityLabel={`${artwork.authorNickname} 프로필`}
          >
            <Avatar
              uri={artwork.authorProfileImageUrl}
              size={24}
              fallbackText={artwork.authorNickname}
            />
            <Text
              className="ml-2 text-xs text-text-secondary"
              numberOfLines={1}
            >
              {artwork.authorNickname}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            <LikeButton
              active={liked}
              count={artwork.likesCount}
              onPress={handleLikePress}
              size="small"
            />
          </View>
        </View>

        <Text className="mt-1 text-xs text-text-tertiary">
          {formatRelativeTime(artwork.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
});
