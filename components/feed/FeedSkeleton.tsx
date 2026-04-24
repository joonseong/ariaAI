import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/common/Skeleton';

function SkeletonCard() {
  return (
    <View className="overflow-hidden rounded-xl bg-surface">
      <Skeleton width="100%" height={250} borderRadius={0} />
      <View className="p-3">
        <Skeleton width="60%" height={18} borderRadius={4} />
        <View className="mt-2 flex-row items-center">
          <Skeleton width={24} height={24} borderRadius={12} />
          <View className="ml-2">
            <Skeleton width={80} height={14} borderRadius={4} />
          </View>
        </View>
        <View className="mt-1">
          <Skeleton width={50} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View className="gap-3 px-4 pt-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}
