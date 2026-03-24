import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await adminService.getPlatformStats();
  res.json({ stats });
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, role, search } = req.query as Record<string, string>;
  const result = await adminService.listUsers(page, limit, role, search);
  res.json(result);
};

export const banUser = async (req: Request, res: Response): Promise<void> => {
  await adminService.setBanStatus(req.params.id, true);
  res.json({ message: 'User banned' });
};

export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  await adminService.setBanStatus(req.params.id, false);
  res.json({ message: 'User unbanned' });
};

export const listJobs = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status, search } = req.query as Record<string, string>;
  const result = await adminService.listAllJobs(page, limit, status, search);
  res.json(result);
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  await adminService.deleteJob(req.params.id);
  res.status(204).send();
};
