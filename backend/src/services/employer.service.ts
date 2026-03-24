import { Company, ICompany, type CompanySize } from '../models/company.model';
import { Job } from '../models/job.model';
import { Application, APPLICATION_STATUSES, type ApplicationStatus } from '../models/application.model';
import { SeekerProfile } from '../models/seeker-profile.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/errors';
import { uploadBuffer, deleteFile } from '../utils/cloudinary-upload';
import { parsePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination';
import { sendApplicationStatusEmail } from '../utils/email';

// ── Input types ───────────────────────────────────────────────────────────────

export interface UpsertCompanyInput {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  location?: string;
}

// ── Company profile ───────────────────────────────────────────────────────────

export const getCompany = async (employerId: string): Promise<ICompany | null> =>
  Company.findOne({ ownerId: employerId }).lean() as unknown as ICompany | null;

export const upsertCompany = async (
  employerId: string,
  input: UpsertCompanyInput,
): Promise<ICompany> => {
  const existing = await Company.findOne({ ownerId: employerId });

  if (existing) {
    Object.assign(existing, input);
    await existing.save();
    return existing;
  }

  // Create new — pre-save hook will generate the slug
  const company = await Company.create({ ownerId: employerId, ...input });
  return company;
};

// ── Logo upload ───────────────────────────────────────────────────────────────

export const uploadCompanyLogo = async (
  employerId: string,
  buffer: Buffer,
): Promise<ICompany> => {
  const existing = await Company.findOne({ ownerId: employerId }).select('+logoPublicId');
  if (!existing) throw new ApiError(400, 'Create a company profile before uploading a logo');

  if (existing.logoPublicId) {
    await deleteFile(existing.logoPublicId);
  }

  const { url, publicId } = await uploadBuffer(buffer, 'jobboard/logos', {
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  });

  existing.logo = url;
  existing.logoPublicId = publicId;
  await existing.save();

  return existing;
};

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface EmployerStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
}

export const getDashboardStats = async (employerId: string): Promise<EmployerStats> => {
  const company = await Company.findOne({ ownerId: employerId }).select('_id').lean();

  if (!company) {
    return {
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      applicationsByStatus: {
        applied: 0,
        reviewed: 0,
        shortlisted: 0,
        rejected: 0,
      },
    };
  }

  const jobIds = await Job.find({ postedBy: employerId }).distinct('_id');

  const [totalJobs, activeJobs, statusAgg] = await Promise.all([
    Job.countDocuments({ postedBy: employerId }),
    Job.countDocuments({ postedBy: employerId, status: 'active' }),
    Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const applicationsByStatus: Record<ApplicationStatus, number> = {
    applied: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0,
  };

  let totalApplications = 0;
  for (const entry of statusAgg) {
    const status = entry._id as ApplicationStatus;
    if (APPLICATION_STATUSES.includes(status)) {
      applicationsByStatus[status] = entry.count as number;
      totalApplications += entry.count as number;
    }
  }

  return { totalJobs, activeJobs, totalApplications, applicationsByStatus };
};

// ── Job applications ──────────────────────────────────────────────────────────

export const getJobApplications = async (
  jobId: string,
  employerId: string,
  rawPage?: string,
  rawLimit?: string,
  statusFilter?: ApplicationStatus,
): Promise<{ applications: Record<string, unknown>[]; pagination: PaginationMeta }> => {
  // Verify job belongs to this employer
  const job = await Job.findById(jobId).select('postedBy title').lean();
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.postedBy.toString() !== employerId) {
    throw new ApiError(403, 'You can only view applications for your own jobs');
  }

  const { page, limit, skip } = parsePagination(rawPage, rawLimit);
  const filter: Record<string, unknown> = { jobId };
  if (statusFilter) filter.status = statusFilter;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('seekerId', 'email')
      .lean(),
    Application.countDocuments(filter),
  ]);

  // Also populate seeker profile info
  const seekerIds = applications.map((a) => (a.seekerId as { _id: unknown })._id ?? a.seekerId);
  const profiles = await SeekerProfile.find({ userId: { $in: seekerIds } })
    .select('userId firstName lastName avatar headline')
    .lean();

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const enriched = applications.map((app) => {
    const seekerIdStr =
      typeof app.seekerId === 'object' && '_id' in (app.seekerId as object)
        ? (app.seekerId as { _id: { toString(): string } })._id.toString()
        : String(app.seekerId);
    return { ...app, seekerProfile: profileMap.get(seekerIdStr) ?? null };
  });

  return { applications: enriched as unknown as Record<string, unknown>[], pagination: buildPaginationMeta(total, page, limit) };
};

// ── Update application status ─────────────────────────────────────────────────

export const updateApplicationStatus = async (
  applicationId: string,
  employerId: string,
  status: ApplicationStatus,
  employerNote?: string,
): Promise<void> => {
  const application = await Application.findById(applicationId)
    .select('jobId seekerId status')
    .lean();
  if (!application) throw new ApiError(404, 'Application not found');

  // Verify this application belongs to one of the employer's jobs
  const job = await Job.findById(application.jobId).select('postedBy title').lean();
  if (!job || job.postedBy.toString() !== employerId) {
    throw new ApiError(403, 'You can only update applications for your own jobs');
  }

  const update: Record<string, unknown> = { status };
  if (employerNote !== undefined) update.employerNote = employerNote;

  await Application.findByIdAndUpdate(applicationId, update);

  // Send email notification to seeker (fire-and-forget — never block the response)
  const seekerId = application.seekerId.toString();
  Promise.all([
    User.findById(seekerId).select('email').lean(),
    SeekerProfile.findOne({ userId: seekerId }).select('firstName lastName').lean(),
  ])
    .then(([user, profile]) => {
      if (!user) return;
      const seekerName = profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : user.email;
      return sendApplicationStatusEmail(
        user.email,
        seekerName,
        job.title,
        status,
        employerNote,
      );
    })
    .catch((err: unknown) => {
      console.error('[email] Failed to send application status email:', err);
    });
};
