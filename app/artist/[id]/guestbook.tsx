import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGuestbook } from '@/hooks/useGuestbook';
import { useAuthStore } from '@/stores/authStore';
import GuestbookMessageItem from '@/components/guestbook/GuestbookMessage';
import GuestbookInput from '@/components/guestbook/GuestbookInput';
import { EmptyState } from '@/components/common/EmptyState';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import { showToast } from '@/stores/toastStore';

export default function GuestbookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [replyTarget, setReplyTarget] = useState<{ messageId: string; nickname: string } | null>(null);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);

  const {
    messages,
    isLoading,
    isLoadingMore,
    loadMessages,
    loadMore,
    sendMessage,
    sendReply,
    deleteMessage,
  } = useGuestbook(id ?? '');

  const isArtist = !!id && currentUser?.id === id;

  useEffect(() => {
    if (id) loadMessages();
  }, [id, loadMessages]);

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
        </Pressable>
        <Text className="ml-4 text-lg font-semibold text-text-primary">방명록</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GuestbookMessageItem
              message={item}
              isArtist={isArtist}
              onDelete={handleDelete}
              onReply={(msgId) => setReplyTarget({ messageId: msgId, nickname: item.authorNickname })}
            />
          )}
          ListEmptyComponent={
            <EmptyState message="아직 방명록이 없습니다. 첫 번째 메시지를 남겨보세요!" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : undefined
          }
        />
      )}

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
