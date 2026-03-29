import { FilterQuery } from 'mongoose';
import { Notification, INotification, type NotificationType } from '../models/notification.model';
import { ApiError } from '../utils/errors';
import { parsePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination';

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}

export const createNotification = async (
  input: CreateNotificationInput,
): Promise<INotification> => {
  return Notification.create(input);
};

// ── List ──────────────────────────────────────────────────────────────────────

export interface NotificationListResult {
  notifications: INotification[];
  pagination: PaginationMeta;
}

export const getNotifications = async (
  userId: string,
  rawPage?: string,
  rawLimit?: string,
  unreadOnly?: boolean,
): Promise<NotificationListResult> => {
  const { page, limit, skip } = parsePagination(rawPage, rawLimit);
  const filter: FilterQuery<INotification> = { userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<INotification[]>,
    Notification.countDocuments(filter),
  ]);

  return { notifications, pagination: buildPaginationMeta(total, page, limit) };
};

// ── Mark one as read ──────────────────────────────────────────────────────────

export const markAsRead = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  // Two separate queries to distinguish 404 (not found) from 403 (wrong owner)
  const notification = await Notification.findById(notificationId).select('userId').lean();
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (notification.userId.toString() !== userId) {
    throw new ApiError(403, 'You can only update your own notifications');
  }

  await Notification.findByIdAndUpdate(notificationId, { isRead: true });
};

// ── Mark all as read ──────────────────────────────────────────────────────────

export const markAllAsRead = async (userId: string): Promise<void> => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};
