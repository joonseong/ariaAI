import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { GuestbookMessage as GuestbookMessageType } from '@/types/guestbook';
import { Avatar } from '@/components/common/Avatar';
import { formatRelativeTime } from '@/lib/formatters';
import { useAuthStore } from '@/stores/authStore';

interface GuestbookMessageProps {
  message: GuestbookMessageType;
  isArtist: boolean;
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void;
}

export default function GuestbookMessage({
  message,
  isArtist,
  onDelete,
  onReply,
}: GuestbookMessageProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isAuthor = currentUser?.id === message.authorId;
  const canDelete = isAuthor || isArtist;

  return (
    <View className="px-4 py-3">
      <View className="flex-row items-start">
        <Avatar
          uri={message.authorProfileImageUrl}
          size={36}
          fallbackText={message.authorNickname}
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-medium text-text-primary">
                {message.authorNickname}
              </Text>
              <Text className="text-xs text-text-tertiary">
                {formatRelativeTime(message.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              {isArtist && !message.replyContent && (
                <Pressable
                  onPress={() => onReply(message.id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="답글 달기"
                >
                  <Text className="text-xs text-text-tertiary">답글</Text>
                </Pressable>
              )}
              {canDelete && (
                <Pressable
                  onPress={() => onDelete(message.id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="삭제"
                >
                  <Text className="text-xs text-text-tertiary">삭제</Text>
                </Pressable>
              )}
            </View>
          </View>
          <Text className="mt-1 text-sm text-text-primary">{message.content}</Text>
        </View>
      </View>

      {message.replyContent && (
        <View className="ml-12 mt-2 rounded-lg bg-elevated px-3 py-2">
          <Text className="mb-1 text-xs font-medium text-accent-primary">작가</Text>
          <Text className="text-sm text-text-primary">{message.replyContent}</Text>
          {message.replyCreatedAt && (
            <Text className="mt-1 text-xs text-text-tertiary">
              {formatRelativeTime(message.replyCreatedAt)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
