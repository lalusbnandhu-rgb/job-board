/**
 * Integration tests — /api/applications
 */

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import {
  createEmployerWithCompany,
  createSeekerWithProfile,
  createJob,
} from './helpers/factories';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

const APPLY_BODY = {
  coverLetter: 'I am very interested in this position and believe I am a great fit.',
  // resumeUrl comes from seeker profile — provided by the service automatically
};

// ── POST /api/applications ────────────────────────────────────────────────────

describe('POST /api/applications', () => {
  it('201 — seeker applies to a job', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({ jobId, ...APPLY_BODY });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('application');
    expect(res.body.application.status).toBe('applied');
  });

  it('409 — seeker cannot apply to the same job twice', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({ jobId, ...APPLY_BODY });

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({ jobId, ...APPLY_BODY });
    expect(res.status).toBe(409);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).post('/api/applications').send(APPLY_BODY);
    expect(res.status).toBe(401);
  });

  it('403 — employer cannot apply to jobs', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${emp.accessToken}`)
      .send({ jobId, ...APPLY_BODY });
    expect(res.status).toBe(403);
  });

  it('400 — missing cover letter', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({ jobId });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/applications/mine ────────────────────────────────────────────────

describe('GET /api/applications/mine', () => {
  it('200 — seeker sees own applications', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({ jobId, ...APPLY_BODY });

    const res = await request(app)
      .get('/api/applications/mine')
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(1);
    expect(res.body).toHaveProperty('pagination');
  });

  it('200 — returns empty list when no applications', async () => {
    const seeker = await createSeekerWithProfile();
    const res = await request(app)
      .get('/api/applications/mine')
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(0);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/applications/mine');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/applications/check/:jobId ───────────────────────────────────────

describe('GET /api/applications/check/:jobId', () => {
  it('200 — returns applied:false before applying', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    const res = await request(app)
      .get(`/api/applications/check/${jobId}`)
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(false);
  });

  it('200 — returns applied:true after applying', async () => {
    const emp = await createEmployerWithCompany();
    const { jobId } = await createJob(emp.accessToken);
    const seeker = await createSeekerWithProfile();

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${seeker.accessToken}`)
      .send({ jobId, ...APPLY_BODY });

    const res = await request(app)
      .get(`/api/applications/check/${jobId}`)
      .set('Authorization', `Bearer ${seeker.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(true);
  });

  it('401 — unauthenticated', async () => {
    const res = await request(app).get('/api/applications/check/some-job-id');
    expect(res.status).toBe(401);
  });
});
