/**
 * Test data factories.
 * Each factory writes directly to MongoDB via Mongoose models.
 * No HTTP layer involved — factories are for setup only.
 */
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../../../app';
import { User } from '../../../models/user.model';
import { Company } from '../../../models/company.model';
import { SeekerProfile } from '../../../models/seeker-profile.model';

// ── Minimal valid job body ────────────────────────────────────────────────────

export const JOB_BODY: Record<string, unknown> = {
  title: 'Senior Software Engineer',
  description: 'A'.repeat(50), // min 50 chars
  requirements: 'B'.repeat(20), // min 20 chars
  location: 'Remote',
  isRemote: true,
  type: 'full-time',
  category: 'Engineering',
  experienceLevel: 'senior',
  salaryCurrency: 'USD',
  tags: ['TypeScript', 'Node.js'],
};

// ── User factories ────────────────────────────────────────────────────────────

interface CreatedUser {
  userId: string;
  email: string;
  role: string;
}

export async function createUser(
  email: string,
  password: string,
  role: 'seeker' | 'employer' | 'admin' = 'seeker',
): Promise<CreatedUser> {
  const passwordHash = await bcrypt.hash(password, 4); // low rounds for speed in tests
  const user = await User.create({
    email,
    passwordHash,
    role,
    isEmailVerified: true,
    isActive: true,
  });
  return { userId: user._id.toString(), email, role };
}

// ── Login helper ──────────────────────────────────────────────────────────────

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export async function loginAs(email: string, password: string): Promise<AuthTokens> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return {
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    userId: res.body.user.id as string,
  };
}

// ── Compound factories ────────────────────────────────────────────────────────

interface EmployerContext extends AuthTokens {
  companyId: string;
}

export async function createEmployerWithCompany(
  email = 'employer@test.com',
  password = 'Password1!',
): Promise<EmployerContext> {
  const { userId } = await createUser(email, password, 'employer');
  const company = new Company({
    ownerId: userId,
    name: 'ACME Corp',
    industry: 'Software',
    location: 'Remote',
    size: 'small',
    isVerified: false,
  });
  await company.save();
  const tokens = await loginAs(email, password);
  return { ...tokens, companyId: company._id.toString() };
}

interface SeekerContext extends AuthTokens {
  email: string;
  profileId?: string;
}

export async function createSeekerWithProfile(
  email = 'seeker@test.com',
  password = 'Password1!',
): Promise<SeekerContext> {
  const { userId } = await createUser(email, password, 'seeker');
  const profile = await SeekerProfile.create({
    userId,
    firstName: 'Test',
    lastName: 'Seeker',
    headline: 'Software Engineer',
    experienceLevel: 'mid',
    skills: ['JavaScript'],
    location: 'Remote',
    resumeUrl: 'https://example.com/resume.pdf',
  });
  const tokens = await loginAs(email, password);
  return { ...tokens, email, profileId: profile._id.toString() };
}

interface JobContext {
  jobId: string;
  jobSlug: string;
}

export async function createJob(
  employerToken: string,
  overrides: Record<string, unknown> = {},
): Promise<JobContext> {
  const res = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${employerToken}`)
    .send({ ...JOB_BODY, ...overrides });
  if (res.status !== 201) {
    throw new Error(`createJob failed: ${JSON.stringify(res.body)}`);
  }
  return { jobId: res.body.job._id as string, jobSlug: res.body.job.slug as string };
}
