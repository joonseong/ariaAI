import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { isValidEmail, isValidPassword, isValidNickname } from '@/lib/validators';
import { checkNicknameAvailable } from '@/services/users';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { showToast } from '@/stores/toastStore';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedNickname = useDebounce(nickname, 500);

  useEffect(() => {
    if (!debouncedNickname || !isValidNickname(debouncedNickname)) {
      setNicknameSuccess('');
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await checkNicknameAvailable(debouncedNickname);
      if (cancelled) return;
      if (result.success) {
        if (result.data) {
          setNicknameError('');
          setNicknameSuccess('사용 가능한 닉네임입니다.');
        } else {
          setNicknameSuccess('');
          setNicknameError('이미 사용 중인 닉네임입니다.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedNickname]);

  const validate = useCallback((): boolean => {
    let valid = true;
    if (!email.trim()) { setEmailError('이메일을 입력해주세요.'); valid = false; }
    else if (!isValidEmail(email)) { setEmailError('올바른 이메일 주소를 입력해주세요.'); valid = false; }
    else setEmailError('');

    if (!password) { setPasswordError('비밀번호를 입력해주세요.'); valid = false; }
    else if (!isValidPassword(password)) { setPasswordError('비밀번호는 영문과 숫자를 포함하여 8자 이상이어야 합니다.'); valid = false; }
    else setPasswordError('');

    if (!confirmPassword) { setConfirmError('비밀번호 확인을 입력해주세요.'); valid = false; }
    else if (password !== confirmPassword) { setConfirmError('비밀번호가 일치하지 않습니다.'); valid = false; }
    else setConfirmError('');

    if (!nickname.trim()) { setNicknameError('닉네임을 입력해주세요.'); valid = false; }
    else if (!isValidNickname(nickname)) { setNicknameError('닉네임은 2~20자, 한글·영문·숫자·밑줄만 사용 가능합니다.'); valid = false; }
    else if (nicknameError) valid = false;
    return valid;
  }, [email, password, confirmPassword, nickname, nicknameError]);

  const handleSignup = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await signUp({ email: email.trim(), password, nickname: nickname.trim() });
    setLoading(false);
    if (!result.success) {
      if (result.error.code === 'auth/email-already-in-use') setEmailError('이미 가입된 이메일입니다.');
      else if (result.error.code === 'auth/network-request-failed') showToast('인터넷 연결을 확인해주세요.', 'error');
      else showToast(result.error.message, 'error');
    }
  }, [email, password, nickname, signUp, validate]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView className="flex-1" contentContainerClassName="flex-grow px-4 pb-8 pt-4" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} className="mb-6">
            <Text className="text-base text-text-secondary">{'← 뒤로'}</Text>
          </Pressable>
          <Text className="mb-8 text-2xl font-bold text-text-primary">회원가입</Text>
          <View className="mb-4">
            <Input label="이메일" placeholder="이메일을 입력해주세요" value={email}
              onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
              error={emailError} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View className="mb-4">
            <Input label="비밀번호" placeholder="영문과 숫자를 포함하여 8자 이상" value={password}
              onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
              error={passwordError} secureTextEntry autoCapitalize="none" />
          </View>
          <View className="mb-4">
            <Input label="비밀번호 확인" placeholder="비밀번호를 다시 입력해주세요" value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); if (confirmError) setConfirmError(''); }}
              error={confirmError} secureTextEntry autoCapitalize="none" />
          </View>
          <View className="mb-2">
            <Input label="닉네임" placeholder="2~20자, 한글·영문·숫자·밑줄" value={nickname}
              onChangeText={(t) => { setNickname(t); setNicknameError(''); setNicknameSuccess(''); }}
              error={nicknameError} maxLength={20} autoCapitalize="none" />
            {nicknameSuccess && !nicknameError ? (
              <Text className="mt-1 text-xs text-semantic-success">{nicknameSuccess}</Text>
            ) : null}
          </View>
          <View className="mt-6">
            <Button title="가입하기" onPress={handleSignup} loading={loading} fullWidth />
          </View>
          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-text-secondary">이미 계정이 있으신가요? </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-sm font-semibold text-accent-primary">로그인</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
