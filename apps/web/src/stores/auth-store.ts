import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../lib/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthModalOpen: false,
      authModalTab: 'login',

      setAuth: (user, token) => set({ user, token, isAuthModalOpen: false }),
      logout: () => set({ user: null, token: null }),
      openAuthModal: (tab = 'login') => set({ isAuthModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
    }),
    {
      name: 'neut_customer_auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
