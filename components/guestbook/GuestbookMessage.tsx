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

  if (isAuthor) {
    // 내가 쓴 글 — 오른쪽 정렬, 포인트 컬러
    return (
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 8 }}>
          {/* 시간 + 삭제 (버블 왼쪽) */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Pressable onPress={() => onDelete(message.id)} hitSlop={8}>
              <Text style={{ fontSize: 11, color: '#808080' }}>삭제</Text>
            </Pressable>
            <Text style={{ fontSize: 11, color: '#808080' }}>
              {formatRelativeTime(message.createdAt)}
            </Text>
          </View>

          {/* 버블 */}
          <View style={{ maxWidth: '70%' }}>
            <View
              style={{
                backgroundColor: '#F53356',
                borderRadius: 18,
                borderBottomRightRadius: 4,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 15, color: '#FFFFFF', lineHeight: 21 }}>
                {message.content}
              </Text>
            </View>
          </View>

          {/* 내 아바타 */}
          <Avatar
            uri={currentUser?.profileImageUrl ?? null}
            size={32}
            fallbackText={message.authorNickname}
          />
        </View>
      </View>
    );
  }

  // 다른 사람 글 — 왼쪽 정렬
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {/* 상대방 아바타 */}
        <Avatar
          uri={message.authorProfileImageUrl}
          size={32}
          fallbackText={message.authorNickname}
        />

        <View style={{ maxWidth: '70%' }}>
          <Text style={{ fontSize: 12, color: '#808080', marginBottom: 4 }}>
            {message.authorNickname}
          </Text>
          {/* 버블 */}
          <View
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: 18,
              borderBottomLeftRadius: 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 15, color: '#F5F5F5', lineHeight: 21 }}>
              {message.content}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 }}>
            <Text style={{ fontSize: 11, color: '#808080' }}>
              {formatRelativeTime(message.createdAt)}
            </Text>
            {isArtist && !message.replyContent && (
              <Pressable onPress={() => onReply(message.id)} hitSlop={8}>
                <Text style={{ fontSize: 11, color: '#808080' }}>답글</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* 작가 답글 (오른쪽 정렬) */}
      {message.replyContent && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: '#808080', alignSelf: 'flex-end' }}>
            {message.replyCreatedAt ? formatRelativeTime(message.replyCreatedAt) : ''}
          </Text>
          <View
            style={{
              maxWidth: '70%',
              backgroundColor: '#F53356',
              borderRadius: 18,
              borderBottomRightRadius: 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 15, color: '#FFFFFF', lineHeight: 21 }}>
              {message.replyContent}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
