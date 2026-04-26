import React from 'react';
import { View, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import IconPlus from '@/assets/icons/icon.plus.svg';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.5" />
      <Path d="M3 16l5-5 4 4 3-3 6 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8" cy="9" r="1.5" fill={color} />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function FAB() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/upload')}
      className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-accent-primary"
      style={[{ bottom: 108 }, { elevation: 6, shadowColor: '#F53356', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }]}
      accessibilityLabel="작품 등록"
      accessibilityRole="button"
    >
      <IconPlus width={28} height={28} fill="#FFFFFF" color="#FFFFFF" />
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
          tabBarActiveTintColor: '#F53356',
          tabBarInactiveTintColor: '#808080',
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="search/index"
          options={{
            title: '검색',
            tabBarIcon: ({ color }) => <SearchIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: '프로필',
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          }}
        />
      </Tabs>
      <FAB />
    </View>
  );
}
