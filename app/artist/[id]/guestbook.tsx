import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGuestbook } from '@/hooks/useGuestbook';
import { useAuthStore } from '@/stores/authStore';
import GuestbookMessageItem from '@/components/guestbook/GuestbookMessage';
import GuestbookInput from '@/components/guestbook/GuestbookInput';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
          <Text style={{ fontSize: 22, color: '#F5F5F5' }}>{'\u2190'}</Text>
        </Pressable>
        <Text style={{ marginLeft: 16, fontSize: 18, fontWeight: '600', color: '#F5F5F5' }}>방명록</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => (
            <GuestbookMessageItem
              message={item}
              isArtist={isArtist}
              onDelete={handleDelete}
              onReply={(msgId) => setReplyTarget({ messageId: msgId, nickname: item.authorNickname })}
            />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, transform: [{ scaleY: -1 }] }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83D\uDCAC'}</Text>
              <Text style={{ fontSize: 15, color: '#808080', textAlign: 'center' }}>
                아직 방명록이 없습니다{'\n'}첫 번째 메시지를 남겨보세요!
              </Text>
            </View>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
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
          style={{ borderTopWidth: 1, borderTopColor: '#2A2A2A', backgroundColor: '#262626', paddingHorizontal: 16, paddingVertical: 14 }}
        >
          <Text style={{ textAlign: 'center', fontSize: 14, color: '#808080' }}>로그인 후 작성 가능합니다</Text>
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
