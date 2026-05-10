import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ToastContainer } from '@/components/common/Toast';
import OfflineBanner from '@/components/common/OfflineBanner';
import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';
import { initializeKakaoSDK } from '@react-native-kakao/core';

initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY!);

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState(async (uid) => {
      if (uid) {
        const result = await authService.getCurrentUser(uid);
        if (result.success && !result.data.isDeleted) {
          setUser(result.data);
        } else {
          await authService.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="upload" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="artwork/[id]" />
        <Stack.Screen name="artwork/edit" />
        <Stack.Screen name="artist/[id]" />
        <Stack.Screen name="artist/[id]/followers" />
        <Stack.Screen name="artist/[id]/following" />
        <Stack.Screen name="artist/[id]/guestbook" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/followers" />
        <Stack.Screen name="profile/following" />
        <Stack.Screen name="profile/liked" />
        <Stack.Screen name="profile/saved" />
        <Stack.Screen name="profile/points" />
      </Stack>
      <ToastContainer />
      <OfflineBanner />
      <StatusBar style="dark" />
    </>
  );
}
