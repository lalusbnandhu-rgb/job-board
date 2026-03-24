/**
 * Thin fetch wrapper for test setup/teardown against the backend API.
 * Used in auth setups and spec beforeEach hooks to create/reset data.
 */

import fs from 'fs';

const BASE = process.env['API_URL'] ?? 'http://localhost:5000/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json() as Promise<LoginResponse>;
}

export async function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} — ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string, accessToken: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

/**
 * Exchange a refresh token for a new access+refresh pair.
 * Uses /auth/refresh which is NOT rate-limited, unlike /auth/login.
 */
export async function apiRefresh(refreshToken: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  return res.json() as Promise<LoginResponse>;
}

/**
 * Read the current refresh token stored in a Playwright storageState auth file.
 * The token lives in localStorage under the key "refreshToken".
 */
export function readRefreshToken(authFile: string): string {
  const state = JSON.parse(fs.readFileSync(authFile, 'utf-8')) as {
    origins: Array<{
      origin: string;
      localStorage: Array<{ name: string; value: string }>;
    }>;
  };
  const origin = state.origins.find((o) => o.origin.startsWith('http://localhost'));
  if (!origin) throw new Error(`No localhost origin in ${authFile}`);
  const item = origin.localStorage.find((i) => i.name === 'refreshToken');
  if (!item) throw new Error(`No refreshToken key in ${authFile}`);
  return item.value;
}

/**
 * Overwrite the refresh token in a Playwright storageState auth file.
 * Called in afterEach to keep the file current after token rotation.
 */
export function updateRefreshToken(authFile: string, newRefreshToken: string): void {
  const raw = fs.readFileSync(authFile, 'utf-8');
  const state = JSON.parse(raw) as {
    origins: Array<{
      origin: string;
      localStorage: Array<{ name: string; value: string }>;
    }>;
  };
  const origin = state.origins.find((o) => o.origin.startsWith('http://localhost'));
  if (!origin) return;
  const item = origin.localStorage.find((i) => i.name === 'refreshToken');
  if (item) {
    item.value = newRefreshToken;
  } else {
    origin.localStorage.push({ name: 'refreshToken', value: newRefreshToken });
  }
  fs.writeFileSync(authFile, JSON.stringify(state, null, 2));
}
