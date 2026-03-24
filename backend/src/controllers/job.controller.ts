import { Request, Response } from 'express';
import * as jobService from '../services/job.service';

// ── Public ────────────────────────────────────────────────────────────────────

export const listJobs = async (req: Request, res: Response): Promise<void> => {
  const result = await jobService.listJobs(req.query as jobService.ListJobsQuery);
  res.json(result);
};

export const getJob = async (req: Request, res: Response): Promise<void> => {
  // Support lookup by MongoDB ID or slug
  const { id } = req.params;
  const job = id.match(/^[0-9a-fA-F]{24}$/)
    ? await jobService.getJobById(id)
    : await jobService.getJobBySlug(id);
  res.json({ job });
};

// ── Employer ──────────────────────────────────────────────────────────────────

export const getMyJobs = async (req: Request, res: Response): Promise<void> => {
  const result = await jobService.getEmployerJobs(
    req.user!.id,
    req.query as jobService.ListJobsQuery,
  );
  res.json(result);
};

export const createJob = async (req: Request, res: Response): Promise<void> => {
  const job = await jobService.createJob(req.user!.id, req.body);
  res.status(201).json({ job });
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  const job = await jobService.updateJob(req.params.id, req.user!.id, req.body);
  res.json({ job });
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  await jobService.deleteJob(req.params.id, req.user!.id, req.user!.role);
  res.status(204).send();
};
