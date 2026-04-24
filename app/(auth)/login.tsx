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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = useCallback((): boolean => {
    let valid = true;

    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('올바른 이메일 주소를 입력해주세요.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      const code = result.error.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (code === 'auth/too-many-requests') {
        showToast('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.', 'error');
      } else if (code === 'auth/network-request-failed') {
        showToast('인터넷 연결을 확인해주세요.', 'error');
      } else {
        showToast(result.error.message, 'error');
      }
    }
  }, [email, password, signIn, validate]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-4"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-10 text-center text-2xl font-bold text-text-primary">
            Aria
          </Text>

          <View className="mb-4">
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

          <View className="mb-2">
            <Input
              label="비밀번호"
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            className="mb-6 self-end"
          >
            <Text className="text-xs text-text-secondary">
              비밀번호를 잊으셨나요?
            </Text>
          </Pressable>

          <Button
            title="로그인"
            onPress={handleLogin}
            loading={loading}
            fullWidth
          />

          <View className="my-6 flex-row items-center">
            <View className="flex-1 border-b border-border" />
            <Text className="mx-4 text-xs text-text-tertiary">또는</Text>
            <View className="flex-1 border-b border-border" />
          </View>

          <View className="mb-3">
            <Button
              title="Google로 계속하기"
              onPress={() => {}}
              variant="secondary"
              fullWidth
            />
          </View>

          <Button
            title="Apple로 계속하기"
            onPress={() => {}}
            variant="secondary"
            fullWidth
          />

          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-text-secondary">
              계정이 없으신가요?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-sm font-semibold text-accent-primary">
                가입하기
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
