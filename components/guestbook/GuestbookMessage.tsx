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
    <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
      {/* Visitor message — left aligned */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' }}>
        <Avatar
          uri={message.authorProfileImageUrl}
          size={32}
          fallbackText={message.authorNickname}
        />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={{ fontSize: 13, color: '#A3A3A3', marginBottom: 2 }}>
            {message.authorNickname}
          </Text>
          <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, borderTopLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
            <Text style={{ fontSize: 15, color: '#F5F5F5', lineHeight: 21 }}>
              {message.content}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 }}>
            <Text style={{ fontSize: 11, color: '#808080' }}>
              {formatRelativeTime(message.createdAt)}
            </Text>
            {isArtist && !message.replyContent && (
              <Pressable onPress={() => onReply(message.id)} hitSlop={8}>
                <Text style={{ fontSize: 11, color: '#808080' }}>답글</Text>
              </Pressable>
            )}
            {canDelete && (
              <Pressable onPress={() => onDelete(message.id)} hitSlop={8}>
                <Text style={{ fontSize: 11, color: '#808080' }}>삭제</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Artist reply — right aligned */}
      {message.replyContent && (
        <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
          <View style={{ maxWidth: '75%' }}>
            <View style={{ backgroundColor: '#8B5CF6', borderRadius: 16, borderTopRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ fontSize: 15, color: '#FFFFFF', lineHeight: 21 }}>
                {message.replyContent}
              </Text>
            </View>
            {message.replyCreatedAt && (
              <Text style={{ fontSize: 11, color: '#808080', marginTop: 4, textAlign: 'right' }}>
                {formatRelativeTime(message.replyCreatedAt)}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
