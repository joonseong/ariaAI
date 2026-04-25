import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function OfflineBanner(): React.ReactElement | null {
  const { isConnected } = useNetworkStatus();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected === false) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isConnected === true) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, opacity]);

  if (isConnected !== false) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="absolute top-0 left-0 right-0 z-50 bg-warning px-4 py-2 items-center"
    >
      <Text className="text-white text-sm font-medium">인터넷에 연결되어 있지 않습니다</Text>
    </Animated.View>
  );
}
