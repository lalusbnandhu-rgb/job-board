import { Router } from 'express';
import { z } from 'zod';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validate';
import { objectId, numericString } from '../utils/validators';

const router = Router();

router.use(authenticate);

const listQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  unread: z.enum(['true', 'false']).optional(),
});

const idParamSchema = z.object({ id: objectId() });

router.get('/', validateQuery(listQuerySchema), notificationController.getNotifications);
// /read-all must be declared before /:id/read — otherwise Express matches 'read-all' as an :id
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validateParams(idParamSchema), notificationController.markAsRead);

export default router;
