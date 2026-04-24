import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-elevated">
        <Text className="text-2xl text-text-tertiary">0</Text>
      </View>
      <Text className="mb-6 text-center text-base text-text-secondary">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
