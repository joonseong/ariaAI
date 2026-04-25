import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingStoreState {
  isCompleted: boolean | null;
  setIsCompleted: (value: boolean | null) => void;
}

const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  isCompleted: null,
  setIsCompleted: (value) => set({ isCompleted: value }),
}));

export function useOnboarding() {
  const { isCompleted, setIsCompleted } = useOnboardingStore();
  const [step, setStep] = useState(0);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const checkCompleted = useCallback(async (): Promise<void> => {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    setIsCompleted(value === 'true');
  }, [setIsCompleted]);

  const complete = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setIsCompleted(true);
  }, [setIsCompleted]);

  const skip = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setIsCompleted(true);
  }, [setIsCompleted]);

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  return {
    isCompleted,
    step,
    selectedTools,
    setSelectedTools,
    checkCompleted,
    complete,
    skip,
    nextStep,
  };
}
