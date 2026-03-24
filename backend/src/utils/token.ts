import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  role: string;
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export const generateAccessToken = (id: string, role: string): string =>
  jwt.sign({ id, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

export const generateRefreshToken = (id: string): string =>
  jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

// ── Random tokens (email verification, password reset) ────────────────────────

/** Returns a raw random hex token AND its SHA-256 hash for DB storage */
export const generateRandomToken = (): { raw: string; hashed: string } => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

/** Hash a raw token for comparison against DB-stored hash */
export const hashToken = (raw: string): string =>
  crypto.createHash('sha256').update(raw).digest('hex');
