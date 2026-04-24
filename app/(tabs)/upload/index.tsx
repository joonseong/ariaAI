import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UploadScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg text-text-secondary">
          작품 등록 (구현 예정)
        </Text>
      </View>
    </SafeAreaView>
  );
}
