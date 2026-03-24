'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import type { RefreshResponse } from '@/types';

/**
 * Runs once on app mount. If the user is persisted in Zustand but the
 * access token is missing (cleared on page refresh), silently reissues
 * it via the refresh endpoint so protected pages work correctly.
 */
export function useAuthInit() {
  const { user, accessToken, setAccessToken, clearAuth } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    // Not logged in — nothing to do
    if (!user) return;
    // Token still in memory — already fine
    if (accessToken) return;

    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!refreshToken) {
      clearAuth();
      return;
    }

    const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

    axios
      .post<RefreshResponse>(`${BASE}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      })
      .catch(() => clearAuth());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
