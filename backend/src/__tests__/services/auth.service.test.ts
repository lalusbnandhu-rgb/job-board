/**
 * Unit tests for auth.service.ts
 * Mongoose models and email utility are mocked so no real DB is needed.
 */

// ── Set required env vars BEFORE any module imports ───────────────────────────
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32chars!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.CLIENT_URL = 'http://localhost:3000';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../../models/user.model');
jest.mock('../../utils/email');

import bcrypt from 'bcryptjs';
import { User } from '../../models/user.model';
import * as email from '../../utils/email';
import * as authService from '../../services/auth.service';

const MockUser = User as jest.Mocked<typeof User>;

// Helper to build a minimal fake user document
const fakeUser = (overrides = {}) => ({
  _id: { toString: () => 'user-id-123' },
  email: 'test@example.com',
  passwordHash: bcrypt.hashSync('Password1', 1),
  role: 'seeker',
  isEmailVerified: true,
  isActive: true,
  refreshTokens: [],
  failedLoginAttempts: 0,
  lockUntil: null,
  save: jest.fn().mockResolvedValue(undefined),
  deleteOne: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Default: findByIdAndUpdate always resolves
beforeEach(() => {
  (MockUser.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

// ── register ──────────────────────────────────────────────────────────────────

describe('authService.register', () => {
  beforeEach(() => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(null);
    (MockUser.create as jest.Mock).mockResolvedValue(fakeUser());
    (email.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
  });

  it('creates a user and sends a verification email', async () => {
    const result = await authService.register({
      email: 'new@example.com',
      password: 'Password1',
      role: 'seeker',
    });

    expect(MockUser.create).toHaveBeenCalledTimes(1);
    expect(email.sendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      expect.any(String),
    );
    expect(result.message).toMatch(/check your email/i);
  });

  it('throws 409 if email is already registered', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(fakeUser());

    await expect(
      authService.register({ email: 'test@example.com', password: 'Password1', role: 'seeker' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  const mockFindOneSelect = (user: ReturnType<typeof fakeUser> | null) =>
    (MockUser.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

  it('throws 401 for unknown email', async () => {
    mockFindOneSelect(null);

    await expect(
      authService.login({ email: 'ghost@example.com', password: 'Password1' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 for wrong password and increments failedLoginAttempts', async () => {
    const user = fakeUser({ passwordHash: bcrypt.hashSync('CorrectPass1', 1) });
    mockFindOneSelect(user);

    await expect(
      authService.login({ email: 'test@example.com', password: 'WrongPass1' }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      user._id,
      expect.objectContaining({ failedLoginAttempts: 1 }),
    );
  });

  it('locks account after 10 consecutive failed attempts', async () => {
    const user = fakeUser({
      passwordHash: bcrypt.hashSync('CorrectPass1', 1),
      failedLoginAttempts: 9, // one more wrong attempt will trigger lockout
    });
    mockFindOneSelect(user);

    await expect(
      authService.login({ email: 'test@example.com', password: 'WrongPass1' }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      user._id,
      expect.objectContaining({
        failedLoginAttempts: 10,
        lockUntil: expect.any(Date),
      }),
    );
  });

  it('throws 429 when account is currently locked', async () => {
    const user = fakeUser({
      lockUntil: new Date(Date.now() + 20 * 60 * 1000), // locked for 20 more minutes
    });
    mockFindOneSelect(user);

    await expect(
      authService.login({ email: 'test@example.com', password: 'Password1' }),
    ).rejects.toMatchObject({ statusCode: 429, message: expect.stringMatching(/locked/i) });
  });

  it('resets expired lockout and allows login attempt', async () => {
    const user = fakeUser({
      lockUntil: new Date(Date.now() - 1000), // lockout already expired
      failedLoginAttempts: 10,
    });
    mockFindOneSelect(user);

    // After expired lockout reset, wrong password should now throw 401 (not 429)
    const wrongUser = fakeUser({
      lockUntil: new Date(Date.now() - 1000),
      failedLoginAttempts: 10,
      passwordHash: bcrypt.hashSync('CorrectPass1', 1),
    });
    mockFindOneSelect(wrongUser);

    await expect(
      authService.login({ email: 'test@example.com', password: 'WrongPass1' }),
    ).rejects.toMatchObject({ statusCode: 401 });

    // Should have reset the lockout first
    expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      wrongUser._id,
      { failedLoginAttempts: 0, lockUntil: null },
    );
  });

  it('throws 403 if email is not verified', async () => {
    const user = fakeUser({ isEmailVerified: false });
    mockFindOneSelect(user);

    await expect(
      authService.login({ email: 'test@example.com', password: 'Password1' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws 403 if account is disabled', async () => {
    const user = fakeUser({ isActive: false });
    mockFindOneSelect(user);

    await expect(
      authService.login({ email: 'test@example.com', password: 'Password1' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns tokens and user on successful login and clears lockout state', async () => {
    const user = fakeUser();
    mockFindOneSelect(user);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('test@example.com');

    // Should clear lockout on success
    expect(MockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      user._id,
      { failedLoginAttempts: 0, lockUntil: null },
    );
  });
});

// ── forgotPassword ────────────────────────────────────────────────────────────

describe('authService.forgotPassword', () => {
  it('returns success message even when email does not exist (prevents enumeration)', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(null);

    const result = await authService.forgotPassword('unknown@example.com');
    expect(result.message).toBeDefined();
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends a reset email when user exists', async () => {
    const user = fakeUser();
    (MockUser.findOne as jest.Mock).mockResolvedValue(user);
    (email.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    await authService.forgotPassword('test@example.com');
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
    );
  });
});
