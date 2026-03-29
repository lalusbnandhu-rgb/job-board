/**
 * Unit tests for notification.service.ts
 * Mongoose model is mocked — no real DB needed.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('../../models/notification.model', () => ({
  NOTIFICATION_TYPES: ['application_status', 'new_applicant', 'system'],
  Notification: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
  },
}));

import { Notification } from '../../models/notification.model';
import * as notificationService from '../../services/notification.service';

const MockNotification = Notification as jest.Mocked<typeof Notification>;

afterEach(() => jest.clearAllMocks());

// ── createNotification ────────────────────────────────────────────────────────

describe('notificationService.createNotification', () => {
  it('creates and returns a notification', async () => {
    const fake = { _id: 'notif-1', userId: 'user-1', type: 'application_status', message: 'msg', isRead: false };
    (MockNotification.create as jest.Mock).mockResolvedValue(fake);

    const result = await notificationService.createNotification({
      userId: 'user-1',
      type: 'application_status',
      message: 'msg',
    });

    expect(MockNotification.create).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'application_status',
      message: 'msg',
    });
    expect(result).toEqual(fake);
  });

  it('creates a notification with an optional link', async () => {
    (MockNotification.create as jest.Mock).mockResolvedValue({});

    await notificationService.createNotification({
      userId: 'user-1',
      type: 'new_applicant',
      message: 'New applicant',
      link: '/employer/jobs/123/applicants',
    });

    expect(MockNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ link: '/employer/jobs/123/applicants' }),
    );
  });

  it('propagates DB errors to the caller', async () => {
    const dbError = new Error('DB write failed');
    (MockNotification.create as jest.Mock).mockRejectedValue(dbError);

    await expect(
      notificationService.createNotification({ userId: 'user-1', type: 'system', message: 'msg' }),
    ).rejects.toThrow('DB write failed');
  });
});

// ── getNotifications ──────────────────────────────────────────────────────────

describe('notificationService.getNotifications', () => {
  const fakeNotifs = [
    { _id: 'n1', userId: 'user-1', message: 'a', isRead: false },
    { _id: 'n2', userId: 'user-1', message: 'b', isRead: true },
  ];

  beforeEach(() => {
    (MockNotification.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(fakeNotifs),
    });
    (MockNotification.countDocuments as jest.Mock).mockResolvedValue(2);
  });

  it('returns paginated notifications for the user', async () => {
    const result = await notificationService.getNotifications('user-1');

    expect(MockNotification.find).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result.notifications).toEqual(fakeNotifs);
    expect(result.pagination.total).toBe(2);
  });

  it('filters by unread when unreadOnly is true', async () => {
    await notificationService.getNotifications('user-1', undefined, undefined, true);

    expect(MockNotification.find).toHaveBeenCalledWith({ userId: 'user-1', isRead: false });
  });

  it('does not add isRead filter when unreadOnly is false', async () => {
    await notificationService.getNotifications('user-1', undefined, undefined, false);

    expect(MockNotification.find).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});

// ── markAsRead ────────────────────────────────────────────────────────────────

describe('notificationService.markAsRead', () => {
  it('marks the notification as read when userId matches', async () => {
    (MockNotification.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'n1', userId: { toString: () => 'user-1' } }),
      }),
    });
    (MockNotification.findByIdAndUpdate as jest.Mock).mockResolvedValue(undefined);

    await expect(notificationService.markAsRead('n1', 'user-1')).resolves.toBeUndefined();

    expect(MockNotification.findByIdAndUpdate).toHaveBeenCalledWith('n1', { isRead: true });
  });

  it('throws 404 if notification not found', async () => {
    (MockNotification.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(notificationService.markAsRead('missing', 'user-1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 if notification belongs to another user', async () => {
    (MockNotification.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'n1', userId: { toString: () => 'other-user' } }),
      }),
    });

    await expect(notificationService.markAsRead('n1', 'user-1')).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

// ── markAllAsRead ─────────────────────────────────────────────────────────────

describe('notificationService.markAllAsRead', () => {
  it('updates all unread notifications for the user', async () => {
    (MockNotification.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 3 });

    await expect(notificationService.markAllAsRead('user-1')).resolves.toBeUndefined();

    expect(MockNotification.updateMany).toHaveBeenCalledWith(
      { userId: 'user-1', isRead: false },
      { isRead: true },
    );
  });

  it('resolves without error even when there are no unread notifications', async () => {
    (MockNotification.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });

    await expect(notificationService.markAllAsRead('user-1')).resolves.toBeUndefined();
  });
});
