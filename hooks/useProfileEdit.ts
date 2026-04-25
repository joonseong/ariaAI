import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/authStore';
import * as usersService from '@/services/users';
import { resizeImage } from '@/lib/image';
import { isValidNickname, isValidBio } from '@/lib/validators';
import { Result } from '@/types/common';

export function useProfileEdit() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [nickname, setNicknameState] = useState('');
  const [bio, setBioState] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadProfile = useCallback(() => {
    if (!user) return;
    setNicknameState(user.nickname);
    setBioState(user.bio);
    setProfileImage(user.profileImageUrl);
    setIsDirty(false);
  }, [user]);

  const setNickname = useCallback((value: string) => {
    setNicknameState(value);
    setIsDirty(true);
  }, []);

  const setBio = useCallback((value: string) => {
    setBioState(value);
    setIsDirty(true);
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) return;

    setProfileImage(result.assets[0].uri);
    setIsDirty(true);
  }, []);

  const saveNickname = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
      };
    }

    if (!isValidNickname(nickname)) {
      return {
        success: false,
        error: {
          code: 'validation/invalid-nickname',
          message: '닉네임은 2~20자, 한글·영문·숫자·밑줄만 사용 가능합니다.',
        },
      };
    }

    if (nickname === user.nickname) {
      return { success: true, data: undefined };
    }

    setIsSubmitting(true);
    const result = await usersService.updateNickname(user.id, user.nickname, nickname);
    if (result.success) {
      setUser({ ...user, nickname });
    }
    setIsSubmitting(false);
    return result;
  }, [user, nickname, setUser]);

  const saveBio = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
      };
    }

    if (!isValidBio(bio)) {
      return {
        success: false,
        error: {
          code: 'validation/bio-too-long',
          message: '소개는 150자 이하로 입력해주세요.',
        },
      };
    }

    if (bio === user.bio) {
      return { success: true, data: undefined };
    }

    setIsSubmitting(true);
    const result = await usersService.updateBio(user.id, bio);
    if (result.success) {
      setUser({ ...user, bio });
    }
    setIsSubmitting(false);
    return result;
  }, [user, bio, setUser]);

  const saveProfileImage = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
      };
    }

    if (!profileImage || profileImage === user.profileImageUrl) {
      return { success: true, data: undefined };
    }

    setIsSubmitting(true);
    const resized = await resizeImage(profileImage);
    const result = await usersService.updateProfileImage(user.id, resized);
    if (result.success) {
      setUser({ ...user, profileImageUrl: result.data });
      setProfileImage(result.data);
    }
    setIsSubmitting(false);

    if (!result.success) return result;
    return { success: true, data: undefined };
  }, [user, profileImage, setUser]);

  const saveAll = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
      };
    }

    setIsSubmitting(true);

    if (nickname !== user.nickname) {
      if (!isValidNickname(nickname)) {
        setIsSubmitting(false);
        return {
          success: false,
          error: {
            code: 'validation/invalid-nickname',
            message: '닉네임은 2~20자, 한글·영문·숫자·밑줄만 사용 가능합니다.',
          },
        };
      }
      const result = await usersService.updateNickname(user.id, user.nickname, nickname);
      if (!result.success) {
        setIsSubmitting(false);
        return result;
      }
    }

    if (bio !== user.bio) {
      if (!isValidBio(bio)) {
        setIsSubmitting(false);
        return {
          success: false,
          error: {
            code: 'validation/bio-too-long',
            message: '소개는 150자 이하로 입력해주세요.',
          },
        };
      }
      const result = await usersService.updateBio(user.id, bio);
      if (!result.success) {
        setIsSubmitting(false);
        return result;
      }
    }

    let newProfileImageUrl = user.profileImageUrl;
    if (profileImage && profileImage !== user.profileImageUrl) {
      const resized = await resizeImage(profileImage);
      const result = await usersService.updateProfileImage(user.id, resized);
      if (!result.success) {
        setIsSubmitting(false);
        return result;
      }
      newProfileImageUrl = result.data;
      setProfileImage(result.data);
    }

    setUser({ ...user, nickname, bio, profileImageUrl: newProfileImageUrl });
    setIsDirty(false);
    setIsSubmitting(false);
    return { success: true, data: undefined };
  }, [user, nickname, bio, profileImage, setUser]);

  return {
    nickname,
    setNickname,
    bio,
    setBio,
    profileImage,
    isSubmitting,
    isDirty,
    loadProfile,
    pickImage,
    saveNickname,
    saveBio,
    saveProfileImage,
    saveAll,
  };
}
