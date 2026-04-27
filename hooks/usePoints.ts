import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getPointBalance, getPointPackages } from '@/services/points';
import { PointPackage } from '@/types/points';

export function usePoints() {
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const [balance, setBalance] = useState(user?.pointBalance ?? 0);
  const [creatorBalance, setCreatorBalance] = useState(user?.creatorPointBalance ?? 0);
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    const result = await getPointBalance(user.id);
    if (result.success) {
      setBalance(result.data.pointBalance);
      setCreatorBalance(result.data.creatorPointBalance);
      patchUser({
        pointBalance: result.data.pointBalance,
        creatorPointBalance: result.data.creatorPointBalance,
      });
    }
  }, [user, patchUser]);

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
      setCreatorBalance(user.creatorPointBalance ?? 0);
    }
  }, [user]);

  return {
    balance,
    creatorBalance,
    packages,
    isLoadingPackages,
    refreshBalance,
    loadPackages,
  };
}
