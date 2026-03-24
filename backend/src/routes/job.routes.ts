import { Router } from 'express';
import { z } from 'zod';
import * as jobController from '../controllers/job.controller';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { jobCreateLimiter } from '../middleware/rate-limit';
import { objectId, numericString } from '../utils/validators';
import {
  JOB_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  SALARY_CURRENCIES,
} from '../constants/jobs';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────

const MAX_SALARY = 10_000_000;

const jobBaseSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(50).max(10_000),
  requirements: z.string().min(20).max(5_000),
  location: z.string().min(2).max(100),
  isRemote: z.boolean().default(false),
  type: z.enum(JOB_TYPES),
  category: z.enum(JOB_CATEGORIES),
  salaryMin: z.number().int().min(0).max(MAX_SALARY).optional(),
  salaryMax: z.number().int().min(0).max(MAX_SALARY).optional(),
  salaryCurrency: z.enum(SALARY_CURRENCIES).default('USD'),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS),
  tags: z.array(z.string().max(30)).max(10).default([]),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

const createJobSchema = jobBaseSchema.refine(
  (d) =>
    d.salaryMin === undefined ||
    d.salaryMax === undefined ||
    d.salaryMax >= d.salaryMin,
  { message: 'salaryMax must be >= salaryMin', path: ['salaryMax'] },
);

// updateJobSchema derives from the base object (ZodObject), not the refined ZodEffects,
// so .partial() and .extend() are available.
const updateJobSchema = jobBaseSchema
  .partial()
  .extend({ status: z.enum(['active', 'paused', 'closed']).optional() });

const listJobsQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  search: z.string().max(200).trim().optional(),
  category: z.enum(JOB_CATEGORIES).optional(),
  type: z.enum(JOB_TYPES).optional(),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS).optional(),
  isRemote: z.enum(['true', 'false']).optional(),
  location: z.string().max(100).trim().optional(),
});

const paginationQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
});

const idParamSchema = z.object({ id: objectId() });

// ── Routes ────────────────────────────────────────────────────────────────────

// Public
router.get('/', validateQuery(listJobsQuerySchema), jobController.listJobs);
router.get('/:id', jobController.getJob); // accepts slug — no ObjectId check here

// Employer — authenticated routes
router.get(
  '/employer/mine',
  authenticate,
  requireRole('employer'),
  validateQuery(paginationQuerySchema),
  jobController.getMyJobs,
);

router.post(
  '/',
  authenticate,
  requireRole('employer'),
  jobCreateLimiter,
  validate(createJobSchema),
  jobController.createJob,
);

router.put(
  '/:id',
  authenticate,
  requireRole('employer'),
  validateParams(idParamSchema),
  validate(updateJobSchema),
  jobController.updateJob,
);

// Delete — employer (own) or admin
router.delete(
  '/:id',
  authenticate,
  requireRole('employer', 'admin'),
  validateParams(idParamSchema),
  jobController.deleteJob,
);

export default router;
