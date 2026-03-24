// ── User ──────────────────────────────────────────────────────────────────────

export type UserRole = 'seeker' | 'employer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

// ── Auth API responses ────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<AuthUser, 'id' | 'email' | 'role'>;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

// ── API error shape ───────────────────────────────────────────────────────────

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}
