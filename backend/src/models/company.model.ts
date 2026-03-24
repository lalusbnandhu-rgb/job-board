import { Schema, model, Document, Types } from 'mongoose';
import slugify from 'slugify';

export const COMPANY_SIZES = ['startup', 'small', 'medium', 'large', 'enterprise'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export interface ICompany extends Document {
  ownerId: Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  logoPublicId?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  location?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, index: true },
    logo: { type: String },
    logoPublicId: { type: String, select: false },
    description: { type: String, maxlength: 2000 },
    website: { type: String, trim: true },
    industry: { type: String, trim: true, maxlength: 80 },
    size: { type: String, enum: COMPANY_SIZES },
    location: { type: String, trim: true, maxlength: 100 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

companySchema.pre('save', async function (next) {
  if (!this.isModified('name') && this.slug) return next();
  const base = slugify(this.name, { lower: true, strict: true });
  const suffix = this._id.toString().slice(-6);
  this.slug = `${base}-${suffix}`;
  next();
});

export const Company = model<ICompany>('Company', companySchema);
