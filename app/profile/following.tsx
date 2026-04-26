import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useFollowList } from '@/hooks/useFollowList';
import UserListItem from '@/components/artist/UserListItem';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';

export default function MyFollowingScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { users, isLoading, isLoadingMore, error, load, loadMore } = useFollowList(
    user?.id ?? '',
    'following',
  );

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id, load]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
        </Pressable>
        <Text className="ml-4 text-lg font-semibold text-text-primary">팔로잉</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F53356" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserListItem user={item} showFollowButton />}
          ListEmptyComponent={
            <EmptyState
              message="아직 팔로우하는 작가가 없습니다"
              actionLabel="작가 찾아보기"
              onAction={() => router.push('/search')}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#F53356" />
              </View>
            ) : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
