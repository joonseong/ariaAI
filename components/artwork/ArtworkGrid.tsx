import React from 'react';
import { FlatList, View, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Artwork } from '@/types/artwork';
import { EmptyState } from '@/components/common/EmptyState';

const COLUMNS = 3;
const ITEM_SIZE = Dimensions.get('window').width / COLUMNS;

interface ArtworkGridProps {
  artworks: Artwork[];
  onArtworkPress: (artworkId: string) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
}

export default function ArtworkGrid({
  artworks,
  onArtworkPress,
  onEndReached,
  isLoadingMore = false,
  ListEmptyComponent,
  ListHeaderComponent,
}: ArtworkGridProps) {
  const renderItem = ({ item }: { item: Artwork }) => (
    <Pressable
      onPress={() => onArtworkPress(item.id)}
      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
      accessibilityLabel={item.title}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={item.title}
      />
    </Pressable>
  );

  const footer = isLoadingMore ? (
    <View className="items-center py-4">
      <ActivityIndicator size="small" color="#8B5CF6" />
    </View>
  ) : undefined;

  const emptyComponent = ListEmptyComponent ?? (
    <EmptyState message="아직 등록된 작품이 없습니다" />
  );

  return (
    <FlatList
      data={artworks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={emptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={footer}
      removeClippedSubviews
    />
  );
}
