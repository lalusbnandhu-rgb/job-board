import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token is required' });
    return;
  }
  const tokens = await authService.refreshTokens(refreshToken);
  res.json(tokens);
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!req.user || !refreshToken) {
    res.status(400).json({ message: 'Missing data' });
    return;
  }
  const result = await authService.logout(req.user.id, refreshToken);
  res.json(result);
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }
  const result = await authService.verifyEmail(token);
  res.json(result);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  res.json(result);
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  res.json(result);
};

export const getMe = async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.json({ user });
};
