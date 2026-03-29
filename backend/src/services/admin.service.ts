import { User } from '../models/user.model';
import { Job } from '../models/job.model';
import { Application } from '../models/application.model';
import { ApiError } from '../utils/errors';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

// ── Platform stats ─────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeJobs: number;
  newUsersToday: number;
  newJobsToday: number;
  usersByRole: { seeker: number; employer: number; admin: number };
}

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalJobs,
    totalApplications,
    activeJobs,
    newUsersToday,
    newJobsToday,
    roleAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Application.countDocuments(),
    Job.countDocuments({ status: 'active' }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    Job.countDocuments({ createdAt: { $gte: todayStart } }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  const usersByRole = { seeker: 0, employer: 0, admin: 0 };
  for (const entry of roleAgg) {
    const role = entry._id as keyof typeof usersByRole;
    if (role in usersByRole) usersByRole[role] = entry.count as number;
  }

  return {
    totalUsers,
    totalJobs,
    totalApplications,
    activeJobs,
    newUsersToday,
    newJobsToday,
    usersByRole,
  };
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const listUsers = async (
  rawPage?: string,
  rawLimit?: string,
  role?: string,
  search?: string,
) => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    filter.email = { $regex: search, $options: 'i' };
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, pagination: buildPaginationMeta(total, page, limit) };
};

export const setBanStatus = async (userId: string, ban: boolean): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(403, 'Cannot ban admin accounts');
  user.isActive = !ban;
  await user.save();
};

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const listAllJobs = async (
  rawPage?: string,
  rawLimit?: string,
  status?: string,
  search?: string,
) => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$text = { $search: search };
  }

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

export const deleteJob = async (jobId: string): Promise<void> => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');
  await job.deleteOne();
  // Clean up associated applications (fire-and-forget)
  Application.deleteMany({ jobId }).exec();
};

// ── Applications ──────────────────────────────────────────────────────────────

export interface AdminApplicationItem {
  _id: string;
  status: string;
  createdAt: Date;
  seekerId: { _id: string; email: string } | null;
  jobId: {
    _id: string;
    title: string;
    slug: string;
    companyId: { name: string } | null;
  } | null;
}

export const listAllApplications = async (
  rawPage?: string,
  rawLimit?: string,
  status?: string,
  jobId?: string,
  seekerId?: string,
): Promise<{ applications: AdminApplicationItem[]; pagination: ReturnType<typeof buildPaginationMeta> }> => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (jobId) filter.jobId = jobId;
  if (seekerId) filter.seekerId = seekerId;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: 'seekerId', select: 'email' },
        { path: 'jobId', select: 'title slug companyId', populate: { path: 'companyId', select: 'name' } },
      ])
      .lean(),
    Application.countDocuments(filter),
  ]);

  return {
    applications: applications as unknown as AdminApplicationItem[],
    pagination: buildPaginationMeta(total, page, limit),
  };
};
