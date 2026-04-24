import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';
import { Result } from '@/types/common';
import { SignUpInput } from '@/types/user';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, clear } =
    useAuthStore();

  const signUp = useCallback(
    async (input: SignUpInput): Promise<Result<void>> => {
      const result = await authService.signUpWithEmail(input);
      if (result.success) {
        setUser(result.data);
        return { success: true, data: undefined };
      }
      return result;
    },
    [setUser],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<Result<void>> => {
      const result = await authService.signInWithEmail(email, password);
      if (result.success) {
        setUser(result.data);
        return { success: true, data: undefined };
      }
      return result;
    },
    [setUser],
  );

  const logout = useCallback(async (): Promise<void> => {
    await authService.signOut();
    clear();
  }, [clear]);

  const resetPassword = useCallback(
    async (email: string): Promise<Result<void>> => {
      return authService.sendPasswordReset(email);
    },
    [],
  );

  const deleteAccount = useCallback(async (): Promise<Result<void>> => {
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/no-user', message: '로그인이 필요합니다.' },
      };
    }
    const result = await authService.deleteAccount(user.id);
    if (result.success) {
      await authService.signOut();
      clear();
    }
    return result;
  }, [user, clear]);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState(async (uid) => {
      if (uid) {
        const result = await authService.getCurrentUser(uid);
        if (result.success && !result.data.isDeleted) {
          setUser(result.data);
        } else {
          await authService.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    logout,
    resetPassword,
    deleteAccount,
  };
}
