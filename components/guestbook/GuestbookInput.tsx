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
        <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E5E5', backgroundColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ width: 3, height: 16, backgroundColor: '#F53356', borderRadius: 2, marginRight: 8 }} />
          <Text style={{ flex: 1, fontSize: 13, color: '#525252' }}>
            {replyTo.nickname}님에게 답글
          </Text>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <Text style={{ fontSize: 13, color: '#737373' }}>{'\u2715'}</Text>
          </Pressable>
        </View>
      )}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
      }}>
        <TextInput
          ref={inputRef}
          value={content}
          onChangeText={setContent}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#737373"
          maxLength={200}
          multiline
          editable={!disabled && !isSending}
          style={{
            flex: 1,
            maxHeight: 100,
            backgroundColor: '#F0F0F0',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 15,
            color: '#0D0D0D',
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
            backgroundColor: canSend ? '#F53356' : '#E5E5E5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: canSend ? '#FFFFFF' : '#737373' }}>
            {'\u2191'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
