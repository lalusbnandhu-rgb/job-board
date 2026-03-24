/**
 * Integration tests — /api/admin
 */

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import {
  createUser,
  loginAs,
  createEmployerWithCompany,
  createSeekerWithProfile,
  createJob,
} from './helpers/factories';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

async function createAdmin() {
  await createUser('admin@test.com', 'Password1!', 'admin');
  return loginAs('admin@test.com', 'Password1!');
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('200 — returns platform stats', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('403 — employer cannot access admin routes', async () => {
    const emp = await createEmployerWithCompany();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('403 — seeker cannot access admin routes', async () => {
    const seeker = await createSeekerWithProfile();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(403);
  });
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('200 — returns paginated user list', async () => {
    const admin = await createAdmin();
    await createSeekerWithProfile();

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('200 — filters by role', async () => {
    const admin = await createAdmin();
    await createSeekerWithProfile('seeker1@test.com');
    await createEmployerWithCompany('emp1@test.com');

    const res = await request(app)
      .get('/api/admin/users?role=seeker')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(
      (res.body.users as Array<{ role: string }>).every((u) => u.role === 'seeker'),
    ).toBe(true);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/users/:id/ban ────────────────────────────────────────────

describe('PATCH /api/admin/users/:id/ban and /unban', () => {
  it('200 — admin bans a user', async () => {
    const admin = await createAdmin();
    const { userId } = await createSeekerWithProfile();

    const res = await request(app)
      .patch(`/api/admin/users/${userId}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('200 — admin unbans a user', async () => {
    const admin = await createAdmin();
    const { userId } = await createSeekerWithProfile();

    // Ban first
    await request(app)
      .patch(`/api/admin/users/${userId}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    // Now unban
    const res = await request(app)
      .patch(`/api/admin/users/${userId}/unban`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('404 — unknown user id', async () => {
    const admin = await createAdmin();
    const fakeId = '6507f1f77bcf86cd799439aa';
    const res = await request(app)
      .patch(`/api/admin/users/${fakeId}/ban`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(404);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).patch('/api/admin/users/some-id/ban');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/jobs ───────────────────────────────────────────────────────

describe('GET /api/admin/jobs', () => {
  it('200 — returns all jobs', async () => {
    const admin = await createAdmin();
    const emp = await createEmployerWithCompany();
    await createJob(emp.accessToken);

    const res = await request(app)
      .get('/api/admin/jobs')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobs');
    expect(res.body.jobs.length).toBeGreaterThanOrEqual(1);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/admin/jobs');
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/jobs/:id ────────────────────────────────────────────────

describe('DELETE /api/admin/jobs/:id', () => {
  it('204 — admin deletes any job', async () => {
    const admin = await createAdmin();
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);

    const res = await request(app)
      .delete(`/api/admin/jobs/${jobId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(204);
  });

  it('404 — unknown job id', async () => {
    const admin = await createAdmin();
    const fakeId = '6507f1f77bcf86cd799439bb';
    const res = await request(app)
      .delete(`/api/admin/jobs/${fakeId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(404);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).delete('/api/admin/jobs/some-id');
    expect(res.status).toBe(401);
  });

  it('403 — employer cannot use admin delete', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);

    const res = await request(app)
      .delete(`/api/admin/jobs/${jobId}`)
      .set('Authorization', `Bearer ${emp.accessToken}`);
    // Employer can delete their own jobs via /api/jobs/:id but not via /api/admin/jobs/:id
    expect(res.status).toBe(403);
  });
});
