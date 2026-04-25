import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 20 }}>{label}</Text>;
}

function FAB() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/upload')}
      className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-accent-primary"
      style={{ elevation: 6, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }}
      accessibilityLabel="작품 등록"
      accessibilityRole="button"
    >
      <Text className="text-2xl font-bold text-white">+</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#262626',
            borderTopColor: '#2A2A2A',
          },
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#808080',
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <TabIcon label="⌂" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search/index"
          options={{
            title: '검색',
            tabBarIcon: ({ color }) => <TabIcon label="⌕" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: '프로필',
            tabBarIcon: ({ color }) => <TabIcon label="⊙" color={color} />,
          }}
        />
      </Tabs>
      <FAB />
    </View>
  );
}
