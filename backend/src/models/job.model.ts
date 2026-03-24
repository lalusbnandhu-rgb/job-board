import { Schema, model, Document, Types } from 'mongoose';
import slugify from 'slugify';
import {
  JOB_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_STATUSES,
  JOB_CATEGORIES,
  SALARY_CURRENCIES,
  type JobType,
  type JobExperienceLevel,
  type JobStatus,
  type JobCategory,
  type SalaryCurrency,
} from '../constants/jobs';

export interface IJob extends Document {
  companyId: Types.ObjectId;
  postedBy: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  location: string;
  isRemote: boolean;
  type: JobType;
  category: JobCategory;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: SalaryCurrency;
  experienceLevel: JobExperienceLevel;
  status: JobStatus;
  tags: string[];
  viewCount: number;
  applicationCount: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, maxlength: 10_000 },
    requirements: { type: String, required: true, maxlength: 5_000 },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    isRemote: { type: Boolean, default: false },
    type: { type: String, enum: JOB_TYPES, required: true },
    category: { type: String, enum: JOB_CATEGORIES, required: true },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    salaryCurrency: { type: String, enum: SALARY_CURRENCIES, default: 'USD' },
    experienceLevel: { type: String, enum: JOB_EXPERIENCE_LEVELS, required: true },
    status: { type: String, enum: JOB_STATUSES, default: 'active', index: true },
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// ── Indexes for search performance ────────────────────────────────────────────
jobSchema.index({ title: 'text', description: 'text', tags: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ type: 1, status: 1 });

// ── Auto-generate unique slug before save ─────────────────────────────────────
jobSchema.pre('save', async function (next) {
  if (!this.isModified('title') && this.slug) return next();

  const base = slugify(this.title, { lower: true, strict: true });
  const suffix = this._id.toString().slice(-6);
  this.slug = `${base}-${suffix}`;
  next();
});

export const Job = model<IJob>('Job', jobSchema);
