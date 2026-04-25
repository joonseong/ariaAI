import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as usersService from '@/services/users';
import * as authService from '@/services/auth';
import { Result } from '@/types/common';

export function useAccountDelete() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
      };
    }

    setIsDeleting(true);

    const dataResult = await usersService.deleteAccount(user.id);
    if (!dataResult.success) {
      setIsDeleting(false);
      return dataResult;
    }

    const authResult = await authService.deleteCurrentUser();
    if (!authResult.success) {
      setIsDeleting(false);
      return authResult;
    }

    clear();
    setIsDeleting(false);
    return { success: true, data: undefined };
  }, [user, clear]);

  return { isDeleting, deleteAccount };
}
