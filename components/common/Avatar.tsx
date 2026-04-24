import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri: string | null;
  size?: number;
  fallbackText?: string;
}

export function Avatar({ uri, size = 40, fallbackText }: AvatarProps) {
  const initial = fallbackText ? fallbackText.charAt(0).toUpperCase() : '?';
  const fontSize = Math.round(size * 0.4);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={fallbackText ?? 'avatar'}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-elevated"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text
        className="font-medium text-text-secondary"
        style={{ fontSize }}
      >
        {initial}
      </Text>
    </View>
  );
}
