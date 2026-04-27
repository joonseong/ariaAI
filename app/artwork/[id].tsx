import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Share, Alert, ActivityIndicator } from 'react-native';
import * as ClipboardModule from 'expo-clipboard';
import IconBack from '@/assets/icons/icon.back.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useArtworkDetail } from '@/hooks/useArtworkDetail';
import { useLike } from '@/hooks/useLike';
import { useArtworkDelete } from '@/hooks/useArtworkDelete';
import { usePromptUnlock } from '@/hooks/usePromptUnlock';
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
  const [unlockedPrompt, setUnlockedPrompt] = useState<string | null>(null);
  const { isDeleting, deleteArtwork } = useArtworkDelete();
  const {
    isUnlocked,
    isChecking: isCheckingUnlock,
    isUnlocking,
    isOwner,
    costPoints,
    unlock,
  } = usePromptUnlock(artwork?.id ?? '', artwork?.authorId ?? '');

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

  const handleUnlockPrompt = useCallback(async () => {
    if (!isAuthenticated) { setLoginPromptVisible(true); return; }
    if (!artwork) return;

    const balance = user?.pointBalance ?? 0;
    if (balance < costPoints) {
      Alert.alert(
        '포인트 부족',
        `프롬프트 열람에 ${costPoints}P가 필요합니다.\n현재 잔액: ${balance}P\n\n포인트를 충전하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '충전하기', onPress: () => router.push('/profile/points' as never) },
        ],
      );
      return;
    }

    Alert.alert(
      '프롬프트 열람',
      `${costPoints}P를 사용하여 프롬프트를 열람하시겠습니까?\n현재 잔액: ${balance}P`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '열람하기',
          onPress: async () => {
            const result = await unlock();
            if (result.success && result.prompt) {
              setUnlockedPrompt(result.prompt);
              showToast('프롬프트가 열람되었습니다', 'success');
            } else {
              showToast(result.errorMessage ?? '열람에 실패했습니다', 'error');
            }
          },
        },
      ],
    );
  }, [isAuthenticated, artwork, user, costPoints, unlock, router]);

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
        <ActivityIndicator size="large" color="#F53356" />
      </SafeAreaView>
    );
  }

  if (error || !artwork) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 py-3">
          <Pressable onPress={handleBack} accessibilityLabel="뒤로가기">
            <IconBack width={28} height={28} color="#FFFFFF" />
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
          <IconBack width={28} height={28} color="#FFFFFF" />
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

        {artwork.hasPrompt && (
          <>
            <View className="mx-4 mb-4 h-px bg-border" />
            <View className="px-4 pb-8">
              <Text className="mb-3 text-base font-semibold text-text-primary">생성 프롬프트</Text>
              {isCheckingUnlock ? (
                <ActivityIndicator size="small" color="#F53356" />
              ) : (isUnlocked || isOwner) ? (
                <View className="rounded-xl bg-surface p-4">
                  <View className="mb-2 flex-row items-center justify-end">
                    <Pressable
                      onPress={() => {
                        const text = unlockedPrompt ?? artwork.prompt ?? '';
                        ClipboardModule.setStringAsync(text);
                        showToast('프롬프트가 복사되었습니다', 'success');
                      }}
                      hitSlop={8}
                      accessibilityLabel="프롬프트 복사"
                    >
                      <Text className="text-xs font-medium text-accent-primary">복사</Text>
                    </Pressable>
                  </View>
                  <Text className="text-sm leading-5 text-text-secondary" selectable>
                    {unlockedPrompt ?? artwork.prompt}
                  </Text>
                </View>
              ) : (
                <View className="items-center rounded-xl bg-surface p-6">
                  <Text className="mb-1 text-2xl">🔒</Text>
                  <Text className="mb-4 text-center text-sm text-text-secondary">
                    이 프롬프트는 잠겨있습니다.{'\n'}열람하려면 {costPoints}P가 필요합니다.
                  </Text>
                  <Pressable
                    onPress={handleUnlockPrompt}
                    disabled={isUnlocking}
                    className="rounded-full bg-accent-primary px-6 py-3"
                    accessibilityLabel="프롬프트 열람하기"
                  >
                    {isUnlocking ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">{costPoints}P로 프롬프트 열람하기</Text>
                    )}
                  </Pressable>
                  {(user?.pointBalance ?? 0) < costPoints && (
                    <Pressable
                      onPress={() => router.push('/profile/points' as never)}
                      className="mt-3"
                    >
                      <Text className="text-xs text-accent-primary">포인트 충전하기</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </>
        )}
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
