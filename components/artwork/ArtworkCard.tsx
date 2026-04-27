import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Artwork } from '@/types/artwork';
import { formatRelativeTime } from '@/lib/formatters';
import { Avatar } from '@/components/common/Avatar';
import { LikeButton } from './LikeButton';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import { useLike } from '@/hooks/useLike';
import { useAuthStore } from '@/stores/authStore';

interface ArtworkCardProps {
  artwork: Artwork;
  onPress: () => void;
  onArtistPress: () => void;
  initialLiked?: boolean;
}

export const ArtworkCard = React.memo(function ArtworkCard({
  artwork,
  onPress,
  onArtistPress,
  initialLiked = false,
}: ArtworkCardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { liked, count, toggle } = useLike(artwork.id, initialLiked, artwork.likesCount);

  const handleLikePress = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    toggle();
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-xl bg-surface"
        accessibilityLabel={artwork.title}
      >
        <Image
          source={{ uri: artwork.thumbnailUrl }}
          style={{ width: '100%', aspectRatio: 1 }}
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

            <LikeButton
              active={liked}
              count={count}
              onPress={handleLikePress}
              size="small"
            />
          </View>

          <Text className="mt-3 text-xs text-text-tertiary">
            {formatRelativeTime(artwork.createdAt)}
          </Text>
        </View>
      </Pressable>

      <LoginPromptSheet
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="좋아요를 누르려면 로그인이 필요합니다"
      />
    </>
  );
});
