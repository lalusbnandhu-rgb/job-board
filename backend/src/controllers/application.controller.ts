import { Request, Response } from 'express';
import * as applicationService from '../services/application.service';

export const apply = async (req: Request, res: Response): Promise<void> => {
  const { jobId, coverLetter } = req.body;
  const application = await applicationService.apply(req.user!.id, jobId, coverLetter);
  res.status(201).json({ application });
};

export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status } = req.query as Record<string, string>;
  const result = await applicationService.getMyApplications(
    req.user!.id,
    page,
    limit,
    status as Parameters<typeof applicationService.getMyApplications>[3],
  );
  res.json(result);
};

export const checkApplied = async (req: Request, res: Response): Promise<void> => {
  const applied = await applicationService.hasApplied(req.user!.id, req.params.jobId);
  res.json({ applied });
};
