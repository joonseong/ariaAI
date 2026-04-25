import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSavedArtworks } from '@/hooks/useSavedArtworks';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

export default function SavedArtworksScreen() {
  const router = useRouter();
  const { artworks, isLoading, isLoadingMore, error, load, loadMore } = useSavedArtworks();

  useEffect(() => {
    load();
  }, [load]);

  const handleArtworkPress = useCallback(
    (artworkId: string) => {
      router.push(`/artwork/${artworkId}`);
    },
    [router],
  );

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
        </Pressable>
        <Text className="ml-4 text-lg font-semibold text-text-primary">저장한 작품</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ArtworkGrid
          artworks={artworks}
          onArtworkPress={handleArtworkPress}
          onEndReached={handleLoadMore}
          isLoadingMore={isLoadingMore}
          ListEmptyComponent={
            <EmptyState
              message="마음에 드는 작품을 저장해보세요"
              actionLabel="홈 피드 둘러보기"
              onAction={() => router.push('/')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
