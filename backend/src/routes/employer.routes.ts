import { Router } from 'express';
import { z } from 'zod';
import * as employerController from '../controllers/employer.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { uploadAvatar } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rate-limit';
import { objectId, numericString } from '../utils/validators';
import { COMPANY_SIZES } from '../models/company.model';
import { APPLICATION_STATUSES } from '../models/application.model';

const router = Router();

// All employer routes require authentication + employer role
router.use(authenticate, requireRole('employer'));

// ── Company profile ───────────────────────────────────────────────────────────

const upsertCompanySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
  industry: z.string().max(80).optional(),
  size: z.enum(COMPANY_SIZES).optional(),
  location: z.string().max(100).optional(),
});

router.get('/company', employerController.getCompany);
router.put('/company', validate(upsertCompanySchema), employerController.upsertCompany);
router.post('/company/logo', uploadLimiter, uploadAvatar, employerController.uploadCompanyLogo);

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get('/dashboard', employerController.getDashboardStats);

// ── My jobs ───────────────────────────────────────────────────────────────────

const myJobsQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
});

router.get('/jobs', validateQuery(myJobsQuerySchema), employerController.getMyJobs);

// ── Job applications ──────────────────────────────────────────────────────────

const jobIdParamSchema = z.object({ jobId: objectId() });
const applicationIdParamSchema = z.object({ applicationId: objectId() });

const applicationsQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  status: z.enum(APPLICATION_STATUSES).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  employerNote: z.string().max(500).optional(),
});

router.get(
  '/jobs/:jobId/applications',
  validateParams(jobIdParamSchema),
  validateQuery(applicationsQuerySchema),
  employerController.getJobApplications,
);

router.patch(
  '/applications/:applicationId/status',
  validateParams(applicationIdParamSchema),
  validate(updateStatusSchema),
  employerController.updateApplicationStatus,
);

export default router;
