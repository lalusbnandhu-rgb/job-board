/**
 * Integration tests — /api/jobs
 * Real MongoDB (via MongoMemoryServer), mocked email + cloudinary.
 */

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../utils/cloudinary-upload', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
}));

import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import {
  createUser,
  createEmployerWithCompany,
  createSeekerWithProfile,
  createJob,
  JOB_BODY,
} from './helpers/factories';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

describe('GET /api/jobs', () => {
  it('200 — public, returns jobs list with pagination', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobs');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('200 — filters by search query', async () => {
    const emp = await createEmployerWithCompany();
    await createJob(emp.accessToken, { title: 'Senior TypeScript Engineer' });
    await createJob(emp.accessToken, { title: 'Product Designer' });

    const res = await request(app).get('/api/jobs?search=TypeScript');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.jobs[0].title).toContain('TypeScript');
  });

  it('200 — filters by category', async () => {
    const emp = await createEmployerWithCompany();
    await createJob(emp.accessToken, { category: 'Design' });

    const res = await request(app).get('/api/jobs?category=Design');
    expect(res.status).toBe(200);
    expect(res.body.jobs.every((j: { category: string }) => j.category === 'Design')).toBe(true);
  });

  it('200 — paginates correctly', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  it('400 — invalid query params', async () => {
    const res = await request(app).get('/api/jobs?page=abc');
    expect(res.status).toBe(400);
  });
});

// ── GET /api/jobs/:slug ───────────────────────────────────────────────────────

describe('GET /api/jobs/:slug', () => {
  it('200 — returns job by slug', async () => {
    const emp = await createEmployerWithCompany();
    const { jobSlug } = await createJob(emp.accessToken);

    const res = await request(app).get(`/api/jobs/${jobSlug}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('job');
    expect(res.body.job.slug).toBe(jobSlug);
  });

  it('404 — unknown slug', async () => {
    const res = await request(app).get('/api/jobs/does-not-exist-abc123');
    expect(res.status).toBe(404);
  });
});

// ── POST /api/jobs ────────────────────────────────────────────────────────────

describe('POST /api/jobs', () => {
  it('201 — employer creates a job', async () => {
    const emp = await createEmployerWithCompany();
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send(JOB_BODY);
    expect(res.status).toBe(201);
    expect(res.body.job).toMatchObject({ title: JOB_BODY.title });
    expect(res.body.job).toHaveProperty('slug');
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).post('/api/jobs').send(JOB_BODY);
    expect(res.status).toBe(401);
  });

  it('403 — seeker cannot post jobs', async () => {
    const { accessToken } = await createSeekerWithProfile();
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(JOB_BODY);
    expect(res.status).toBe(403);
  });

  it('400 — missing required fields', async () => {
    const emp = await createEmployerWithCompany();
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send({ title: 'Only a title' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ── PUT /api/jobs/:id ─────────────────────────────────────────────────────────

describe('PUT /api/jobs/:id', () => {
  it('200 — employer updates own job', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);

    const res = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send({ ...JOB_BODY, title: 'Updated Title Here Now' });
    expect(res.status).toBe(200);
    expect(res.body.job.title).toBe('Updated Title Here Now');
  });

  it('403 — employer cannot update another employer\'s job', async () => {
    const emp1 = await createEmployerWithCompany('emp1@test.com');
    const emp2 = await createEmployerWithCompany('emp2@test.com');
    const { jobId } = await createJob(emp1.accessToken);

    const res = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${emp2.accessToken}`)
      .send(JOB_BODY);
    expect(res.status).toBe(403);
  });

  it('401 — unauthenticated', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const res = await request(app).put(`/api/jobs/${jobId}`).send(JOB_BODY);
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/jobs/:id ──────────────────────────────────────────────────────

describe('DELETE /api/jobs/:id', () => {
  it('204 — employer deletes own job', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);

    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(204);
  });

  it('403 — seeker cannot delete jobs', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(403);
  });
});

// ── GET /api/jobs/employer/mine ───────────────────────────────────────────────

describe('GET /api/jobs/employer/mine', () => {
  it('200 — returns employer\'s own jobs only', async () => {
    const emp = await createEmployerWithCompany();
    await createJob(emp.accessToken);
    await createJob(emp.accessToken, { title: 'Second Job Posted By Employer' });

    const res = await request(app)
      .get('/api/jobs/employer/mine')
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(2);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/jobs/employer/mine');
    expect(res.status).toBe(401);
  });

  it('403 — seeker cannot access employer jobs list', async () => {
    const seeker = await createSeekerWithProfile();
    const res = await request(app)
      .get('/api/jobs/employer/mine')
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(403);
  });
});
