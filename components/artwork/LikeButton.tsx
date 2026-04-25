import React, { useEffect, useRef } from 'react';
import { Pressable, Text, Animated } from 'react-native';
import { haptics } from '@/lib/haptics';
import { formatCount } from '@/lib/formatters';

interface LikeButtonProps {
  active: boolean;
  count: number;
  onPress: () => void;
  size?: 'small' | 'large';
}

export function LikeButton({
  active,
  count,
  onPress,
  size = 'small',
}: LikeButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevActive = useRef(active);

  useEffect(() => {
    if (active && !prevActive.current) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevActive.current = active;
  }, [active, scale]);

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const iconSize = size === 'large' ? 'text-2xl' : 'text-base';
  const countSize = size === 'large' ? 'text-sm' : 'text-xs';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      className="flex-row items-center"
      accessibilityRole="button"
      accessibilityLabel={active ? '좋아요 취소' : '좋아요'}
    >
      <Animated.Text
        className={`${iconSize} ${active ? 'text-accent-heart' : 'text-text-tertiary'}`}
        style={{ transform: [{ scale }] }}
      >
        {active ? '\u2665' : '\u2661'}
      </Animated.Text>
      {count > 0 && (
        <Text className={`ml-1 ${countSize} text-text-secondary`}>
          {formatCount(count)}
        </Text>
      )}
    </Pressable>
  );
}
