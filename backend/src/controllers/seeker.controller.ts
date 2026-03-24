import { Request, Response } from 'express';
import * as seekerService from '../services/seeker.service';
import { ApiError } from '../utils/errors';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await seekerService.getProfile(req.user!.id);
  res.json({ profile });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await seekerService.upsertProfile(req.user!.id, req.body);
  res.json({ profile });
};

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const profile = await seekerService.uploadAvatar(req.user!.id, req.file.buffer);
  res.json({ avatarUrl: profile.avatar });
};

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const profile = await seekerService.uploadResume(
    req.user!.id,
    req.file.buffer,
    req.file.originalname,
  );
  res.json({ resumeUrl: profile.resumeUrl, resumeFileName: profile.resumeFileName });
};

export const getSavedJobs = async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query as Record<string, string>;
  const result = await seekerService.getSavedJobs(req.user!.id, page, limit);
  res.json(result);
};

export const saveJob = async (req: Request, res: Response): Promise<void> => {
  await seekerService.saveJob(req.user!.id, req.params.jobId);
  res.status(201).json({ message: 'Job saved' });
};

export const unsaveJob = async (req: Request, res: Response): Promise<void> => {
  await seekerService.unsaveJob(req.user!.id, req.params.jobId);
  res.status(204).send();
};
