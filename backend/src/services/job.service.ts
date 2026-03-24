import { FilterQuery } from 'mongoose';
import { Job, IJob } from '../models/job.model';
import { Company } from '../models/company.model';
import { ApiError } from '../utils/errors';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import {
  JOB_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  type JobType,
  type JobExperienceLevel,
  type JobCategory,
  type SalaryCurrency,
} from '../constants/jobs';

// ── Input types (controllers pass these after Zod validation) ─────────────────

export interface CreateJobInput {
  title: string;
  description: string;
  requirements: string;
  location: string;
  isRemote: boolean;
  type: JobType;
  category: JobCategory;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: SalaryCurrency;
  experienceLevel: JobExperienceLevel;
  tags?: string[];
  expiresAt?: string;
}

export type UpdateJobInput = Partial<CreateJobInput> & {
  status?: 'active' | 'paused' | 'closed';
};

export interface ListJobsQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  type?: string;
  experienceLevel?: string;
  isRemote?: string;
  location?: string;
  status?: string;
  sort?: string;
  order?: string;
}

// ── Service methods ───────────────────────────────────────────────────────────

export const listJobs = async (query: ListJobsQuery) => {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const filter: FilterQuery<IJob> = {};

  // Public list only shows active jobs unless status explicitly requested (admin)
  filter.status = query.status ?? 'active';

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.category && JOB_CATEGORIES.includes(query.category as JobCategory)) {
    filter.category = query.category;
  }
  if (query.type && JOB_TYPES.includes(query.type as JobType)) {
    filter.type = query.type;
  }
  if (
    query.experienceLevel &&
    JOB_EXPERIENCE_LEVELS.includes(query.experienceLevel as JobExperienceLevel)
  ) {
    filter.experienceLevel = query.experienceLevel;
  }
  if (query.isRemote === 'true') {
    filter.isRemote = true;
  }
  if (query.location) {
    filter.location = { $regex: query.location, $options: 'i' };
  }

  // Sort: default newest first; relevance if text search
  const sortField = query.search
    ? { score: { $meta: 'textScore' }, createdAt: -1 }
    : { [query.sort ?? 'createdAt']: query.order === 'asc' ? 1 : -1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort(sortField as Record<string, 1 | -1>)
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'name slug logo location')
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { jobs, pagination: buildPaginationMeta(total, page, limit) };
};

export const getJobById = async (id: string): Promise<IJob> => {
  const job = await Job.findById(id)
    .populate('companyId', 'name slug logo location website description size')
    .lean();

  if (!job) throw new ApiError(404, 'Job not found');

  // Increment view count (fire-and-forget — don't block response)
  Job.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();

  return job as unknown as IJob;
};

export const getJobBySlug = async (slug: string): Promise<IJob> => {
  const job = await Job.findOne({ slug })
    .populate('companyId', 'name slug logo location website description size')
    .lean();

  if (!job) throw new ApiError(404, 'Job not found');

  Job.findByIdAndUpdate(job._id, { $inc: { viewCount: 1 } }).exec();

  return job as unknown as IJob;
};

export const createJob = async (
  employerId: string,
  input: CreateJobInput,
): Promise<IJob> => {
  const company = await Company.findOne({ ownerId: employerId });
  if (!company) {
    throw new ApiError(
      400,
      'You must create a company profile before posting jobs',
    );
  }

  const job = await Job.create({
    ...input,
    companyId: company._id,
    postedBy: employerId,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
  });

  return job;
};

export const updateJob = async (
  jobId: string,
  employerId: string,
  input: UpdateJobInput,
): Promise<IJob> => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.postedBy.toString() !== employerId) {
    throw new ApiError(403, 'You can only edit your own job listings');
  }

  Object.assign(job, {
    ...input,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : job.expiresAt,
  });
  await job.save();

  return job;
};

export const deleteJob = async (
  jobId: string,
  requesterId: string,
  requesterRole: string,
): Promise<void> => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');

  const isOwner = job.postedBy.toString() === requesterId;
  const isAdmin = requesterRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You do not have permission to delete this job');
  }

  await job.deleteOne();
};

export const getEmployerJobs = async (
  employerId: string,
  query: ListJobsQuery,
) => {
  const { page, limit, skip } = parsePagination(query.page, query.limit);
  const filter: FilterQuery<IJob> = { postedBy: employerId };

  if (query.status) filter.status = query.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'name logo')
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { jobs, pagination: buildPaginationMeta(total, page, limit) };
};
