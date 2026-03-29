/**
 * Unit tests for employer.service.ts
 * All Mongoose models are mocked — no real DB required.
 */

// ── Required env vars ─────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32chars!!';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.CLIENT_URL = 'http://localhost:3000';

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../../models/company.model');
jest.mock('../../models/job.model');
jest.mock('../../models/application.model', () => {
  const actual = jest.requireActual('../../models/application.model');
  return {
    APPLICATION_STATUSES: actual.APPLICATION_STATUSES,
    Application: {
      aggregate: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
    },
  };
});
jest.mock('../../models/seeker-profile.model');
jest.mock('../../models/user.model');
jest.mock('../../utils/cloudinary-upload');
jest.mock('../../utils/email', () => {
  const actual = jest.requireActual('../../utils/email');
  return {
    ...actual,
    sendApplicationStatusEmail: jest.fn().mockResolvedValue(undefined),
  };
});

import { Company } from '../../models/company.model';
import { Job } from '../../models/job.model';
import { Application } from '../../models/application.model';
import { SeekerProfile } from '../../models/seeker-profile.model';
import { User } from '../../models/user.model';
import * as cloudinary from '../../utils/cloudinary-upload';
import * as email from '../../utils/email';
import * as employerService from '../../services/employer.service';

const MockCompany = Company as jest.Mocked<typeof Company>;
const MockJob = Job as jest.Mocked<typeof Job>;
const MockApplication = Application as jest.Mocked<typeof Application>;
const MockSeekerProfile = SeekerProfile as jest.Mocked<typeof SeekerProfile>;
const MockUser = User as jest.Mocked<typeof User>;
const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;
const mockEmail = email as jest.Mocked<typeof email>;

afterEach(() => jest.clearAllMocks());

// ── getCompany ────────────────────────────────────────────────────────────────

describe('employerService.getCompany', () => {
  it('returns null when company does not exist', async () => {
    (MockCompany.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const result = await employerService.getCompany('employer-id');
    expect(result).toBeNull();
  });

  it('returns company when it exists', async () => {
    const fakeCompany = { name: 'Acme Corp', ownerId: 'employer-id' };
    (MockCompany.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeCompany) });

    const result = await employerService.getCompany('employer-id');
    expect(result).toEqual(fakeCompany);
  });
});

// ── upsertCompany ─────────────────────────────────────────────────────────────

describe('employerService.upsertCompany', () => {
  const input = { name: 'Acme Corp', description: 'We build things' };

  it('creates a new company if none exists', async () => {
    const fakeCompany = { ...input, ownerId: 'employer-id', slug: 'acme-corp-abc123' };
    (MockCompany.findOne as jest.Mock).mockResolvedValue(null);
    (MockCompany.create as jest.Mock).mockResolvedValue(fakeCompany);

    const result = await employerService.upsertCompany('employer-id', input);
    expect(MockCompany.create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'employer-id', name: 'Acme Corp' }),
    );
    expect(result.name).toBe('Acme Corp');
  });

  it('updates existing company', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const existing = { name: 'Old Name', ownerId: 'employer-id', save: saveMock };
    (MockCompany.findOne as jest.Mock).mockResolvedValue(existing);

    const result = await employerService.upsertCompany('employer-id', { name: 'New Name' });
    expect(saveMock).toHaveBeenCalled();
    expect(result.name).toBe('New Name');
  });
});

// ── uploadCompanyLogo ─────────────────────────────────────────────────────────

describe('employerService.uploadCompanyLogo', () => {
  it('throws 400 if company does not exist', async () => {
    (MockCompany.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(
      employerService.uploadCompanyLogo('employer-id', Buffer.from('data')),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('deletes old logo and uploads new one', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const existing = {
      logo: 'old-url',
      logoPublicId: 'old-public-id',
      save: saveMock,
    };
    (MockCompany.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(existing),
    });
    mockCloudinary.deleteFile.mockResolvedValue(undefined);
    mockCloudinary.uploadBuffer.mockResolvedValue({ url: 'new-url', publicId: 'new-public-id' });

    await employerService.uploadCompanyLogo('employer-id', Buffer.from('data'));

    expect(mockCloudinary.deleteFile).toHaveBeenCalledWith('old-public-id');
    expect(mockCloudinary.uploadBuffer).toHaveBeenCalled();
    expect(existing.logo).toBe('new-url');
    expect(saveMock).toHaveBeenCalled();
  });
});

// ── getDashboardStats ─────────────────────────────────────────────────────────

describe('employerService.getDashboardStats', () => {
  it('returns zeroed stats if employer has no company', async () => {
    (MockCompany.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const stats = await employerService.getDashboardStats('employer-id');
    expect(stats.totalJobs).toBe(0);
    expect(stats.totalApplications).toBe(0);
  });

  it('aggregates stats correctly when data exists', async () => {
    (MockCompany.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'company-id' }) }),
    });
    (MockJob.find as jest.Mock).mockReturnValue({
      distinct: jest.fn().mockResolvedValue(['job1', 'job2']),
    });
    (MockJob.countDocuments as jest.Mock)
      .mockResolvedValueOnce(5)   // totalJobs
      .mockResolvedValueOnce(3);  // activeJobs
    (MockApplication.aggregate as jest.Mock).mockResolvedValue([
      { _id: 'applied', count: 10 },
      { _id: 'reviewed', count: 5 },
      { _id: 'shortlisted', count: 2 },
      { _id: 'rejected', count: 3 },
    ]);

    const stats = await employerService.getDashboardStats('employer-id');
    expect(stats.totalJobs).toBe(5);
    expect(stats.activeJobs).toBe(3);
    expect(stats.totalApplications).toBe(20);
    expect(stats.applicationsByStatus.applied).toBe(10);
    expect(stats.applicationsByStatus.shortlisted).toBe(2);
  });
});

