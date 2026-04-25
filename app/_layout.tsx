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
        <Stack.Screen name="artwork" />
        <Stack.Screen name="artist" />
        <Stack.Screen name="profile" />
      </Stack>
      <ToastContainer />
      <OfflineBanner />
      <StatusBar style="light" />
    </>
  );
}
