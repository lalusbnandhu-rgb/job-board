/**
 * Integration tests — /api/auth
 * Real MongoDB (via MongoMemoryServer), real bcrypt, mocked email utility.
 */

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import { createUser, loginAs } from './helpers/factories';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

const REGISTER_URL = '/api/auth/register';
const LOGIN_URL = '/api/auth/login';
const REFRESH_URL = '/api/auth/refresh';
const LOGOUT_URL = '/api/auth/logout';
const ME_URL = '/api/auth/me';

// ── POST /register ────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('201 — creates a new seeker account', async () => {
    const res = await request(app).post(REGISTER_URL).send({
      email: 'new@example.com',
      password: 'Password1!',
      role: 'seeker',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('201 — creates a new employer account', async () => {
    const res = await request(app).post(REGISTER_URL).send({
      email: 'employer@example.com',
      password: 'Password1!',
      role: 'employer',
    });
    expect(res.status).toBe(201);
  });

  it('409 — duplicate email returns conflict', async () => {
    await createUser('dup@example.com', 'Password1!', 'seeker');
    const res = await request(app).post(REGISTER_URL).send({
      email: 'dup@example.com',
      password: 'Password1!',
      role: 'seeker',
    });
    expect(res.status).toBe(409);
  });

  it('400 — missing password', async () => {
    const res = await request(app).post(REGISTER_URL).send({
      email: 'bad@example.com',
      role: 'seeker',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('400 — invalid role', async () => {
    const res = await request(app).post(REGISTER_URL).send({
      email: 'bad@example.com',
      password: 'Password1!',
      role: 'superadmin',
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /login ───────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => createUser('alice@example.com', 'Password1!', 'seeker'));

  it('200 — returns accessToken, refreshToken, and user', async () => {
    const res = await request(app).post(LOGIN_URL).send({
      email: 'alice@example.com',
      password: 'Password1!',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).toMatchObject({ email: 'alice@example.com', role: 'seeker' });
  });

  it('401 — wrong password', async () => {
    const res = await request(app).post(LOGIN_URL).send({
      email: 'alice@example.com',
      password: 'WrongPass1!',
    });
    expect(res.status).toBe(401);
  });

  it('401 — unknown email', async () => {
    const res = await request(app).post(LOGIN_URL).send({
      email: 'ghost@example.com',
      password: 'Password1!',
    });
    expect(res.status).toBe(401);
  });

  it('400 — missing fields', async () => {
    const res = await request(app).post(LOGIN_URL).send({ email: 'alice@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ── POST /refresh ─────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('200 — returns new token pair', async () => {
    await createUser('bob@example.com', 'Password1!', 'seeker');
    const { refreshToken } = await loginAs('bob@example.com', 'Password1!');

    const res = await request(app).post(REFRESH_URL).send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('401 — invalid refresh token', async () => {
    const res = await request(app).post(REFRESH_URL).send({ refreshToken: 'not-a-token' });
    expect(res.status).toBe(401);
  });
});

// ── GET /me ───────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('200 — returns authenticated user', async () => {
    await createUser('me@example.com', 'Password1!', 'employer');
    const { accessToken } = await loginAs('me@example.com', 'Password1!');

    const res = await request(app)
      .get(ME_URL)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'me@example.com', role: 'employer' });
  });

  it('401 — no token', async () => {
    const res = await request(app).get(ME_URL);
    expect(res.status).toBe(401);
  });

  it('401 — malformed token', async () => {
    const res = await request(app)
      .get(ME_URL)
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });
});

// ── POST /logout ──────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('200 — invalidates refresh token', async () => {
    await createUser('logout@example.com', 'Password1!', 'seeker');
    const { accessToken, refreshToken } = await loginAs('logout@example.com', 'Password1!');

    const res = await request(app)
      .post(LOGOUT_URL)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).post(LOGOUT_URL).send({ refreshToken: 'some-token' });
    expect(res.status).toBe(401);
  });
});

// ── POST /forgot-password ─────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('200 — always returns 200 (prevents email enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' });
    expect(res.status).toBe(200);
  });
});
