import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseClass = 'items-center justify-center flex-row';
  const widthClass = fullWidth ? 'w-full' : '';

  let variantClass: string;
  let textClass: string;

  switch (variant) {
    case 'secondary':
      variantClass = 'h-10 rounded-lg border border-border px-4';
      textClass = 'text-sm font-medium text-text-primary';
      break;
    case 'icon':
      variantClass = 'h-10 w-10 rounded-full bg-elevated';
      textClass = 'text-sm text-text-primary';
      break;
    default:
      variantClass = 'h-12 rounded-xl bg-accent-primary px-6';
      textClass = 'text-sm font-semibold text-text-primary';
      break;
  }

  const opacityClass = isDisabled ? 'opacity-50' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseClass} ${variantClass} ${widthClass} ${opacityClass}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#F5F5F5" />
      ) : (
        <Text className={textClass}>{title}</Text>
      )}
    </Pressable>
  );
}
