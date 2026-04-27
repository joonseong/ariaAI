import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  patchUser: (patch: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  patchUser: (patch) => set((state) => ({
    user: state.user ? { ...state.user, ...patch } : null,
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  clear: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
