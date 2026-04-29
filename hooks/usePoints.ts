import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getPointBalance, getPointPackages } from '@/services/points';
import { PointPackage } from '@/types/points';

export function usePoints() {
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const userId = user?.id;

  const [balance, setBalance] = useState(user?.pointBalance ?? 0);
  const [creatorBalance, setCreatorBalance] = useState(user?.creatorPointBalance ?? 0);
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  // Depend only on userId (string) — not the full user object.
  // This prevents an infinite loop: patchUser → new user ref → refreshBalance recreated → effect fires again.
  const refreshBalance = useCallback(async () => {
    if (!userId) return;
    const result = await getPointBalance(userId);
    if (result.success) {
      setBalance(result.data.pointBalance);
      setCreatorBalance(result.data.creatorPointBalance);
      // Sync auth store so balance shows correctly in other screens
      patchUser({
        pointBalance: result.data.pointBalance,
        creatorPointBalance: result.data.creatorPointBalance,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // patchUser is a stable Zustand action — omitting it is safe

  const loadPackages = useCallback(async () => {
    setIsLoadingPackages(true);
    const result = await getPointPackages();
    if (result.success) {
      setPackages(result.data);
    }
    setIsLoadingPackages(false);
  }, []);

  // Sync local state when auth store user changes (e.g. after login)
  useEffect(() => {
    if (user) {
      setBalance(user.pointBalance ?? 0);
      setCreatorBalance(user.creatorPointBalance ?? 0);
    }
  }, [user?.pointBalance, user?.creatorPointBalance]);

  return {
    balance,
    creatorBalance,
    packages,
    isLoadingPackages,
    refreshBalance,
    loadPackages,
  };
}
