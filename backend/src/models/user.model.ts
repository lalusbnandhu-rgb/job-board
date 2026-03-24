import { Schema, model, Document } from 'mongoose';

export type UserRole = 'seeker' | 'employer' | 'admin';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  /** SHA-256 hashed refresh tokens — supports multiple device sessions */
  refreshTokens: string[];
  isActive: boolean;
  /** Consecutive failed login attempts since last success */
  failedLoginAttempts: number;
  /** Null = not locked; future Date = locked until that time */
  lockUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['seeker', 'employer', 'admin'],
      required: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokens: { type: [String], default: [], select: false },
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

// Never return sensitive fields in default queries
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    delete r['passwordHash'];
    delete r['refreshTokens'];
    delete r['emailVerificationToken'];
    delete r['emailVerificationExpires'];
    delete r['passwordResetToken'];
    delete r['passwordResetExpires'];
    delete r['failedLoginAttempts'];
    delete r['lockUntil'];
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
