import React from 'react';
import { View, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import IconPicture from '@/assets/icons/icon.picture.svg';
import IconSearch from '@/assets/icons/icon.search.svg';
import IconProfile from '@/assets/icons/icon.profile.svg';
import IconPlus from '@/assets/icons/icon.plus.svg';

function TabIcon({ Icon, color }: { Icon: React.FC<{ width: number; height: number; color?: string; fill?: string }>; color: string }) {
  return <Icon width={24} height={24} fill={color} color={color} />;
}

function FAB() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/upload')}
      className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-accent-primary"
      style={[{ bottom: 108 }, { elevation: 6, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }]}
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
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#808080',
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <TabIcon Icon={IconPicture} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search/index"
          options={{
            title: '검색',
            tabBarIcon: ({ color }) => <TabIcon Icon={IconSearch} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: '프로필',
            tabBarIcon: ({ color }) => <TabIcon Icon={IconProfile} color={color} />,
          }}
        />
      </Tabs>
      <FAB />
    </View>
  );
}
