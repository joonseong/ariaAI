import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 20 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
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
        name="upload/index"
        options={{
          title: '등록',
          tabBarIcon: ({ color }) => <TabIcon label="＋" color={color} />,
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
  );
}
