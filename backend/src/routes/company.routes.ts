import { Router } from 'express';
import { z } from 'zod';
import * as companyController from '../controllers/company.controller';
import { validateQuery } from '../middleware/validate';
import { numericString } from '../utils/validators';

const router = Router();

const listQuerySchema = z.object({
  page: numericString(),
  limit: numericString(),
  search: z.string().max(100).trim().optional(),
});

// Public — no auth required
router.get('/', validateQuery(listQuerySchema), companyController.listCompanies);
router.get('/:slug', companyController.getCompanyBySlug);

export default router;
