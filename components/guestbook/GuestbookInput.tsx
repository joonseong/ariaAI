import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const trimmed = content.trim();
  const canSend = trimmed.length >= 1 && trimmed.length <= 200 && !isSending && !disabled;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    await onSend(trimmed);
    setContent('');
    setIsSending(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {replyTo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2A2A2A', backgroundColor: '#262626', paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ width: 3, height: 16, backgroundColor: '#F53356', borderRadius: 2, marginRight: 8 }} />
          <Text style={{ flex: 1, fontSize: 13, color: '#A3A3A3' }}>
            {replyTo.nickname}님에게 답글
          </Text>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <Text style={{ fontSize: 13, color: '#808080' }}>{'\u2715'}</Text>
          </Pressable>
        </View>
      )}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
        backgroundColor: '#0D0D0D',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
      }}>
        <TextInput
          ref={inputRef}
          value={content}
          onChangeText={setContent}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#808080"
          maxLength={200}
          multiline
          editable={!disabled && !isSending}
          style={{
            flex: 1,
            maxHeight: 100,
            backgroundColor: '#1A1A1A',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 15,
            color: '#F5F5F5',
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={{
            marginLeft: 8,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: canSend ? '#F53356' : '#262626',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: canSend ? '#FFFFFF' : '#808080' }}>
            {'\u2191'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
