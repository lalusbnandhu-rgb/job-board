import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  /** Access token lives in memory only — NOT persisted to localStorage */
  accessToken: string | null;
  /** True once Zustand has rehydrated from localStorage */
  isHydrated: boolean;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),

      setAuth: (user, accessToken) => set({ user, accessToken }),

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionExpiry');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('sessionExpiry');
        }
        set({ user: null, accessToken: null });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-user',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user object — never persist the access token
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
