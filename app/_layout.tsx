import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ToastContainer } from '@/components/common/Toast';
import OfflineBanner from '@/components/common/OfflineBanner';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isCompleted: onboardingCompleted, checkCompleted } = useOnboarding();

  useEffect(() => {
    if (isAuthenticated) {
      checkCompleted();
    }
  }, [isAuthenticated, checkCompleted]);

  const showLoading = isLoading || (isAuthenticated && onboardingCompleted === null);

  if (showLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          onboardingCompleted ? (
            <Stack.Screen name="(tabs)" />
          ) : (
            <Stack.Screen name="onboarding" />
          )
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="artwork" />
      </Stack>
      <ToastContainer />
      <OfflineBanner />
      <StatusBar style="light" />
    </>
  );
}
