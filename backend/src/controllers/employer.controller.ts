import { Request, Response } from 'express';
import * as employerService from '../services/employer.service';
import * as jobService from '../services/job.service';
import { ApiError } from '../utils/errors';

// ── Company ───────────────────────────────────────────────────────────────────

export const getCompany = async (req: Request, res: Response): Promise<void> => {
  const company = await employerService.getCompany(req.user!.id);
  res.json({ company });
};

export const upsertCompany = async (req: Request, res: Response): Promise<void> => {
  const company = await employerService.upsertCompany(req.user!.id, req.body);
  res.json({ company });
};

export const uploadCompanyLogo = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const company = await employerService.uploadCompanyLogo(req.user!.id, req.file.buffer);
  res.json({ logoUrl: company.logo });
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const stats = await employerService.getDashboardStats(req.user!.id);
  res.json({ stats });
};

// ── My jobs ───────────────────────────────────────────────────────────────────

export const getMyJobs = async (req: Request, res: Response): Promise<void> => {
  const result = await jobService.getEmployerJobs(req.user!.id, req.query as Record<string, string>);
  res.json(result);
};

// ── Job applications ──────────────────────────────────────────────────────────

export const getJobApplications = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;
  const { page, limit, status } = req.query as Record<string, string>;
  const result = await employerService.getJobApplications(
    jobId,
    req.user!.id,
    page,
    limit,
    status as Parameters<typeof employerService.getJobApplications>[4],
  );
  res.json(result);
};

export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  const { applicationId } = req.params;
  const { status, employerNote } = req.body;
  await employerService.updateApplicationStatus(applicationId, req.user!.id, status, employerNote);
  res.json({ message: 'Application status updated' });
};
