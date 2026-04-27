import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import IconBack from '@/assets/icons/icon.back.svg';
import { usePoints } from '@/hooks/usePoints';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/stores/toastStore';
import { PointPackage } from '@/types/points';
import { purchasePoints } from '@/services/points';

function PackageCard({
  pkg,
  onPress,
}: {
  pkg: PointPackage;
  onPress: () => void;
}) {
  const bonusPercent = pkg.points > pkg.price
    ? Math.round(((pkg.points - pkg.price) / pkg.price) * 100)
    : 0;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center justify-between rounded-xl bg-surface p-4"
      accessibilityRole="button"
      accessibilityLabel={`${pkg.name} 패키지 구매`}
    >
      <View>
        <Text className="text-base font-bold text-text-primary">{pkg.name}</Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-lg font-bold text-accent-primary">{pkg.points.toLocaleString()}P</Text>
          {bonusPercent > 0 && (
            <View className="rounded-full bg-accent-primary px-2 py-0.5">
              <Text className="text-xs font-semibold text-white">+{bonusPercent}% 보너스</Text>
            </View>
          )}
        </View>
      </View>
      <Text className="text-base font-semibold text-text-primary">{pkg.price.toLocaleString()}원</Text>
    </Pressable>
  );
}

export default function PointsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const { balance, creatorBalance, packages, isLoadingPackages, refreshBalance, loadPackages } = usePoints();

  useEffect(() => {
    loadPackages();
    refreshBalance();
  }, [loadPackages, refreshBalance]);

  const handlePurchase = useCallback((pkg: PointPackage) => {
    if (!user) return;

    Alert.alert(
      '포인트 충전',
      `${pkg.points.toLocaleString()}P를 ${pkg.price.toLocaleString()}원에 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '결제하기',
          onPress: async () => {
            // TODO: 실제 IAP 연동 시 플랫폼 결제 모듈 호출 후 iapTransactionId 획득
            Alert.alert(
              '결제 준비 중',
              '인앱 결제(IAP) 연동이 준비되면 이 버튼으로 실제 결제가 진행됩니다.\n\n현재는 테스트 모드로 포인트가 즉시 지급됩니다.',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '테스트 충전',
                  onPress: async () => {
                    const iapTxId = `test_${Date.now()}_${user.id}`;
                    const result = await purchasePoints(
                      user.id,
                      pkg.id,
                      pkg.points,
                      pkg.price,
                      iapTxId,
                    );
                    if (result.success) {
                      // Sync auth store immediately so balance shows everywhere
                      patchUser({ pointBalance: result.data });
                      showToast(`${pkg.points.toLocaleString()}P가 충전되었습니다`, 'success');
                      refreshBalance();
                    } else {
                      showToast(result.error.message, 'error');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [user, patchUser, refreshBalance]);

  const FALLBACK_PACKAGES: PointPackage[] = [
    { id: 'small', name: '소형', points: 100, price: 100, iapProductId: 'com.aria.points.100', isActive: true, order: 1 },
    { id: 'medium', name: '중형', points: 550, price: 500, iapProductId: 'com.aria.points.500', isActive: true, order: 2 },
    { id: 'large', name: '대형', points: 1200, price: 1000, iapProductId: 'com.aria.points.1000', isActive: true, order: 3 },
    { id: 'xlarge', name: '특대형', points: 6500, price: 5000, iapProductId: 'com.aria.points.5000', isActive: true, order: 4 },
  ];

  const displayPackages = packages.length > 0 ? packages : FALLBACK_PACKAGES;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로가기" hitSlop={8}>
          <IconBack width={28} height={28} color="#FFFFFF" />
        </Pressable>
        <Text className="text-base font-semibold text-text-primary">포인트 충전</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* P 잔액 */}
        <View className="mb-3 mt-2 items-center rounded-2xl bg-surface p-6">
          <Text className="text-sm text-text-secondary">보유 P (열람 포인트)</Text>
          <Text className="mt-1 text-4xl font-bold text-accent-primary">
            {balance.toLocaleString()}P
          </Text>
          <Text className="mt-1 text-xs text-text-tertiary">프롬프트 열람 시 100P 차감 · 1P = 1원</Text>
        </View>

        {/* CP 잔액 */}
        {creatorBalance > 0 && (
          <View className="mb-4 items-center rounded-2xl bg-surface p-4">
            <Text className="text-sm text-text-secondary">보유 CP (크리에이터 포인트)</Text>
            <Text className="mt-1 text-2xl font-bold text-text-primary">
              {creatorBalance.toLocaleString()}CP
            </Text>
            <Text className="mt-1 text-xs text-text-tertiary">
              10,000CP 이상 시 네이버페이로 전환 가능
            </Text>
          </View>
        )}

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-text-primary">P 충전 패키지</Text>
        </View>

        {isLoadingPackages ? (
          <ActivityIndicator size="large" color="#F53356" style={{ marginTop: 32 }} />
        ) : (
          displayPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onPress={() => handlePurchase(pkg)} />
          ))
        )}

        <View className="mb-8 mt-6 rounded-xl bg-surface p-4">
          <Text className="mb-2 text-sm font-semibold text-text-primary">포인트 안내</Text>
          <Text className="text-xs leading-5 text-text-secondary">
            • P(포인트): 프롬프트 열람 등에 사용하는 열람 포인트. 현금으로 구매.{'\n'}
            • CP(크리에이터 포인트): 내 프롬프트를 다른 유저가 열람할 때 지급되는 수익 포인트.{'\n'}
            • 1P = 1원이며, 프롬프트 열람 시 100P가 차감됩니다.{'\n'}
            • 프롬프트 열람 100P 중 70CP가 작가님께 지급됩니다.{'\n'}
            • CP는 10,000CP 이상 시 네이버페이로 전환 가능합니다.{'\n'}
            • 구매한 P는 환불되지 않습니다.{'\n'}
            • 미사용 P는 회원 탈퇴 시 소멸됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
