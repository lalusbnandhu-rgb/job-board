/**
 * Integration tests — /api/companies
 * Public endpoints — no auth required.
 */

jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import { createEmployerWithCompany, createJob } from './helpers/factories';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

// ── GET /api/companies ────────────────────────────────────────────────────────

describe('GET /api/companies', () => {
  it('200 — returns company list with pagination', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('companies');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.companies)).toBe(true);
  });

  it('200 — includes activeJobCount per company', async () => {
    const emp = await createEmployerWithCompany('emp@test.com');
    await createJob(emp.accessToken);
    await createJob(emp.accessToken, { title: 'Second Engineering Role Here' });

    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(200);
    const company = res.body.companies[0];
    expect(company).toHaveProperty('activeJobCount');
    expect(company.activeJobCount).toBe(2);
  });

  it('200 — filters by search', async () => {
    await createEmployerWithCompany('a@test.com');
    await createEmployerWithCompany('b@test.com');

    const res = await request(app).get('/api/companies?search=ACME');
    expect(res.status).toBe(200);
    // All seeded companies are named "ACME Corp" by factory
    expect(res.body.companies.length).toBeGreaterThanOrEqual(1);
    expect(
      (res.body.companies as Array<{ name: string }>).every((c) =>
        c.name.toLowerCase().includes('acme'),
      ),
    ).toBe(true);
  });

  it('200 — returns empty array when no match', async () => {
    const res = await request(app).get('/api/companies?search=NoSuchCompanyXYZ');
    expect(res.status).toBe(200);
    expect(res.body.companies.length).toBe(0);
  });

  it('200 — paginates correctly', async () => {
    const res = await request(app).get('/api/companies?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 10 });
  });
});

// ── GET /api/companies/:slug ──────────────────────────────────────────────────

describe('GET /api/companies/:slug', () => {
  it('200 — returns company with active jobs', async () => {
    const emp = await createEmployerWithCompany('slug@test.com');
    await createJob(emp.accessToken);

    // Fetch company slug from list
    const list = await request(app).get('/api/companies');
    const slug: string = (list.body.companies as Array<{ slug: string }>)[0].slug;

    const res = await request(app).get(`/api/companies/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('company');
    expect(res.body).toHaveProperty('jobs');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.length).toBe(1);
  });

  it('404 — unknown slug', async () => {
    const res = await request(app).get('/api/companies/not-a-real-company-abc');
    expect(res.status).toBe(404);
  });
});
