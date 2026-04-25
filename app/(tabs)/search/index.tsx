import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useSearch } from '@/hooks/useSearch';
import { TagChip } from '@/components/artwork/TagChip';
import UserListItem from '@/components/artist/UserListItem';
import { Artwork } from '@/types/artwork';
import { User } from '@/types/user';
import { COLORS } from '@/lib/constants';

const SEARCH_MAX_LENGTH = 50;
const COLUMN_COUNT = 2;
const ITEM_SIZE = Dimensions.get('window').width / COLUMN_COUNT;

function SearchEmptyResult() {
  return (
    <View className="items-center justify-center px-6 py-16">
      <Text className="mb-2 text-center text-base text-text-secondary">
        검색 결과가 없습니다
      </Text>
      <Text className="text-center text-sm text-text-tertiary">
        작품이나 작가의 앞부분을 입력해보세요
      </Text>
    </View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const {
    query,
    setQuery,
    tab,
    setTab,
    artworks,
    users,
    popularTags,
    recentSearches,
    isSearching,
    isLoadingMore,
    search,
    loadMore,
    loadPopularTags,
    loadRecentSearches,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearch();

  const scrollViewRef = useRef<ScrollView>(null);
  const artworkListRef = useRef<FlatList<Artwork>>(null);
  const userListRef = useRef<FlatList<User>>(null);
  useScrollToTop(scrollViewRef);
  useScrollToTop(artworkListRef);
  useScrollToTop(userListRef);

  useEffect(() => {
    loadPopularTags();
    loadRecentSearches();
  }, [loadPopularTags, loadRecentSearches]);

  const isSearchActive = query.trim().length > 0;

  const handleTagPress = useCallback(
    (tag: string) => {
      setQuery(tag);
      search(tag);
      Keyboard.dismiss();
    },
    [setQuery, search],
  );

  const handleRecentPress = useCallback(
    (term: string) => {
      setQuery(term);
      search(term);
      Keyboard.dismiss();
    },
    [setQuery, search],
  );

  const handleArtworkPress = useCallback(
    (artwork: Artwork) => {
      Keyboard.dismiss();
      router.push(`/artwork/${artwork.id}`);
    },
    [router],
  );

  const renderArtworkItem = useCallback(
    ({ item }: { item: Artwork }) => (
      <Pressable
        onPress={() => handleArtworkPress(item)}
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
    ),
    [handleArtworkPress],
  );

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => (
      <UserListItem user={item} showFollowButton />
    ),
    [],
  );

  const loadingFooter = isLoadingMore ? (
    <View className="items-center py-4">
      <ActivityIndicator size="small" color={COLORS.accent.primary} />
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* 검색 바 */}
      <View className="px-4 py-3">
        <View className="flex-row items-center rounded-xl bg-elevated px-3 py-2.5">
          <Text className="mr-2 text-text-secondary" accessibilityElementsHidden>
            {'🔍'}
          </Text>
          <TextInput
            value={query}
            onChangeText={(text) => setQuery(text.slice(0, SEARCH_MAX_LENGTH))}
            placeholder="작품 또는 작가 검색"
            placeholderTextColor={COLORS.text.tertiary}
            maxLength={SEARCH_MAX_LENGTH}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (query.trim()) search(query);
            }}
            style={{ flex: 1, color: COLORS.text.primary, fontSize: 14 }}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="검색 입력"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="검색어 지우기"
            >
              <Text className="text-text-secondary">{'✕'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {isSearchActive ? (
        <View className="flex-1">
          {/* 탭 */}
          <View className="flex-row border-b border-border">
            {(['artworks', 'users'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className="relative flex-1 items-center py-3"
                accessibilityRole="tab"
              >
                <Text
                  className={
                    tab === t
                      ? 'text-sm font-semibold text-accent-primary'
                      : 'text-sm text-text-secondary'
                  }
                >
                  {t === 'artworks' ? '작품' : '작가'}
                </Text>
                {tab === t && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: COLORS.accent.primary,
                    }}
                  />
                )}
              </Pressable>
            ))}
          </View>

          {isSearching ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.accent.primary} />
            </View>
          ) : tab === 'artworks' ? (
            <FlatList<Artwork>
              ref={artworkListRef}
              data={artworks}
              renderItem={renderArtworkItem}
              keyExtractor={(item) => item.id}
              numColumns={COLUMN_COUNT}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={<SearchEmptyResult />}
              ListFooterComponent={loadingFooter}
              removeClippedSubviews
            />
          ) : (
            <FlatList<User>
              ref={userListRef}
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={<SearchEmptyResult />}
              ListFooterComponent={loadingFooter}
            />
          )}
        </View>
      ) : (
        <ScrollView ref={scrollViewRef} className="flex-1" keyboardShouldPersistTaps="handled">
          {/* 최근 검색어 */}
          {recentSearches.length > 0 && (
            <View className="px-4 py-3">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-text-primary">최근 검색어</Text>
                <Pressable
                  onPress={clearRecentSearches}
                  hitSlop={8}
                  accessibilityLabel="최근 검색어 전체 삭제"
                >
                  <Text className="text-xs text-text-tertiary">전체 삭제</Text>
                </Pressable>
              </View>
              {recentSearches.map((term) => (
                <View key={term} className="flex-row items-center justify-between py-2.5">
                  <Pressable
                    className="flex-1"
                    onPress={() => handleRecentPress(term)}
                    accessibilityLabel={`${term} 검색`}
                  >
                    <Text className="text-sm text-text-secondary">{term}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeRecentSearch(term)}
                    hitSlop={8}
                    accessibilityLabel={`${term} 삭제`}
                  >
                    <Text className="text-xs text-text-tertiary">{'✕'}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* 인기 태그 */}
          {popularTags.length > 0 && (
            <View className="px-4 py-3">
              <Text className="mb-3 text-sm font-semibold text-text-primary">인기 태그</Text>
              <View className="flex-row flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <TagChip key={tag} label={tag} onPress={() => handleTagPress(tag)} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
