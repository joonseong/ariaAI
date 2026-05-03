import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/lib/validators';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { showToast } from '@/stores/toastStore';
import BrandLogo from '@/assets/icon.logo.brand.svg';
import IconKakao from '@/assets/icons/icon.kakao.svg';
import IconGoogle from '@/assets/icons/icon.google.svg';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, signInWithKakao } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | 'kakao' | null>(null);

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

    if (result.success) {
      router.replace('/(tabs)/home');
      return;
    } else if (!result.success) {
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

  const handleSocialLogin = useCallback(async (provider: 'google' | 'apple' | 'kakao') => {
    setSocialLoading(provider);
    let result;
    if (provider === 'google') result = await signInWithGoogle();
    else if (provider === 'apple') result = await signInWithApple();
    else result = await signInWithKakao();
    setSocialLoading(null);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else if (result.error.code !== 'auth/cancelled') {
      showToast(result.error.message, 'error');
    }
  }, [signInWithGoogle, signInWithApple, signInWithKakao, router]);

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
          <View className="mb-12 items-center">
            <BrandLogo width={200} height={89} />
          </View>

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

          {/* SNS 로그인 */}
          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-xs text-text-tertiary">또는</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <View className="flex-row justify-center gap-4">
            {/* 카카오 */}
            <Pressable
              onPress={() => handleSocialLogin('kakao')}
              disabled={socialLoading !== null}
              className="h-14 w-14 items-center justify-center rounded-full bg-[#FEE500]"
              accessibilityLabel="카카오로 로그인"
            >
              {socialLoading === 'kakao' ? (
                <ActivityIndicator size="small" color="#3C1E1E" />
              ) : (
                <IconKakao width={24} height={24} />
              )}
            </Pressable>

            {/* 구글 */}
            <Pressable
              onPress={() => handleSocialLogin('google')}
              disabled={socialLoading !== null}
              className="h-14 w-14 items-center justify-center rounded-full bg-elevated"
              accessibilityLabel="구글로 로그인"
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator size="small" color="#F5F5F5" />
              ) : (
                <IconGoogle width={24} height={24} />
              )}
            </Pressable>

            {/* 애플 — iOS 전용 */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={28}
                style={{ width: 56, height: 56 }}
                onPress={() => handleSocialLogin('apple')}
              />
            )}
          </View>

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