// ── getJobApplications ────────────────────────────────────────────────────────

describe('employerService.getJobApplications', () => {
  it('throws 404 if job not found', async () => {
    (MockJob.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    await expect(
      employerService.getJobApplications('job-id', 'employer-id'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if job belongs to a different employer', async () => {
    (MockJob.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          postedBy: { toString: () => 'other-employer' },
          title: 'Dev Job',
        }),
      }),
    });

    await expect(
      employerService.getJobApplications('job-id', 'employer-id'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ── updateApplicationStatus ───────────────────────────────────────────────────

describe('employerService.updateApplicationStatus', () => {
  it('throws 404 if application not found', async () => {
    (MockApplication.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    await expect(
      employerService.updateApplicationStatus('app-id', 'employer-id', 'reviewed'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 if job belongs to a different employer', async () => {
    (MockApplication.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ jobId: 'job-id', status: 'applied' }),
      }),
    });
    (MockJob.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          postedBy: { toString: () => 'other-employer' },
        }),
      }),
    });

    await expect(
      employerService.updateApplicationStatus('app-id', 'employer-id', 'reviewed'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  // Helper to set up the happy-path mocks shared across email trigger tests
  const setupAuthorizedMocks = (seekerEmail = 'seeker@example.com', seekerProfile = { firstName: 'Jane', lastName: 'Doe' }) => {
    (MockApplication.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          jobId: 'job-id',
          status: 'applied',
          seekerId: { toString: () => 'seeker-id' },
        }),
      }),
    });
    (MockJob.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          postedBy: { toString: () => 'employer-id' },
          title: 'Dev Job',
        }),
      }),
    });
    (MockApplication.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);
    (MockUser.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: seekerEmail }),
      }),
    });
    (MockSeekerProfile.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(seekerProfile),
      }),
    });
    mockEmail.sendApplicationStatusEmail.mockResolvedValue(undefined);
  };

  // Flush the fire-and-forget Promise chain (two microtask ticks to cover nested .then)
  const flushAsync = () => Promise.resolve().then(() => Promise.resolve());

  it('updates status and note when authorized', async () => {
    setupAuthorizedMocks();

    await expect(
      employerService.updateApplicationStatus('app-id', 'employer-id', 'shortlisted', 'Great candidate'),
    ).resolves.toBeUndefined();

    expect(MockApplication.findByIdAndUpdate).toHaveBeenCalledWith(
      'app-id',
      { status: 'shortlisted', employerNote: 'Great candidate' },
    );
  });

  it('triggers email to seeker with correct args when status is actionable', async () => {
    setupAuthorizedMocks('jane@example.com', { firstName: 'Jane', lastName: 'Doe' });

    await employerService.updateApplicationStatus('app-id', 'employer-id', 'shortlisted', 'Great fit');
    await flushAsync();

    expect(MockApplication.findByIdAndUpdate).toHaveBeenCalledWith(
      'app-id',
      expect.objectContaining({ status: 'shortlisted' }),
    );
    expect(mockEmail.sendApplicationStatusEmail).toHaveBeenCalledWith(
      'jane@example.com',
      'Jane Doe',
      'Dev Job',
      'shortlisted',
      'Great fit',
    );
  });

  it('uses email address as name fallback when seeker profile is missing', async () => {
    setupAuthorizedMocks('fallback@example.com', null as unknown as { firstName: string; lastName: string });

    await employerService.updateApplicationStatus('app-id', 'employer-id', 'reviewed');
    await flushAsync();

    expect(mockEmail.sendApplicationStatusEmail).toHaveBeenCalledWith(
      'fallback@example.com',
      'fallback@example.com',
      'Dev Job',
      'reviewed',
      undefined,
    );
  });

  it('does not trigger email when seeker user record is missing', async () => {
    setupAuthorizedMocks();
    (MockUser.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    await employerService.updateApplicationStatus('app-id', 'employer-id', 'rejected');
    await flushAsync();

    expect(mockEmail.sendApplicationStatusEmail).not.toHaveBeenCalled();
  });

  it('does not trigger email when new status is "applied"', async () => {
    setupAuthorizedMocks();

    await employerService.updateApplicationStatus('app-id', 'employer-id', 'applied');
    await flushAsync();

    expect(mockEmail.sendApplicationStatusEmail).not.toHaveBeenCalled();
  });
});
