import { SeekerProfile, ISeekerProfile } from '../models/seeker-profile.model';
import { Job } from '../models/job.model';
import { ApiError } from '../utils/errors';
import { uploadBuffer, deleteFile } from '../utils/cloudinary-upload';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import type { JobExperienceLevel } from '../constants/jobs';

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  experienceLevel?: JobExperienceLevel;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = async (userId: string): Promise<ISeekerProfile | null> =>
  SeekerProfile.findOne({ userId }).lean() as unknown as ISeekerProfile | null;

export const upsertProfile = async (
  userId: string,
  input: UpdateProfileInput,
): Promise<ISeekerProfile> => {
  const profile = await SeekerProfile.findOneAndUpdate(
    { userId },
    { $set: input },
    { new: true, upsert: true, runValidators: true, lean: true },
  );
  return profile as unknown as ISeekerProfile;
};

// ── Avatar upload ─────────────────────────────────────────────────────────────

export const uploadAvatar = async (
  userId: string,
  buffer: Buffer,
): Promise<ISeekerProfile> => {
  const existing = await SeekerProfile.findOne({ userId }).select('+avatarPublicId');

  // Delete old avatar from Cloudinary before uploading a new one
  if (existing?.avatarPublicId) {
    await deleteFile(existing.avatarPublicId);
  }

  const { url, publicId } = await uploadBuffer(buffer, 'jobboard/avatars', {
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

  const profile = await SeekerProfile.findOneAndUpdate(
    { userId },
    { $set: { avatar: url, avatarPublicId: publicId } },
    { new: true, upsert: true, lean: true },
  );
  return profile as unknown as ISeekerProfile;
};

// ── Resume upload ─────────────────────────────────────────────────────────────

export const uploadResume = async (
  userId: string,
  buffer: Buffer,
  originalName: string,
): Promise<ISeekerProfile> => {
  const existing = await SeekerProfile.findOne({ userId }).select('+resumePublicId');

  if (existing?.resumePublicId) {
    await deleteFile(existing.resumePublicId);
  }

  const { url, publicId } = await uploadBuffer(buffer, 'jobboard/resumes', {
    resource_type: 'raw',
    format: 'pdf',
  });

  const profile = await SeekerProfile.findOneAndUpdate(
    { userId },
    { $set: { resumeUrl: url, resumePublicId: publicId, resumeFileName: originalName } },
    { new: true, upsert: true, lean: true },
  );
  return profile as unknown as ISeekerProfile;
};

// ── Saved jobs ────────────────────────────────────────────────────────────────

export const getSavedJobs = async (
  userId: string,
  rawPage?: string,
  rawLimit?: string,
) => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);

  const profile = await SeekerProfile.findOne({ userId }).select('savedJobs').lean();
  if (!profile) return { jobs: [], pagination: buildPaginationMeta(0, page, limit) };

  const savedIds = profile.savedJobs;
  const total = savedIds.length;

  const jobs = await Job.find({ _id: { $in: savedIds }, status: 'active' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('companyId', 'name slug logo location')
    .lean();

  return { jobs, pagination: buildPaginationMeta(total, page, limit) };
};

export const saveJob = async (userId: string, jobId: string): Promise<void> => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');

  await SeekerProfile.findOneAndUpdate(
    { userId },
    { $addToSet: { savedJobs: jobId } },
    { upsert: true },
  );
};

export const unsaveJob = async (userId: string, jobId: string): Promise<void> => {
  await SeekerProfile.findOneAndUpdate({ userId }, { $pull: { savedJobs: jobId } });
};
