/**
 * Integration tests — /api/notifications
 * Real MongoDB (via MongoMemoryServer).
 */

import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../app';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers/db';
import { createUser, loginAs } from './helpers/factories';
import { Notification } from '../../models/notification.model';

beforeAll(() => connectTestDB());
afterAll(() => disconnectTestDB());
beforeEach(() => clearCollections());

const BASE = '/api/notifications';

async function seedNotification(userId: string, isRead = false) {
  return Notification.create({
    userId,
    type: 'system',
    message: 'Test notification',
    link: '/seeker/applications',
    isRead,
  });
}

// ── GET / ─────────────────────────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('401 — unauthenticated', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(401);
  });

  it('200 — returns paginated notifications for the authenticated user', async () => {
    const { userId, accessToken } = await loginAs(
      (await createUser('seeker@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );
    await seedNotification(userId);
    await seedNotification(userId);

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('200 — ?unread=true filters to unread only', async () => {
    const { userId, accessToken } = await loginAs(
      (await createUser('seeker2@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );
    await seedNotification(userId, false); // unread
    await seedNotification(userId, true);  // read

    const res = await request(app)
      .get(`${BASE}?unread=true`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].isRead).toBe(false);
  });

  it('200 — does not return another user\'s notifications', async () => {
    const otherUser = await createUser('other@test.com', 'Password1!', 'seeker');
    await seedNotification(otherUser.userId);

    const { accessToken } = await loginAs(
      (await createUser('me@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
  });
});

// ── PATCH /read-all ───────────────────────────────────────────────────────────

describe('PATCH /api/notifications/read-all', () => {
  it('401 — unauthenticated', async () => {
    const res = await request(app).patch(`${BASE}/read-all`);
    expect(res.status).toBe(401);
  });

  it('200 — marks all unread notifications as read', async () => {
    const { userId, accessToken } = await loginAs(
      (await createUser('seeker3@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );
    await seedNotification(userId, false);
    await seedNotification(userId, false);

    const res = await request(app)
      .patch(`${BASE}/read-all`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const unread = await Notification.countDocuments({ userId, isRead: false });
    expect(unread).toBe(0);
  });
});

// ── PATCH /:id/read ───────────────────────────────────────────────────────────

describe('PATCH /api/notifications/:id/read', () => {
  it('401 — unauthenticated', async () => {
    const id = new Types.ObjectId().toString();
    const res = await request(app).patch(`${BASE}/${id}/read`);
    expect(res.status).toBe(401);
  });

  it('200 — marks a single notification as read', async () => {
    const { userId, accessToken } = await loginAs(
      (await createUser('seeker4@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );
    const notif = await seedNotification(userId, false);

    const res = await request(app)
      .patch(`${BASE}/${notif._id.toString()}/read`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Notification.findById(notif._id);
    expect(updated!.isRead).toBe(true);
  });

  it('404 — notification not found', async () => {
    const { accessToken } = await loginAs(
      (await createUser('seeker5@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );
    const fakeId = new Types.ObjectId().toString();

    const res = await request(app)
      .patch(`${BASE}/${fakeId}/read`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it('403 — cannot mark another user\'s notification as read', async () => {
    const owner = await createUser('owner@test.com', 'Password1!', 'seeker');
    const notif = await seedNotification(owner.userId, false);

    const { accessToken } = await loginAs(
      (await createUser('attacker@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );

    const res = await request(app)
      .patch(`${BASE}/${notif._id.toString()}/read`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('400 — invalid ObjectId returns validation error', async () => {
    const { accessToken } = await loginAs(
      (await createUser('seeker6@test.com', 'Password1!', 'seeker')).email,
      'Password1!',
    );

    const res = await request(app)
      .patch(`${BASE}/not-a-valid-id/read`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });
});
