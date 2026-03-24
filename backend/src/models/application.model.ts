import { Schema, model, Document, Types } from 'mongoose';

export const APPLICATION_STATUSES = [
  'applied',
  'reviewed',
  'shortlisted',
  'rejected',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  seekerId: Types.ObjectId;
  coverLetter: string;
  resumeUrl: string; // snapshot of resume at time of application
  status: ApplicationStatus;
  employerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coverLetter: { type: String, required: true, maxlength: 3000 },
    resumeUrl: { type: String, required: true },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'applied',
      index: true,
    },
    employerNote: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

// A seeker can only apply once per job
applicationSchema.index({ jobId: 1, seekerId: 1 }, { unique: true });

export const Application = model<IApplication>('Application', applicationSchema);
