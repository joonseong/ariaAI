import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/validators';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { showToast } from '@/stores/toastStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = useCallback(async () => {
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    setEmailError('');

    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);

    if (result.success) {
      showToast('비밀번호 재설정 링크가 전송되었습니다.', 'success');
      router.back();
    } else {
      showToast('비밀번호 재설정 링크가 전송되었습니다.', 'success');
      router.back();
    }
  }, [email, resetPassword, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-4 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} className="mb-6">
            <Text className="text-base text-text-secondary">{'← 뒤로'}</Text>
          </Pressable>

          <Text className="mb-2 text-2xl font-bold text-text-primary">
            비밀번호 재설정
          </Text>

          <Text className="mb-8 text-sm text-text-secondary">
            가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.
          </Text>

          <View className="mb-6">
            <Input
              label="이메일"
              placeholder="이메일을 입력해주세요"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Button
            title="재설정 링크 보내기"
            onPress={handleReset}
            loading={loading}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
