import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'default' | 'error' | 'success';
}

interface ToastState {
  toast: Toast | null;
  setToast: (toast: Toast | null) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  setToast: (toast) => set({ toast }),
}));

let counter = 0;

export function showToast(
  message: string,
  type: Toast['type'] = 'default',
): void {
  counter += 1;
  useToastStore.getState().setToast({
    id: `toast-${counter}-${Date.now()}`,
    message,
    type,
  });
}

export function hideToast(): void {
  useToastStore.getState().setToast(null);
}
