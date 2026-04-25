import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { isCompleted: onboardingCompleted, checkCompleted } = useOnboarding();

  useEffect(() => {
    if (isAuthenticated) {
      checkCompleted();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (onboardingCompleted === false) {
      router.replace('/onboarding');
    } else if (onboardingCompleted === true) {
      router.replace('/(tabs)/home');
    }
  }, [isLoading, isAuthenticated, onboardingCompleted]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0D0D' }}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}
