import { Router } from 'express';
import { z } from 'zod';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { applicationLimiter } from '../middleware/rate-limit';
import { objectId, numericString } from '../utils/validators';
import { APPLICATION_STATUSES } from '../models/application.model';

const router = Router();

const applySchema = z.object({
  jobId: objectId(),
  coverLetter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(3000),
});

const applicationQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  status: z.enum(APPLICATION_STATUSES).optional(),
});

const jobIdParamSchema = z.object({ jobId: objectId() });

// Apply to a job (seeker only)
router.post(
  '/',
  authenticate,
  requireRole('seeker'),
  applicationLimiter,
  validate(applySchema),
  applicationController.apply,
);

// Get own applications (seeker only)
router.get(
  '/mine',
  authenticate,
  requireRole('seeker'),
  validateQuery(applicationQuerySchema),
  applicationController.getMyApplications,
);

// Check if already applied (seeker only)
router.get(
  '/check/:jobId',
  authenticate,
  requireRole('seeker'),
  validateParams(jobIdParamSchema),
  applicationController.checkApplied,
);

export default router;
