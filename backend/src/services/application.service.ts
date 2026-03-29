import mongoose from 'mongoose';
import { Application, IApplication } from '../models/application.model';
import { Job } from '../models/job.model';
import { SeekerProfile } from '../models/seeker-profile.model';
import { ApiError } from '../utils/errors';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import type { ApplicationStatus } from '../models/application.model';
import { createNotification } from './notification.service';

// ── Apply to a job ─────────────────────────────────────────────────────────────

export const apply = async (
  seekerId: string,
  jobId: string,
  coverLetter: string,
): Promise<IApplication> => {
  const [job, profile] = await Promise.all([
    Job.findById(jobId),
    SeekerProfile.findOne({ userId: seekerId }),
  ]);

  if (!job) throw new ApiError(404, 'Job not found');
  if (job.status !== 'active') throw new ApiError(400, 'This job is no longer accepting applications');
  if (!profile?.resumeUrl) throw new ApiError(400, 'Please upload your resume before applying');

  try {
    const application = await Application.create({
      jobId,
      seekerId,
      coverLetter,
      resumeUrl: profile.resumeUrl,
    });

    // Increment application count (fire-and-forget)
    Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } }).exec();

    // Notify employer of new applicant (fire-and-forget)
    createNotification({
      userId: job.postedBy.toString(),
      type: 'new_applicant',
      message: `A new applicant has applied to your job "${job.title}".`,
      link: `/employer/jobs/${jobId}/applicants`,
    }).catch((err: unknown) => {
      console.error('[notification] Failed to create new_applicant notification:', err);
    });

    return application;
  } catch (err) {
    if (
      err instanceof mongoose.mongo.MongoServerError &&
      err.code === 11000
    ) {
      throw new ApiError(409, 'You have already applied to this job');
    }
    throw err;
  }
};

// ── Get seeker's own applications ─────────────────────────────────────────────

export const getMyApplications = async (
  seekerId: string,
  rawPage?: string,
  rawLimit?: string,
  statusFilter?: ApplicationStatus,
) => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);
  const filter: Record<string, unknown> = { seekerId };
  if (statusFilter) filter.status = statusFilter;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('jobId', 'title slug location type category companyId')
      .lean(),
    Application.countDocuments(filter),
  ]);

  return { applications, pagination: buildPaginationMeta(total, page, limit) };
};

// ── Check if already applied ──────────────────────────────────────────────────

export const hasApplied = async (
  seekerId: string,
  jobId: string,
): Promise<boolean> => {
  const exists = await Application.exists({ seekerId, jobId });
  return !!exists;
};
