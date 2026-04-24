import React from 'react';
import { Pressable, Text } from 'react-native';

interface TagChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export function TagChip({
  label,
  onPress,
  selected = false,
  removable = false,
  onRemove,
}: TagChipProps) {
  const bgClass = selected ? 'bg-accent-primary' : 'bg-elevated';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !removable}
      className={`flex-row items-center rounded-2xl px-3 py-1.5 ${bgClass}`}
      accessibilityRole="button"
    >
      <Text className="text-xs text-text-primary">{label}</Text>
      {removable && onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="ml-1.5"
          accessibilityLabel={`${label} 삭제`}
        >
          <Text className="text-xs text-text-tertiary">X</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
