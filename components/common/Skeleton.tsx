import React, { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
}

export function Skeleton({ width, height, borderRadius = 8 }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const style: ViewStyle = {
    width: width as number,
    height: height as number,
    borderRadius,
    backgroundColor: '#262626',
  };

  return <Animated.View style={[style, { opacity }]} />;
}
