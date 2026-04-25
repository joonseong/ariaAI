import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
} from 'react-native';
import { Image } from 'expo-image';

interface ArtworkImageViewerProps {
  imageUrls: string[];
  initialIndex?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ArtworkImageViewer({
  imageUrls,
  initialIndex = 0,
}: ArtworkImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SCREEN_WIDTH);
      if (index !== currentIndex && index >= 0 && index < imageUrls.length) {
        setCurrentIndex(index);
      }
    },
    [currentIndex, imageUrls.length],
  );

  const handleTap = useCallback(() => {
    setOverlayVisible((prev) => !prev);
  }, []);

  const renderImage = useCallback(
    ({ item }: { item: string }) => (
      <Pressable onPress={handleTap} style={{ width: SCREEN_WIDTH }}>
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
          }}
        >
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            accessibilityLabel="artwork image"
          />
        </ScrollView>
      </Pressable>
    ),
    [handleTap],
  );

  const keyExtractor = useCallback(
    (_item: string, index: number) => `image-${index}`,
    [],
  );

  return (
    <View className="bg-black">
      <FlatList
        ref={flatListRef}
        data={imageUrls}
        renderItem={renderImage}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {imageUrls.length > 1 && overlayVisible && (
        <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-1.5">
          {imageUrls.map((_, index) => (
            <View
              key={index}
              className={`h-1.5 w-1.5 rounded-full ${
                index === currentIndex ? 'bg-text-primary' : 'bg-text-tertiary'
              }`}
            />
          ))}
        </View>
      )}

      {imageUrls.length > 1 && overlayVisible && (
        <View className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1">
          <Text className="text-xs text-text-primary">
            {currentIndex + 1}/{imageUrls.length}
          </Text>
        </View>
      )}
    </View>
  );
}
