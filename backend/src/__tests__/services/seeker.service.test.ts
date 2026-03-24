/**
 * Unit tests for seeker.service.ts
 * SeekerProfile, Job models and cloudinary-upload utility are mocked.
 */

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32chars';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.CLIENT_URL = 'http://localhost:3000';

jest.mock('../../models/seeker-profile.model');
jest.mock('../../models/job.model');
jest.mock('../../utils/cloudinary-upload');

import { SeekerProfile } from '../../models/seeker-profile.model';
import { Job } from '../../models/job.model';
import * as cloudinaryUpload from '../../utils/cloudinary-upload';
import * as seekerService from '../../services/seeker.service';

const MockProfile = SeekerProfile as jest.Mocked<typeof SeekerProfile>;
const MockJob = Job as jest.Mocked<typeof Job>;
const MockUpload = cloudinaryUpload as jest.Mocked<typeof cloudinaryUpload>;

const fakeProfile = (overrides = {}) => ({
  userId: 'seeker-1',
  firstName: 'Jane',
  lastName: 'Doe',
  avatar: 'https://cdn.example.com/avatar.jpg',
  avatarPublicId: 'jobboard/avatars/abc',
  resumeUrl: 'https://cdn.example.com/resume.pdf',
  resumePublicId: 'jobboard/resumes/xyz',
  savedJobs: [],
  ...overrides,
});

// ── getProfile ────────────────────────────────────────────────────────────────

describe('seekerService.getProfile', () => {
  it('returns null when no profile exists', async () => {
    (MockProfile.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const result = await seekerService.getProfile('seeker-1');
    expect(result).toBeNull();
  });

  it('returns the profile when it exists', async () => {
    const profile = fakeProfile();
    (MockProfile.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(profile) });
    const result = await seekerService.getProfile('seeker-1');
    expect(result?.firstName).toBe('Jane');
  });
});

// ── upsertProfile ─────────────────────────────────────────────────────────────

describe('seekerService.upsertProfile', () => {
  it('creates a profile if one does not exist (upsert)', async () => {
    const created = fakeProfile();
    (MockProfile.findOneAndUpdate as jest.Mock).mockResolvedValue(created);

    const result = await seekerService.upsertProfile('seeker-1', {
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(MockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'seeker-1' },
      expect.objectContaining({ $set: { firstName: 'Jane', lastName: 'Doe' } }),
      expect.objectContaining({ upsert: true }),
    );
    expect(result.firstName).toBe('Jane');
  });
});

// ── uploadAvatar ──────────────────────────────────────────────────────────────

describe('seekerService.uploadAvatar', () => {
  it('deletes the old avatar before uploading a new one', async () => {
    const existing = fakeProfile();
    (MockProfile.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(existing),
    });
    MockUpload.deleteFile.mockResolvedValue(undefined);
    MockUpload.uploadBuffer.mockResolvedValue({
      url: 'https://new-avatar.jpg',
      publicId: 'new-public-id',
    });
    (MockProfile.findOneAndUpdate as jest.Mock).mockResolvedValue({
      ...existing,
      avatar: 'https://new-avatar.jpg',
    });

    await seekerService.uploadAvatar('seeker-1', Buffer.from('img'));

    expect(MockUpload.deleteFile).toHaveBeenCalledWith('jobboard/avatars/abc');
    expect(MockUpload.uploadBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      'jobboard/avatars',
      expect.any(Object),
    );
  });
});

// ── saveJob / unsaveJob ───────────────────────────────────────────────────────

describe('seekerService.saveJob', () => {
  it('throws 404 if job does not exist', async () => {
    (MockJob.findById as jest.Mock).mockResolvedValue(null);
    await expect(seekerService.saveJob('seeker-1', 'nonexistent-job')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('adds jobId to savedJobs when job exists', async () => {
    (MockJob.findById as jest.Mock).mockResolvedValue({ _id: 'job-1' });
    (MockProfile.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    await seekerService.saveJob('seeker-1', 'job-1');

    expect(MockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'seeker-1' },
      { $addToSet: { savedJobs: 'job-1' } },
      expect.any(Object),
    );
  });
});

describe('seekerService.unsaveJob', () => {
  it('removes the jobId from savedJobs', async () => {
    (MockProfile.findOneAndUpdate as jest.Mock).mockResolvedValue({});
    await seekerService.unsaveJob('seeker-1', 'job-1');
    expect(MockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'seeker-1' },
      { $pull: { savedJobs: 'job-1' } },
    );
  });
});
