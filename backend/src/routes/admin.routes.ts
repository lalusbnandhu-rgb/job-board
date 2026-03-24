import { Router } from 'express';
import { z } from 'zod';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { validateQuery, validateParams } from '../middleware/validate';
import { objectId, numericString } from '../utils/validators';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

const listQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  role: z.enum(['seeker', 'employer', 'admin']).optional(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
  search: z.string().max(200).trim().optional(),
});

const idParamSchema = z.object({ id: objectId() });

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', validateQuery(listQuerySchema), adminController.listUsers);
router.patch('/users/:id/ban', validateParams(idParamSchema), adminController.banUser);
router.patch('/users/:id/unban', validateParams(idParamSchema), adminController.unbanUser);

// ── Jobs ──────────────────────────────────────────────────────────────────────
router.get('/jobs', validateQuery(listQuerySchema), adminController.listJobs);
router.delete('/jobs/:id', validateParams(idParamSchema), adminController.deleteJob);

export default router;
