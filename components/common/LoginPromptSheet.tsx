import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from './Button';

interface LoginPromptSheetProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginPromptSheet({
  visible,
  onClose,
  message = '로그인이 필요합니다',
}: LoginPromptSheetProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  const handleSignup = () => {
    onClose();
    router.push('/signup');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-2xl bg-surface px-6 pb-10 pt-6"
          onPress={() => {}}
        >
          <View className="mb-2 items-center">
            <View className="h-1 w-10 rounded-full bg-elevated" />
          </View>

          <Text className="mb-2 mt-4 text-center text-lg font-bold text-text-primary">
            {message}
          </Text>
          <Text className="mb-6 text-center text-sm text-text-secondary">
            가입하면 좋아하는 작가의 새 작품을 가장 먼저 만나보세요
          </Text>

          <View className="gap-3">
            <Button title="로그인" onPress={handleLogin} fullWidth />
            <Button
              title="가입하기"
              onPress={handleSignup}
              variant="secondary"
              fullWidth
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
