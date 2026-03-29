/**
 * Unit tests for admin.service.ts
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
jest.mock('../../models/user.model');
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
      deleteMany: jest.fn(),
    },
  };
});

import { User } from '../../models/user.model';
import { Job } from '../../models/job.model';
import { Application } from '../../models/application.model';
import * as adminService from '../../services/admin.service';

const MockUser = User as jest.Mocked<typeof User>;
const MockJob = Job as jest.Mocked<typeof Job>;
const MockApplication = Application as jest.Mocked<typeof Application>;

afterEach(() => jest.clearAllMocks());

// ── getPlatformStats ──────────────────────────────────────────────────────────

describe('adminService.getPlatformStats', () => {
  it('returns zeroed stats when no data exists', async () => {
    (MockUser.countDocuments as jest.Mock).mockResolvedValue(0);
    (MockJob.countDocuments as jest.Mock).mockResolvedValue(0);
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(0);
    (MockUser.aggregate as jest.Mock).mockResolvedValue([]);

    const stats = await adminService.getPlatformStats();
    expect(stats.totalUsers).toBe(0);
    expect(stats.totalJobs).toBe(0);
    expect(stats.totalApplications).toBe(0);
    expect(stats.usersByRole).toEqual({ seeker: 0, employer: 0, admin: 0 });
  });

  it('aggregates role counts correctly', async () => {
    (MockUser.countDocuments as jest.Mock).mockResolvedValue(10);
    (MockJob.countDocuments as jest.Mock).mockResolvedValue(5);
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(3);
    (MockUser.aggregate as jest.Mock).mockResolvedValue([
      { _id: 'seeker', count: 7 },
      { _id: 'employer', count: 2 },
      { _id: 'admin', count: 1 },
    ]);

    const stats = await adminService.getPlatformStats();
    expect(stats.usersByRole.seeker).toBe(7);
    expect(stats.usersByRole.employer).toBe(2);
    expect(stats.usersByRole.admin).toBe(1);
  });
});

// ── listUsers ─────────────────────────────────────────────────────────────────

describe('adminService.listUsers', () => {
  it('returns paginated users', async () => {
    const fakeUsers = [{ _id: 'u1', email: 'a@test.com', role: 'seeker' }];
    (MockUser.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeUsers),
    });
    (MockUser.countDocuments as jest.Mock).mockResolvedValue(1);

    const result = await adminService.listUsers();
    expect(result.users).toEqual(fakeUsers);
    expect(result.pagination.total).toBe(1);
  });
});

// ── listAllApplications ───────────────────────────────────────────────────────

describe('adminService.listAllApplications', () => {
  const buildFindChain = (items: unknown[]) => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(items),
    };
    // Return same chain object so we can assert on populate calls
    Object.values(chain).forEach((fn) => (fn as jest.Mock).mockReturnValue(chain));
    chain.lean.mockResolvedValue(items);
    return chain;
  };

  it('returns all applications with pagination', async () => {
    const fakeApps = [
      {
        _id: 'app-1',
        status: 'applied',
        createdAt: new Date(),
        seekerId: { _id: 'u1', email: 'seeker@test.com' },
        jobId: { _id: 'j1', title: 'Dev', slug: 'dev-abc', companyId: { name: 'Acme' } },
      },
    ];
    const chain = buildFindChain(fakeApps);
    (MockApplication.find as jest.Mock).mockReturnValue(chain);
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(1);

    const result = await adminService.listAllApplications();
    expect(result.applications).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(chain.populate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ path: 'seekerId' }),
        expect.objectContaining({ path: 'jobId' }),
      ]),
    );
  });

  it('applies status filter when provided', async () => {
    (MockApplication.find as jest.Mock).mockReturnValue(buildFindChain([]));
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(0);

    await adminService.listAllApplications(undefined, undefined, 'shortlisted');

    expect(MockApplication.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'shortlisted' }),
    );
  });

  it('applies jobId filter when provided', async () => {
    (MockApplication.find as jest.Mock).mockReturnValue(buildFindChain([]));
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(0);

    await adminService.listAllApplications(undefined, undefined, undefined, 'job-id-123');

    expect(MockApplication.find).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-id-123' }),
    );
  });

  it('applies seekerId filter when provided', async () => {
    (MockApplication.find as jest.Mock).mockReturnValue(buildFindChain([]));
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(0);

    await adminService.listAllApplications(undefined, undefined, undefined, undefined, 'seeker-id-456');

    expect(MockApplication.find).toHaveBeenCalledWith(
      expect.objectContaining({ seekerId: 'seeker-id-456' }),
    );
  });

  it('returns empty list when no applications exist', async () => {
    (MockApplication.find as jest.Mock).mockReturnValue(buildFindChain([]));
    (MockApplication.countDocuments as jest.Mock).mockResolvedValue(0);

    const result = await adminService.listAllApplications();
    expect(result.applications).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });
});

// ── setBanStatus ──────────────────────────────────────────────────────────────

describe('adminService.setBanStatus', () => {
  it('throws 404 if user not found', async () => {
    (MockUser.findById as jest.Mock).mockResolvedValue(null);
    await expect(adminService.setBanStatus('user-id', true)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 if banning an admin', async () => {
    (MockUser.findById as jest.Mock).mockResolvedValue({ role: 'admin', save: jest.fn() });
    await expect(adminService.setBanStatus('admin-id', true)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('sets isActive to false when banning', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    const user = { role: 'seeker', isActive: true, save: saveMock };
    (MockUser.findById as jest.Mock).mockResolvedValue(user);

    await adminService.setBanStatus('user-id', true);
    expect(user.isActive).toBe(false);
    expect(saveMock).toHaveBeenCalled();
  });
});

// ── deleteJob ─────────────────────────────────────────────────────────────────

describe('adminService.deleteJob', () => {
  it('throws 404 if job not found', async () => {
    (MockJob.findById as jest.Mock).mockResolvedValue(null);
    await expect(adminService.deleteJob('job-id')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deletes job and triggers application cleanup', async () => {
    const deleteMock = jest.fn().mockResolvedValue(undefined);
    (MockJob.findById as jest.Mock).mockResolvedValue({ deleteOne: deleteMock });
    (MockApplication.deleteMany as jest.Mock).mockReturnValue({ exec: jest.fn() });

    await adminService.deleteJob('job-id');
    expect(deleteMock).toHaveBeenCalled();
    expect(MockApplication.deleteMany).toHaveBeenCalledWith({ jobId: 'job-id' });
  });
});
