import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useArtworks } from '@/hooks/useArtworks';
import { useAuthStore } from '@/stores/authStore';
import { FeedList } from '@/components/feed/FeedList';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import { Artwork } from '@/types/artwork';

export default function HomeScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    artworks,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    loadFeed,
    loadMore,
    refresh,
  } = useArtworks();

  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const likedArtworkIds = useMemo(() => new Set<string>(), []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleArtworkPress = useCallback(
    (artwork: Artwork) => {
      router.push(`/artwork/${artwork.id}`);
    },
    [router],
  );

  const handleArtistPress = useCallback(
    (userId: string) => {
      router.push(`/artist/${userId}`);
    },
    [router],
  );

  const handleLikePress = useCallback(
    (_artworkId: string) => {
      if (!isAuthenticated) {
        setLoginPromptVisible(true);
      }
    },
    [isAuthenticated],
  );

  const handleCloseLoginPrompt = useCallback(() => {
    setLoginPromptVisible(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3">
        <Text className="text-2xl font-bold text-text-primary">Aria</Text>
      </View>

      <FeedList
        artworks={artworks}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        isRefreshing={isRefreshing}
        hasMore={hasMore}
        error={error}
        onLoadMore={loadMore}
        onRefresh={refresh}
        onRetry={loadFeed}
        onArtworkPress={handleArtworkPress}
        onArtistPress={handleArtistPress}
        onLikePress={handleLikePress}
        likedArtworkIds={likedArtworkIds}
        isAuthenticated={isAuthenticated}
      />

      <LoginPromptSheet
        visible={loginPromptVisible}
        onClose={handleCloseLoginPrompt}
        message="좋아요를 누르려면 로그인이 필요합니다"
      />
    </SafeAreaView>
  );
}
