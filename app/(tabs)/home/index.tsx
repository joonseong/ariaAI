import React, { useEffect, useCallback, useRef } from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { useArtworks } from '@/hooks/useArtworks';
import { FeedList } from '@/components/feed/FeedList';
import { Artwork } from '@/types/artwork';
import BrandLogo from '@/assets/icon.logo.brand.svg';

export default function HomeScreen() {
  const router = useRouter();
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

  const feedListRef = useRef<FlatList<Artwork>>(null);
  useScrollToTop(feedListRef);

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-3">
        <BrandLogo width={80} height={36} />
      </View>

      <FeedList
        ref={feedListRef}
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
        onEmptyAction={() => router.push('/search')}
        emptyActionLabel="작가 찾아보기"
      />
    </SafeAreaView>
  );
}
