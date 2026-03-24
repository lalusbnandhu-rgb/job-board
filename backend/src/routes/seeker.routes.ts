import { Router } from 'express';
import { z } from 'zod';
import * as seekerController from '../controllers/seeker.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { uploadAvatar, uploadResume } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rate-limit';
import { objectId, numericString } from '../utils/validators';
import { JOB_EXPERIENCE_LEVELS } from '../constants/jobs';

const router = Router();

// All seeker routes require authentication + seeker role
router.use(authenticate, requireRole('seeker'));

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  headline: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string().max(40)).max(30).optional(),
  experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS).optional(),
});

const paginationQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
});

const jobIdParamSchema = z.object({ jobId: objectId() });

router.get('/profile', seekerController.getProfile);
router.put('/profile', validate(updateProfileSchema), seekerController.updateProfile);

// File uploads — rate limited
router.post('/avatar', uploadLimiter, uploadAvatar, seekerController.uploadAvatar);
router.post('/resume', uploadLimiter, uploadResume, seekerController.uploadResume);

// Saved jobs — ObjectId validated on mutation routes
router.get('/saved-jobs', validateQuery(paginationQuerySchema), seekerController.getSavedJobs);
router.post('/saved-jobs/:jobId', validateParams(jobIdParamSchema), seekerController.saveJob);
router.delete('/saved-jobs/:jobId', validateParams(jobIdParamSchema), seekerController.unsaveJob);

export default router;
