import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="mb-2 text-4xl">!</Text>
      <Text className="mb-6 text-center text-base text-text-primary">
        {message}
      </Text>
      {onRetry && (
        <Button title="다시 시도" onPress={onRetry} variant="secondary" />
      )}
    </View>
  );
}
