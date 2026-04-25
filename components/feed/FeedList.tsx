import React, { useCallback } from 'react';
import { FlatList, View, ActivityIndicator, RefreshControl } from 'react-native';
import { Artwork } from '@/types/artwork';
import { ArtworkCard } from '@/components/artwork/ArtworkCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { FeedSkeleton } from './FeedSkeleton';

interface FeedListProps {
  artworks: Artwork[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onArtworkPress: (artwork: Artwork) => void;
  onArtistPress: (userId: string) => void;
  onLikePress: (artworkId: string) => void;
  likedArtworkIds: Set<string>;
  isAuthenticated: boolean;
}

const CARD_ESTIMATED_HEIGHT = 350;

export function FeedList({
  artworks,
  isLoading,
  isLoadingMore,
  isRefreshing,
  hasMore,
  error,
  onLoadMore,
  onRefresh,
  onRetry,
  onArtworkPress,
  onArtistPress,
  onLikePress,
  likedArtworkIds,
  isAuthenticated,
}: FeedListProps) {
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      onLoadMore();
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  const renderItem = useCallback(
    ({ item }: { item: Artwork }) => (
      <View className="px-4 pb-3">
        <ArtworkCard
          artwork={item}
          onPress={() => onArtworkPress(item)}
          onLikePress={() => onLikePress(item.id)}
          onArtistPress={() => onArtistPress(item.authorId)}
          liked={likedArtworkIds.has(item.id)}
          isAuthenticated={isAuthenticated}
        />
      </View>
    ),
    [onArtworkPress, onLikePress, onArtistPress, likedArtworkIds, isAuthenticated],
  );

  const keyExtractor = useCallback((item: Artwork) => item.id, []);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (error && artworks.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!isLoading && artworks.length === 0) {
    return (
      <EmptyState
        message="아직 작품이 없습니다. 작가를 팔로우해보세요!"
      />
    );
  }

  return (
    <FlatList
      data={artworks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={(_, index) => ({
        length: CARD_ESTIMATED_HEIGHT,
        offset: CARD_ESTIMATED_HEIGHT * index,
        index,
      })}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
      initialNumToRender={5}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#A3A3A3"
        />
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#A3A3A3" />
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingTop: 16 }}
    />
  );
}
