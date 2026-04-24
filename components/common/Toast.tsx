import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useToastStore, hideToast } from '@/stores/toastStore';

const TOAST_DURATION = 3000;
const ANIMATION_DURATION = 200;

function getBackgroundClass(type: 'default' | 'error' | 'success'): string {
  switch (type) {
    case 'error':
      return 'bg-semantic-error';
    case 'success':
      return 'bg-semantic-success';
    default:
      return 'bg-surface';
  }
}

export function ToastContainer() {
  const toast = useToastStore((state) => state.toast);
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  }, [translateY, opacity]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (toast) {
      translateY.setValue(100);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(dismiss, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast?.id, dismiss, translateY, opacity]);

  if (!toast) return null;

  const bgClass = getBackgroundClass(toast.type);

  return (
    <Animated.View
      className={`absolute bottom-24 left-4 right-4 z-50 rounded-xl px-4 py-3 ${bgClass}`}
      style={{ transform: [{ translateY }], opacity }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-sm text-text-primary">{toast.message}</Text>
        <Pressable
          onPress={dismiss}
          hitSlop={8}
          className="ml-3"
          accessibilityLabel="Close toast"
          accessibilityRole="button"
        >
          <Text className="text-sm font-semibold text-text-secondary">X</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
