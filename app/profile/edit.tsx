import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfileEdit } from '@/hooks/useProfileEdit';
import { useAccountDelete } from '@/hooks/useAccountDelete';
import { useDiscardGuard } from '@/hooks/useDiscardGuard';
import { Avatar } from '@/components/common/Avatar';
import { Input } from '@/components/common/Input';
import { showToast } from '@/stores/toastStore';

export default function ProfileEditScreen(): React.JSX.Element {
  const router = useRouter();
  const [nicknameError, setNicknameError] = useState('');

  const {
    nickname,
    setNickname,
    bio,
    setBio,
    profileImage,
    isSubmitting,
    isDirty,
    loadProfile,
    pickImage,
    saveAll,
  } = useProfileEdit();

  const { isDeleting, deleteAccount } = useAccountDelete();

  useDiscardGuard(isDirty);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = useCallback(async () => {
    setNicknameError('');
    const result = await saveAll();
    if (result.success) {
      showToast('프로필이 수정되었습니다', 'success');
      router.back();
    } else {
      if (result.error.code.includes('nickname')) {
        setNicknameError(result.error.message);
      } else {
        showToast(result.error.message, 'error');
      }
    }
  }, [saveAll, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      '회원 탈퇴',
      '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount();
            if (!result.success) {
              showToast(result.error.message, 'error');
            }
          },
        },
      ],
    );
  }, [deleteAccount]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기">
            <Text className="text-2xl text-text-primary">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-text-primary">프로필 수정</Text>
          <Pressable
            onPress={handleSave}
            disabled={!isDirty || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="저장"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#F53356" />
            ) : (
              <Text
                className={`text-sm font-semibold ${isDirty ? 'text-accent-primary' : 'text-text-tertiary'}`}
              >
                저장
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image */}
          <View className="mb-6 items-center">
            <Pressable
              onPress={pickImage}
              accessibilityLabel="프로필 사진 변경"
              className="relative"
            >
              <Avatar uri={profileImage} size={80} fallbackText={nickname} />
              <View className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-accent-primary">
                <Text className="text-xs font-bold text-white">+</Text>
              </View>
            </Pressable>
            <Text className="mt-2 text-xs text-text-tertiary">탭하여 사진 변경</Text>
          </View>

          {/* Nickname */}
          <View className="mb-4">
            <Input
              label="닉네임"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChangeText={(text) => {
                setNickname(text);
                setNicknameError('');
              }}
              error={nicknameError}
              maxLength={20}
              autoCapitalize="none"
            />
          </View>

          {/* Bio */}
          <View className="mb-4">
            <Input
              label="한 줄 소개"
              placeholder="나를 소개해보세요"
              value={bio}
              onChangeText={setBio}
              maxLength={150}
              multiline
            />
            <Text className="mt-1 text-right text-xs text-text-tertiary">{bio.length}/150</Text>
          </View>

          {/* Delete Account */}
          <View className="mt-12 items-center">
            {isDeleting ? (
              <ActivityIndicator size="small" color="#F53356" />
            ) : (
              <Pressable onPress={handleDeleteAccount} accessibilityRole="button">
                <Text className="text-sm text-text-tertiary underline">회원 탈퇴</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
