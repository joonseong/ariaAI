import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Share, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArtworkDetail } from '@/hooks/useArtworkDetail';
import { useLike } from '@/hooks/useLike';
import { useArtworkDelete } from '@/hooks/useArtworkDelete';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/toastStore';
import * as likesService from '@/services/likes';
import { formatRelativeTime } from '@/lib/formatters';
import { ArtworkImageViewer } from '@/components/artwork/ArtworkImageViewer';
import { ArtistMiniCard } from '@/components/artwork/ArtistMiniCard';
import { TagChip } from '@/components/artwork/TagChip';
import { ArtworkActionBar } from '@/components/artwork/ArtworkActionBar';
import { ErrorState } from '@/components/common/ErrorState';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import ReportSheet from '@/components/common/ReportSheet';

export default function ArtworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { artwork, isLoading, error, refresh } = useArtworkDetail(id ?? '');

  const [initialLiked, setInitialLiked] = useState(false);
  const [likeReady, setLikeReady] = useState(false);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  const { isDeleting, deleteArtwork } = useArtworkDelete();

  useEffect(() => {
    if (!user || !artwork) { setLikeReady(true); return; }
    likesService.checkLiked(user.id, artwork.id).then((result) => {
      if (result.success) setInitialLiked(result.data);
      setLikeReady(true);
    });
  }, [user, artwork?.id]);

  const { liked, count, toggle } = useLike(
    artwork?.id ?? '', initialLiked, artwork?.likesCount ?? 0,
  );

  const handleLikePress = useCallback(() => {
    if (!isAuthenticated) { setLoginPromptVisible(true); return; }
    toggle();
  }, [isAuthenticated, toggle]);

  const handleShare = useCallback(async () => {
    if (!artwork) return;
    try {
      await Share.share({
        message: `${artwork.title} - Aria에서 확인해보세요!`,
        url: `aria://artwork/${artwork.id}`,
      });
    } catch { /* cancelled */ }
  }, [artwork]);

  const handleArtistPress = useCallback(() => {
    if (!artwork) return;
    router.push(`/artist/${artwork.authorId}`);
  }, [artwork, router]);

  const handleDeleteConfirm = useCallback(() => {
    if (!artwork) return;
    Alert.alert(
      '작품 삭제',
      '이 작품을 삭제하시겠습니까? 삭제된 작품은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteArtwork(artwork.id);
            if (!result.success) {
              showToast(result.error.message, 'error');
              return;
            }
            showToast('작품이 삭제되었습니다', 'success');
            router.back();
          },
        },
      ],
    );
  }, [artwork, deleteArtwork, router]);

  const handleMoreMenu = useCallback(() => {
    if (!artwork) return;
    const isOwner = user?.id === artwork.authorId;
    const buttons = isOwner
      ? [
          { text: '수정', onPress: () => router.push(`/artwork/edit?id=${artwork.id}`) },
          { text: '삭제', style: 'destructive' as const, onPress: handleDeleteConfirm },
          { text: '취소', style: 'cancel' as const },
        ]
      : [
          { text: '신고', onPress: () => setReportSheetVisible(true) },
          { text: '취소', style: 'cancel' as const },
        ];
    Alert.alert('', '', buttons);
  }, [artwork, user, router, handleDeleteConfirm]);

  const handleBack = useCallback(() => router.back(), [router]);

  useEffect(() => {
    if (!isLoading && !error && artwork === null && id) {
      showToast('삭제된 작품입니다', 'error');
      const timer = setTimeout(() => router.back(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, error, artwork, id, router]);

  if (isLoading || !likeReady || isDeleting) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  if (error || !artwork) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 py-3">
          <Pressable onPress={handleBack} accessibilityLabel="뒤로가기">
            <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
          </Pressable>
        </View>
        <ErrorState
          message={error ?? '작품을 찾을 수 없습니다'}
          onRetry={error ? refresh : undefined}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={handleBack} accessibilityLabel="뒤로가기">
          <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
        </Pressable>
        <Text className="text-base font-semibold text-text-primary" numberOfLines={1}>
          작품 상세
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ArtworkImageViewer imageUrls={artwork.imageUrls} />

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-text-primary">{artwork.title}</Text>
          {artwork.description.length > 0 && (
            <Text className="mt-2 text-sm leading-5 text-text-secondary">
              {artwork.description}
            </Text>
          )}
          {artwork.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 8 }}
            >
              {artwork.tool && <TagChip label={artwork.tool} />}
              {artwork.tags.map((tag) => <TagChip key={tag} label={tag} />)}
            </ScrollView>
          )}
          <Text className="mt-3 text-xs text-text-tertiary">
            {formatRelativeTime(artwork.createdAt)}
          </Text>
        </View>

        <View className="mx-4 my-4 h-px bg-border" />

        <View className="px-4 pb-6">
          <ArtistMiniCard
            authorId={artwork.authorId}
            authorNickname={artwork.authorNickname}
            authorProfileImageUrl={artwork.authorProfileImageUrl}
            onPress={handleArtistPress}
          />
        </View>
      </ScrollView>

      <ArtworkActionBar
        liked={liked}
        likeCount={count}
        onLikePress={handleLikePress}
        onSharePress={handleShare}
        onMorePress={handleMoreMenu}
      />

      <LoginPromptSheet
        visible={loginPromptVisible}
        onClose={() => setLoginPromptVisible(false)}
        message="좋아요를 누르려면 로그인이 필요합니다"
      />

      {artwork && (
        <ReportSheet
          visible={reportSheetVisible}
          targetType="artwork"
          targetId={artwork.id}
          onClose={() => setReportSheetVisible(false)}
          onReported={() => setReportSheetVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}
