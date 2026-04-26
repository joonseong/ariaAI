import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getPointBalance, getPointPackages } from '@/services/points';
import { PointPackage } from '@/types/points';

export function usePoints() {
  const user = useAuthStore((state) => state.user);
  const [balance, setBalance] = useState(user?.pointBalance ?? 0);
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    const result = await getPointBalance(user.id);
    if (result.success) {
      setBalance(result.data);
    }
  }, [user]);

  const loadPackages = useCallback(async () => {
    setIsLoadingPackages(true);
    const result = await getPointPackages();
    if (result.success) {
      setPackages(result.data);
    }
    setIsLoadingPackages(false);
  }, []);

  useEffect(() => {
    if (user) {
      setBalance(user.pointBalance ?? 0);
    }
  }, [user]);

  return {
    balance,
    packages,
    isLoadingPackages,
    refreshBalance,
    loadPackages,
  };
}
