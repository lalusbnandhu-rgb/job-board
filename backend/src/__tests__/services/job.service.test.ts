/**
 * Unit tests for job.service.ts
 * Job and Company models are mocked.
 */

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32chars';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.CLIENT_URL = 'http://localhost:3000';

jest.mock('../../models/job.model');
jest.mock('../../models/company.model');

import { Job } from '../../models/job.model';
import { Company } from '../../models/company.model';
import * as jobService from '../../services/job.service';

const MockJob = Job as jest.Mocked<typeof Job>;
const MockCompany = Company as jest.Mocked<typeof Company>;

const fakeJob = (overrides = {}) => ({
  _id: 'job-id-1',
  title: 'Senior Engineer',
  slug: 'senior-engineer-abc123',
  status: 'active',
  postedBy: { toString: () => 'employer-id-1' },
  companyId: 'company-id-1',
  viewCount: 10,
  save: jest.fn().mockResolvedValue(undefined),
  deleteOne: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const fakeCompany = (overrides = {}) => ({
  _id: 'company-id-1',
  name: 'Acme Corp',
  ownerId: 'employer-id-1',
  ...overrides,
});

// ── listJobs ──────────────────────────────────────────────────────────────────

describe('jobService.listJobs', () => {
  it('returns jobs with pagination meta', async () => {
    const jobs = [fakeJob(), fakeJob({ _id: 'job-id-2' })];

    (MockJob.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(jobs),
    });
    (MockJob.countDocuments as jest.Mock).mockResolvedValue(2);

    const result = await jobService.listJobs({});

    expect(result.jobs).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('filters by isRemote when isRemote=true', async () => {
    (MockJob.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    (MockJob.countDocuments as jest.Mock).mockResolvedValue(0);

    await jobService.listJobs({ isRemote: 'true' });

    const filterArg = (MockJob.find as jest.Mock).mock.calls[0][0];
    expect(filterArg.isRemote).toBe(true);
  });
});

// ── createJob ─────────────────────────────────────────────────────────────────

describe('jobService.createJob', () => {
  it('throws 400 if employer has no company profile', async () => {
    (MockCompany.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      jobService.createJob('employer-id-1', {
        title: 'Engineer',
        description: 'x'.repeat(60),
        requirements: 'y'.repeat(30),
        location: 'London',
        isRemote: false,
        type: 'full-time',
        category: 'Engineering',
        experienceLevel: 'mid',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates a job linked to the employer company', async () => {
    const company = fakeCompany();
    (MockCompany.findOne as jest.Mock).mockResolvedValue(company);
    (MockJob.create as jest.Mock).mockResolvedValue(fakeJob());

    const job = await jobService.createJob('employer-id-1', {
      title: 'Engineer',
      description: 'x'.repeat(60),
      requirements: 'y'.repeat(30),
      location: 'London',
      isRemote: false,
      type: 'full-time',
      category: 'Engineering',
      experienceLevel: 'mid',
    });

    expect(MockJob.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: company._id, postedBy: 'employer-id-1' }),
    );
    expect(job).toBeDefined();
  });
});

// ── deleteJob ─────────────────────────────────────────────────────────────────

describe('jobService.deleteJob', () => {
  it('throws 404 if job does not exist', async () => {
    (MockJob.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      jobService.deleteJob('nonexistent-id', 'employer-id-1', 'employer'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if requester is not the owner and not admin', async () => {
    (MockJob.findById as jest.Mock).mockResolvedValue(fakeJob({ postedBy: { toString: () => 'other-employer' } }));

    await expect(
      jobService.deleteJob('job-id-1', 'different-employer', 'employer'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows admin to delete any job', async () => {
    const job = fakeJob({ postedBy: { toString: () => 'some-employer' } });
    (MockJob.findById as jest.Mock).mockResolvedValue(job);

    await expect(
      jobService.deleteJob('job-id-1', 'admin-user-id', 'admin'),
    ).resolves.not.toThrow();

    expect(job.deleteOne).toHaveBeenCalled();
  });
});

// ── updateJob ─────────────────────────────────────────────────────────────────

describe('jobService.updateJob', () => {
  it('throws 403 if employer does not own the job', async () => {
    (MockJob.findById as jest.Mock).mockResolvedValue(
      fakeJob({ postedBy: { toString: () => 'other-employer' } }),
    );

    await expect(
      jobService.updateJob('job-id-1', 'my-employer-id', { title: 'New Title' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates and saves the job for the owner', async () => {
    const job = fakeJob();
    (MockJob.findById as jest.Mock).mockResolvedValue(job);

    const updated = await jobService.updateJob('job-id-1', 'employer-id-1', {
      title: 'Updated Title',
    });

    expect(job.save).toHaveBeenCalled();
    expect(updated.title).toBe('Updated Title');
  });
});
