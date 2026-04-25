import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArtistProfile } from '@/hooks/useArtistProfile';
import { useGuestbook } from '@/hooks/useGuestbook';
import { useAuthStore } from '@/stores/authStore';
import * as followsService from '@/services/follows';
import { Avatar } from '@/components/common/Avatar';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import FollowButton from '@/components/artist/FollowButton';
import ArtworkGrid from '@/components/artwork/ArtworkGrid';
import GuestbookMessageItem from '@/components/guestbook/GuestbookMessage';
import GuestbookInput from '@/components/guestbook/GuestbookInput';
import { formatCount } from '@/lib/formatters';
import { showToast } from '@/stores/toastStore';

type Tab = 'artworks' | 'guestbook';

export default function ArtistPortfolioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<Tab>('artworks');
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ messageId: string; nickname: string } | null>(null);
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [followReady, setFollowReady] = useState(false);

  const { artist, artworks, isLoading, error, load, loadMoreArtworks, isLoadingMoreArtworks } =
    useArtistProfile(id ?? '');
  const { messages, isLoading: isLoadingMessages, loadMessages, loadMore, sendMessage, sendReply, deleteMessage } =
    useGuestbook(id ?? '');

  const isOwner = !!id && currentUser?.id === id;

  useEffect(() => {
    if (!id) return;
    load();
    loadMessages();
  }, [id, load, loadMessages]);

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

  const handleSend = useCallback(async (content: string): Promise<void> => {
    if (!currentUser) { setLoginPromptVisible(true); return; }
    if (replyTarget) {
      const result = await sendReply(replyTarget.messageId, content);
      if (!result.success) showToast(result.error.message, 'error');
      setReplyTarget(null);
    } else {
      const result = await sendMessage(content);
      if (!result.success) showToast(result.error.message, 'error');
    }
  }, [currentUser, replyTarget, sendMessage, sendReply]);

  const handleDelete = useCallback((messageId: string) => {
    Alert.alert('메시지 삭제', '이 메시지를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        const result = await deleteMessage(messageId);
        if (!result.success) showToast(result.error.message, 'error');
      }},
    ]);
  }, [deleteMessage]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  if (error || !artist) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Pressable onPress={() => router.back()} className="px-4 py-3">
          <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
        </Pressable>
        <ErrorState message={error ?? '작가를 찾을 수 없습니다'} onRetry={error ? load : undefined} />
      </SafeAreaView>
    );
  }

  const profileHeader = (
    <View>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
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
        <View className="mt-4">
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
            <ActivityIndicator size="small" color="#8B5CF6" />
          )}
        </View>
      </View>
      <View className="flex-row border-b border-border">
        <Pressable
          onPress={() => setActiveTab('artworks')}
          className={`flex-1 items-center py-3 ${activeTab === 'artworks' ? 'border-b-2 border-accent-primary' : ''}`}
        >
          <Text className={`text-sm font-medium ${activeTab === 'artworks' ? 'text-accent-primary' : 'text-text-secondary'}`}>
            작품
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('guestbook')}
          className={`flex-1 items-center py-3 ${activeTab === 'guestbook' ? 'border-b-2 border-accent-primary' : ''}`}
        >
          <Text className={`text-sm font-medium ${activeTab === 'guestbook' ? 'text-accent-primary' : 'text-text-secondary'}`}>
            방명록
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (activeTab === 'artworks') {
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GuestbookMessageItem
            message={item}
            isArtist={isOwner}
            onDelete={handleDelete}
            onReply={(msgId) => setReplyTarget({ messageId: msgId, nickname: item.authorNickname })}
          />
        )}
        ListHeaderComponent={profileHeader}
        ListEmptyComponent={
          isLoadingMessages ? undefined : (
            <EmptyState message="아직 방명록이 없습니다. 첫 번째 메시지를 남겨보세요!" />
          )
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
      {currentUser ? (
        <GuestbookInput
          onSend={handleSend}
          replyTo={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
        />
      ) : (
        <Pressable
          onPress={() => setLoginPromptVisible(true)}
          className="border-t border-border bg-elevated px-4 py-3"
        >
          <Text className="text-center text-sm text-text-tertiary">로그인 후 작성 가능합니다</Text>
        </Pressable>
      )}
      <LoginPromptSheet
        visible={loginPromptVisible}
        onClose={() => setLoginPromptVisible(false)}
        message="방명록을 작성하려면 로그인이 필요합니다"
      />
    </SafeAreaView>
  );
}
