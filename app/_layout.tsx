import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ToastContainer } from '@/components/common/Toast';
import OfflineBanner from '@/components/common/OfflineBanner';

export default function RootLayout() {
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
      <StatusBar style="light" />
    </>
  );
}
