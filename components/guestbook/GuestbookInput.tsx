import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LIMITS } from '@/lib/constants';

interface GuestbookInputProps {
  onSend: (content: string) => Promise<void>;
  replyTo?: { messageId: string; nickname: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export default function GuestbookInput({
  onSend,
  replyTo,
  onCancelReply,
  disabled = false,
}: GuestbookInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const trimmed = content.trim();
  const canSend = trimmed.length >= 1 && trimmed.length <= LIMITS.GUESTBOOK_PAGE_SIZE && !isSending && !disabled;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    await onSend(trimmed);
    setContent('');
    setIsSending(false);
    inputRef.current?.blur();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {replyTo && (
        <View className="flex-row items-center border-t border-border bg-elevated px-4 py-2">
          <Text className="flex-1 text-xs text-text-secondary">
            @{replyTo.nickname}에게 답글
          </Text>
          <Pressable
            onPress={onCancelReply}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="답글 취소"
          >
            <Text className="text-xs text-text-tertiary">취소</Text>
          </Pressable>
        </View>
      )}
      <View className="flex-row items-end border-t border-border bg-elevated px-4 py-2">
        <TextInput
          ref={inputRef}
          value={content}
          onChangeText={setContent}
          placeholder="방명록을 남겨보세요..."
          placeholderTextColor="#808080"
          maxLength={200}
          multiline
          editable={!disabled && !isSending}
          className="max-h-24 flex-1 rounded-xl bg-background px-3 py-2 text-sm text-text-primary"
          accessibilityLabel="방명록 입력"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className={`ml-2 items-center justify-center rounded-full p-2 ${
            canSend ? 'bg-accent-primary' : 'bg-elevated'
          }`}
          accessibilityRole="button"
          accessibilityLabel="전송"
        >
          <Text
            className={`text-sm font-medium ${
              canSend ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            전송
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
