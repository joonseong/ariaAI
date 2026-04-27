import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArtistProfile } from '@/hooks/useArtistProfile';
import { useAuthStore } from '@/stores/authStore';
import * as followsService from '@/services/follows';
import { Avatar } from '@/components/common/Avatar';
import { ErrorState } from '@/components/common/ErrorState';
import FollowButton from '@/components/artist/FollowButton';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import { formatCount } from '@/lib/formatters';
import IconBack from '@/assets/icons/icon.back.svg';

export default function ArtistPortfolioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [initialFollowing, setInitialFollowing] = useState(false);
  const [followReady, setFollowReady] = useState(false);

  const { artist, artworks, isLoading, error, load, loadMoreArtworks, isLoadingMoreArtworks } =
    useArtistProfile(id ?? '');

  const isOwner = !!id && currentUser?.id === id;

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  useEffect(() => {
    if (!currentUser || !id || isOwner) { setFollowReady(true); return; }
    followsService.checkFollowing(currentUser.id, id).then((result) => {
      if (result.success) setInitialFollowing(result.data);
      setFollowReady(true);
    });
  }, [currentUser?.id, id, isOwner]);

  const handleArtworkPress = useCallback((artworkId: string) => {
    router.push(`/artwork/${artworkId}`);
  }, [router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F53356" />
      </SafeAreaView>
    );
  }

  if (error || !artist) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Pressable onPress={() => router.back()} className="px-4 py-3">
          <IconBack width={28} height={28} color="#FFFFFF" />
        </Pressable>
        <ErrorState message={error ?? '작가를 찾을 수 없습니다'} onRetry={error ? load : undefined} />
      </SafeAreaView>
    );
  }

  const profileHeader = (
    <View>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <IconBack width={28} height={28} color="#FFFFFF" />
        </Pressable>
      </View>
      <View className="items-center px-6 pb-4">
        <Avatar uri={artist.profileImageUrl} size={80} fallbackText={artist.nickname} />
        <Text className="mt-3 text-xl font-bold text-text-primary">{artist.nickname}</Text>
        {artist.bio.length > 0 && (
          <Text className="mt-1 text-center text-sm text-text-secondary" numberOfLines={3}>
            {artist.bio}
          </Text>
        )}
        <View className="mt-4 flex-row gap-8">
          <View className="items-center">
            <Text className="text-lg font-bold text-text-primary">{formatCount(artist.artworksCount)}</Text>
            <Text className="text-xs text-text-secondary">작품</Text>
          </View>
          <Pressable className="items-center" onPress={() => router.push(`/artist/${artist.id}/followers`)}>
            <Text className="text-lg font-bold text-text-primary">{formatCount(artist.followersCount)}</Text>
            <Text className="text-xs text-text-secondary">팔로워</Text>
          </Pressable>
          <Pressable className="items-center" onPress={() => router.push(`/artist/${artist.id}/following`)}>
            <Text className="text-lg font-bold text-text-primary">{formatCount(artist.followingCount)}</Text>
            <Text className="text-xs text-text-secondary">팔로잉</Text>
          </Pressable>
        </View>
        <View className="mt-4 flex-row items-center gap-3">
          {isOwner ? (
            <Pressable
              onPress={() => router.push('/profile/edit')}
              className="h-9 items-center justify-center rounded-lg border border-border px-4"
            >
              <Text className="text-sm font-medium text-text-secondary">프로필 수정</Text>
            </Pressable>
          ) : followReady ? (
            <FollowButton
              targetUserId={artist.id}
              initialFollowing={initialFollowing}
              initialFollowersCount={artist.followersCount}
            />
          ) : (
            <ActivityIndicator size="small" color="#F53356" />
          )}
          <Pressable
            onPress={() => router.push(`/artist/${artist.id}/guestbook`)}
            className="h-9 items-center justify-center rounded-lg border border-border px-4"
            accessibilityLabel="방명록 보기"
          >
            <Text className="text-sm font-medium text-text-secondary">방명록</Text>
          </Pressable>
        </View>
      </View>

      <View className="border-t border-border px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-text-primary">작품</Text>
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
      />
    </SafeAreaView>
  );
}
