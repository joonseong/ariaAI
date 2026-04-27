import React, { useEffect, useRef } from 'react';
import { Pressable, Text, Animated } from 'react-native';
import { haptics } from '@/lib/haptics';
import { formatCount } from '@/lib/formatters';
import IconHeart from '@/assets/icons/icon.heart.svg';

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

  const iconSize = size === 'large' ? 28 : 18;
  const countSize = size === 'large' ? 'text-sm' : 'text-xs';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      className="flex-row items-center"
      accessibilityRole="button"
      accessibilityLabel={active ? '좋아요 취소' : '좋아요'}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <IconHeart
          width={iconSize}
          height={iconSize}
          fill={active ? '#F53356' : 'none'}
          color={active ? '#F53356' : '#808080'}
        />
      </Animated.View>
      {count > 0 && (
        <Text className={`ml-1 ${countSize} text-text-secondary`}>
          {formatCount(count)}
        </Text>
      )}
    </Pressable>
  );
}
