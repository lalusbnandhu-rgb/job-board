/**
 * Integration tests — /api/employer
 */

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../utils/cloudinary-upload', () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue('https://example.com/logo.jpg'),
}));

import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import {
  createSeekerWithProfile,
  createEmployerWithCompany,
  createJob,
  JOB_BODY,
} from './helpers/factories';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

// ── GET /api/employer/company ─────────────────────────────────────────────────

describe('GET /api/employer/company', () => {
  it('200 — returns employer\'s company', async () => {
    const emp = await createEmployerWithCompany();
    const res = await request(app)
      .get('/api/employer/company')
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('company');
    expect(res.body.company.name).toBe('ACME Corp');
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/employer/company');
    expect(res.status).toBe(401);
  });

  it('403 — seeker cannot access employer company', async () => {
    const seeker = await createSeekerWithProfile();
    const res = await request(app)
      .get('/api/employer/company')
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/employer/company ─────────────────────────────────────────────────

describe('PUT /api/employer/company', () => {
  it('200 — updates company fields', async () => {
    const emp = await createEmployerWithCompany();
    const res = await request(app)
      .put('/api/employer/company')
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send({
        name: 'ACME Corp',
        description: 'Updated description for our wonderful company here.',
        website: 'https://acme.example.com',
        industry: 'Software',
        size: 'medium',
        location: 'New York, NY',
      });
    expect(res.status).toBe(200);
    expect(res.body.company.description).toContain('Updated description');
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).put('/api/employer/company').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/employer/dashboard ───────────────────────────────────────────────

describe('GET /api/employer/dashboard', () => {
  it('200 — returns stats object', async () => {
    const emp = await createEmployerWithCompany();
    const res = await request(app)
      .get('/api/employer/dashboard')
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/employer/dashboard');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/employer/jobs ────────────────────────────────────────────────────

describe('GET /api/employer/jobs', () => {
  it('200 — returns only this employer\'s jobs', async () => {
    const emp = await createEmployerWithCompany();
    await createJob(emp.accessToken);
    await createJob(emp.accessToken, { title: 'Another Engineering Position Here' });

    const res = await request(app)
      .get('/api/employer/jobs')
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(2);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/employer/jobs');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/employer/jobs/:jobId/applications ────────────────────────────────

describe('GET /api/employer/jobs/:jobId/applications', () => {
  it('200 — employer sees applications for own job', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    // Seeker applies
    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({
        jobId,
        coverLetter: 'I am very interested and would be a great fit for this role.',
      });

    const res = await request(app)
      .get(`/api/employer/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${emp.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(1);
  });

  it('403 — employer cannot see another employer\'s applications', async () => {
    const emp1 = await createEmployerWithCompany('emp1@test.com');
    const emp2 = await createEmployerWithCompany('emp2@test.com');
    const { jobId } = await createJob(emp1.accessToken);

    const res = await request(app)
      .get(`/api/employer/jobs/${jobId}/applications`)
      .set('Authorization', `Bearer ${emp2.accessToken}`);
    expect(res.status).toBe(403);
  });
});

// ── PATCH /api/employer/applications/:applicationId/status ────────────────────

describe('PATCH /api/employer/applications/:applicationId/status', () => {
  it('200 — employer updates application status', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({
        jobId,
        coverLetter: 'I am very interested and would be a great fit for this role.',
      });
    const applicationId: string = applyRes.body.application._id as string;

    const res = await request(app)
      .patch(`/api/employer/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('400 — invalid status value', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    const applyRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({
        jobId,
        coverLetter: 'I am very interested and would be a great fit for this role.',
      });
    const applicationId: string = applyRes.body.application._id as string;

    const res = await request(app)
      .patch(`/api/employer/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send({ status: 'hired' }); // not a valid status
    expect(res.status).toBe(400);
  });
});
