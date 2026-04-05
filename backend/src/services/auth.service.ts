import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/user.model';
import { ApiError } from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/token';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/email';
import { env } from '../config/env';

const MAX_REFRESH_TOKENS = 20;  // max active sessions per user (raised for E2E parallel test suites)
const LOCK_THRESHOLD = 10;     // consecutive failures before lockout
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildTokenPair = async (
  userId: string,
  role: UserRole,
): Promise<TokenPair> => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  // Store hashed refresh token in DB (rotate if over limit)
  const hashed = hashToken(refreshToken);
  await User.findByIdAndUpdate(userId, {
    $push: {
      refreshTokens: {
        $each: [hashed],
        $slice: -MAX_REFRESH_TOKENS, // keep only the N most recent
      },
    },
  });

  return { accessToken, refreshToken };
};

// ── Service methods ───────────────────────────────────────────────────────────

export const register = async ({ email, password, role }: RegisterInput) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const { raw, hashed } = generateRandomToken();

  const skipVerification = env.SKIP_EMAIL_VERIFICATION;

  const user = await User.create({
    email,
    passwordHash,
    role,
    isEmailVerified: skipVerification,
    ...(!skipVerification && {
      emailVerificationToken: hashed,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    }),
  });

  if (!skipVerification) {
    await sendVerificationEmail(email, raw);
  }

  return {
    message: skipVerification
      ? 'Registration successful.'
      : 'Registration successful. Please check your email to verify your account.',
    userId: user._id,
  };
};

export const login = async ({ email, password }: LoginInput) => {
  const user = await User.findOne({ email }).select(
    '+passwordHash +failedLoginAttempts +lockUntil',
  );
  if (!user) throw new ApiError(401, 'Invalid email or password');

  // If lockout has naturally expired, reset the counter
  if (user.lockUntil && user.lockUntil <= new Date()) {
    await User.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockUntil: null });
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
  }

  // Reject immediately if still within lockout window
  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60_000);
    throw new ApiError(
      429,
      `Account is temporarily locked. Try again in ${minutes} minute(s).`,
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const update: Record<string, unknown> = { failedLoginAttempts: attempts };
    if (attempts >= LOCK_THRESHOLD) {
      update.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await User.findByIdAndUpdate(user._id, update);
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isEmailVerified)
    throw new ApiError(403, 'Please verify your email before logging in');

  if (!user.isActive) throw new ApiError(403, 'Account has been disabled');

  // Successful login — clear any residual lockout state
  await User.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockUntil: null });

  const tokens = await buildTokenPair(user._id.toString(), user.role);

  return {
    ...tokens,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  };
};

export const refreshTokens = async (token: string): Promise<TokenPair> => {
  let payload: { id: string };
  try {
    payload = verifyRefreshToken(token) as { id: string };
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const hashed = hashToken(token);
  const user = await User.findOne({
    _id: payload.id,
    refreshTokens: hashed,
  }).select('+refreshTokens');

  if (!user) throw new ApiError(401, 'Refresh token not recognised');

  // Rotate — remove old, issue new pair
  await User.findByIdAndUpdate(user._id, {
    $pull: { refreshTokens: hashed },
  });

  return buildTokenPair(user._id.toString(), user.role);
};

export const logout = async (userId: string, token: string) => {
  const hashed = hashToken(token);
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: hashed },
  });
  return { message: 'Logged out successfully' };
};

export const verifyEmail = async (token: string) => {
  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user)
    throw new ApiError(400, 'Verification link is invalid or has expired');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return { message: 'Email verified successfully. You can now log in.' };
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  // Always return success — do not leak whether the email exists
  if (!user)
    return {
      message: 'If that email is registered, a reset link has been sent.',
    };

  const { raw, hashed } = generateRandomToken();
  user.passwordResetToken = hashed;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save();

  await sendPasswordResetEmail(email, raw);

  const response: { message: string; devToken?: string } = {
    message: 'If that email is registered, a reset link has been sent.',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.devToken = raw;
  }

  return response;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashed = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires +refreshTokens');

  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // invalidate all sessions
  await user.save();

  return {
    message: 'Password reset successful. Please log in with your new password.',
  };
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select(
    '_id email role isEmailVerified isActive createdAt',
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};
