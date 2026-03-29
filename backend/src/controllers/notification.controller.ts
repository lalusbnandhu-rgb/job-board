import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, unread } = req.query as Record<string, string>;
  const { notifications, pagination } = await notificationService.getNotifications(
    req.user!.id,
    page,
    limit,
    unread === 'true',
  );
  res.json({ notifications, pagination });
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  await notificationService.markAsRead(req.params.id, req.user!.id);
  res.json({ success: true, message: 'Notification marked as read' });
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  await notificationService.markAllAsRead(req.user!.id);
  res.json({ success: true, message: 'All notifications marked as read' });
};
