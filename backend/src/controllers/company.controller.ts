import { Request, Response } from 'express';
import * as companyService from '../services/company.service';

export const listCompanies = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, search } = req.query as Record<string, string>;
  const result = await companyService.listCompanies(page, limit, search);
  res.json(result);
};

export const getCompanyBySlug = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const result = await companyService.getCompanyBySlug(slug);
  res.json(result);
};
