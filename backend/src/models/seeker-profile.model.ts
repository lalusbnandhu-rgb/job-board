import { Schema, model, Document, Types } from 'mongoose';
import { JOB_EXPERIENCE_LEVELS, type JobExperienceLevel } from '../constants/jobs';

export interface ISeekerProfile extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  avatar?: string;
  avatarPublicId?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills: string[];
  experienceLevel?: JobExperienceLevel;
  resumeUrl?: string;
  resumePublicId?: string;
  resumeFileName?: string;
  savedJobs: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const seekerProfileSchema = new Schema<ISeekerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    avatar: { type: String },
    avatarPublicId: { type: String, select: false },
    headline: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, maxlength: 1000 },
    location: { type: String, trim: true, maxlength: 100 },
    skills: { type: [String], default: [] },
    experienceLevel: { type: String, enum: JOB_EXPERIENCE_LEVELS },
    resumeUrl: { type: String },
    resumePublicId: { type: String, select: false },
    resumeFileName: { type: String },
    savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  },
  { timestamps: true },
);

export const SeekerProfile = model<ISeekerProfile>('SeekerProfile', seekerProfileSchema);
