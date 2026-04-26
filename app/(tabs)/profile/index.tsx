import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useArtistProfile } from '@/hooks/useArtistProfile';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCount } from '@/lib/formatters';

function MenuItem({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-border px-4 py-4"
      accessibilityRole="button"
    >
      <Text className={`text-sm ${destructive ? 'text-semantic-error' : 'text-text-primary'}`}>
        {label}
      </Text>
      <Text className="text-text-tertiary">›</Text>
    </Pressable>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();

  const { artworks, isLoading, loadMoreArtworks, isLoadingMoreArtworks, load } =
    useArtistProfile(user?.id ?? '');
  const { balance } = usePoints();

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id, load]);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }, [logout]);

  const handleArtworkPress = useCallback(
    (artworkId: string) => {
      router.push(`/artwork/${artworkId}`);
    },
    [router],
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-2 text-xl font-bold text-text-primary">로그인이 필요합니다</Text>
        <Text className="mb-8 text-center text-sm text-text-secondary">
          로그인하고 나만의 포트폴리오를 시작해보세요
        </Text>
        <View className="w-full gap-3">
          <Button title="로그인" onPress={() => router.push('/login')} fullWidth />
          <Button
            title="가입하기"
            onPress={() => router.push('/signup')}
            variant="secondary"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  const profileHeader = (
    <View>
      <View className="items-center px-6 pb-4 pt-6">
        <Avatar uri={user.profileImageUrl} size={80} fallbackText={user.nickname} />
        <Text className="mt-3 text-xl font-bold text-text-primary">{user.nickname}</Text>
        {user.bio.length > 0 && (
          <Text className="mt-1 text-center text-sm text-text-secondary" numberOfLines={3}>
            {user.bio}
          </Text>
        )}
        <View className="mt-4 flex-row gap-8">
          <View className="items-center">
            <Text className="text-lg font-bold text-text-primary">
              {formatCount(user.artworksCount)}
            </Text>
            <Text className="text-xs text-text-secondary">작품</Text>
          </View>
          <Pressable
            className="items-center"
            onPress={() => router.push('/profile/followers')}
            accessibilityLabel="팔로워 목록 보기"
          >
            <Text className="text-lg font-bold text-text-primary">
              {formatCount(user.followersCount)}
            </Text>
            <Text className="text-xs text-text-secondary">팔로워</Text>
          </Pressable>
          <Pressable
            className="items-center"
            onPress={() => router.push('/profile/following')}
            accessibilityLabel="팔로잉 목록 보기"
          >
            <Text className="text-lg font-bold text-text-primary">
              {formatCount(user.followingCount)}
            </Text>
            <Text className="text-xs text-text-secondary">팔로잉</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/profile/edit')}
          className="mt-4 h-9 items-center justify-center rounded-lg border border-border px-6"
          accessibilityLabel="프로필 수정"
        >
          <Text className="text-sm font-medium text-text-secondary">프로필 수정</Text>
        </Pressable>
      </View>

      <View className="border-t border-border">
        <Pressable
          onPress={() => router.push('/profile/points')}
          className="flex-row items-center justify-between border-b border-border px-4 py-4"
          accessibilityRole="button"
        >
          <Text className="text-sm text-text-primary">포인트 충전</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold text-accent-primary">{balance.toLocaleString()}P</Text>
            <Text className="text-text-tertiary">›</Text>
          </View>
        </Pressable>
        <MenuItem label="좋아요한 작품" onPress={() => router.push('/profile/liked')} />
        <MenuItem label="저장한 작품" onPress={() => router.push('/profile/saved')} />
        <MenuItem label="팔로워" onPress={() => router.push('/profile/followers')} />
        <MenuItem label="팔로잉" onPress={() => router.push('/profile/following')} />
        <MenuItem label="로그아웃" onPress={handleLogout} destructive />
      </View>

      <View className="mt-4 border-t border-border px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-text-primary">내 작품</Text>
          <Text className="text-xs text-text-tertiary">{artworks.length}개</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ArtworkGrid
        artworks={artworks}
        onArtworkPress={handleArtworkPress}
        onEndReached={loadMoreArtworks}
        isLoadingMore={isLoadingMoreArtworks}
        ListHeaderComponent={profileHeader}
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#F53356" />
            </View>
          ) : (
            <EmptyState
              message="첫 작품을 등록해보세요"
              actionLabel="작품 등록하기"
              onAction={() => router.push('/upload' as never)}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
