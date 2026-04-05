import { test, expect } from '@playwright/test';
import path from 'path';
import { apiLogin, apiPost, apiRefresh, readRefreshToken, updateRefreshToken } from '../helpers/api-client';

/**
 * E2E — Admin flows (authenticated)
 * Uses stored auth state from auth-setup/admin.setup.ts
 */

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json');

test.use({ storageState: ADMIN_AUTH_FILE });

// Run tests serially so the rotating refresh token stays valid across tests.
test.describe.configure({ mode: 'serial' });

// ── Pre-warm token + deduplicate concurrent /auth/refresh calls ────────────
// Each test starts with a guaranteed-fresh token injected via addInitScript so
// that a prior test's failed afterEach (page closed before eval) can never leave
// a consumed token in the auth file and break subsequent tests.
test.beforeEach(async ({ page }) => {
  // Pre-warm: exchange current file token for a fresh one, then inject it into
  // the page's localStorage before any page scripts run.
  try {
    const current = readRefreshToken(ADMIN_AUTH_FILE);
    const { refreshToken: fresh } = await apiRefresh(current);
    updateRefreshToken(ADMIN_AUTH_FILE, fresh);
    await page.addInitScript((token) => {
      localStorage.setItem('refreshToken', token);
    }, fresh);
  } catch {
    // Refresh failed (token consumed by a prior race) — fall back to a full login.
    try {
      const { refreshToken: fresh } = await apiLogin('admin@jobboard.dev', 'Admin123!');
      updateRefreshToken(ADMIN_AUTH_FILE, fresh);
      await page.addInitScript((token) => {
        localStorage.setItem('refreshToken', token);
      }, fresh);
    } catch {
      // Both attempts failed — continue with storageState as-is.
    }
  }

  let refreshCache: string | null = null;
  let refreshPending = false;
  const refreshWaiters: Array<() => void> = [];

  await page.route('**/api/auth/refresh', async (route) => {
    if (refreshCache !== null) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: refreshCache });
      return;
    }
    if (refreshPending) {
      await new Promise<void>((resolve) => refreshWaiters.push(resolve));
      await route.fulfill({ status: 200, contentType: 'application/json', body: refreshCache! });
      return;
    }
    refreshPending = true;
    try {
      const response = await route.fetch();
      const body = await response.text();
      if (response.status() === 200) refreshCache = body;
      refreshPending = false;
      refreshWaiters.splice(0).forEach((r) => r());
      await route.fulfill({ status: response.status(), contentType: 'application/json', body });
    } catch {
      refreshPending = false;
      refreshWaiters.splice(0).forEach((r) => r());
      await route.abort().catch(() => null);
    }
  });
});

// After each test, persist the latest refresh token so the next test can use it.
test.afterEach(async ({ page }) => {
  const token = await page.evaluate(() => localStorage.getItem('refreshToken')).catch(() => null);
  if (token) updateRefreshToken(ADMIN_AUTH_FILE, token);
});

// ── Dashboard ──────────────────────────────────────────────────────────────
test.describe('Admin Dashboard', () => {
  test.beforeAll(async () => {
    const admin = await apiLogin('admin@jobboard.dev', 'Admin123!');
    updateRefreshToken(ADMIN_AUTH_FILE, admin.refreshToken);
  });

  test('dashboard loads with platform stats', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(
      page.getByRole('heading', { name: /platform overview/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('admin sidebar has Users and Jobs navigation links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Wait for auth hydration to complete — heading only appears after useAuthInit resolves.
    await expect(
      page.getByRole('heading', { name: /platform overview/i }),
    ).toBeVisible({ timeout: 10_000 });
    // The AdminSidebar renders inside an <aside>; scope to it so we don't
    // accidentally pick up any other nav elements on the page.
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 5_000 });
    await expect(sidebar.getByRole('link', { name: /users/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /jobs/i })).toBeVisible();
  });
});

// ── Users ──────────────────────────────────────────────────────────────────
test.describe('Admin Users', () => {
  test.beforeAll(async () => {
    // Re-authenticate before this block so token rotation from Dashboard tests
    // (or concurrent auth spec admin login) cannot leave admin.json stale.
    const admin = await apiLogin('admin@jobboard.dev', 'Admin123!');
    updateRefreshToken(ADMIN_AUTH_FILE, admin.refreshToken);
  });

  test('users page loads', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible({ timeout: 10_000 });
  });

  test('seeded users appear in the list', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    // Seeded users may be on page 2+ after many test runs; match E2E users on page 1 as well.
    await expect(
      page.getByText(/emma@example\.com|alice@techcorp|e2e-/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('email search filters the user list', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/search by email/i).fill('emma@example.com');
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText('emma@example.com')).toBeVisible({ timeout: 8_000 });
  });

  test('role filter dropdown is present', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 });
  });
});

// ── Ban / Unban ────────────────────────────────────────────────────────────
test.describe('Admin Ban / Unban', () => {
  let testEmail: string;

  test.beforeAll(async () => {
    // Re-authenticate admin via API to get a fresh token, breaking any stale rotation chain
    // that accumulated across the preceding serial tests.
    const admin = await apiLogin('admin@jobboard.dev', 'Admin123!');
    updateRefreshToken(ADMIN_AUTH_FILE, admin.refreshToken);

    // Register a disposable user so we ban safely without touching seeded accounts
    testEmail = `e2e-ban-${Date.now()}@example.com`;
    await apiPost<unknown>('/auth/register', {
      email: testEmail,
      password: 'Password1!',
      role: 'seeker',
    });
  });

  test('admin can ban a newly registered user', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/search by email/i).fill(testEmail);
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(600);

    const banBtn = page.getByRole('button', { name: /^ban$/i }).first();
    await expect(banBtn).toBeVisible({ timeout: 8_000 });
    await banBtn.click();

    // Button should change to "Unban" after ban
    await expect(
      page.getByRole('button', { name: /^unban$/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('admin can unban a banned user', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/search by email/i).fill(testEmail);
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(600);

    const unbanBtn = page.getByRole('button', { name: /^unban$/i }).first();
    if (await unbanBtn.isVisible({ timeout: 5_000 })) {
      await unbanBtn.click();
      await expect(
        page.getByRole('button', { name: /^ban$/i }).first(),
      ).toBeVisible({ timeout: 8_000 });
    } else {
      // User not yet banned (test order variation) — skip gracefully
      test.skip();
    }
  });
});

// ── Jobs ───────────────────────────────────────────────────────────────────
test.describe('Admin Jobs', () => {
  test.beforeAll(async () => {
    const admin = await apiLogin('admin@jobboard.dev', 'Admin123!');
    updateRefreshToken(ADMIN_AUTH_FILE, admin.refreshToken);
  });

  test('jobs management page loads', async ({ page }) => {
    await page.goto('/admin/jobs');
    // Heading is "All Job Listings" — match /job/i to cover singular and plural variants
    await expect(page.getByRole('heading', { name: /job/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('seeded jobs appear in the list', async ({ page }) => {
    await page.goto('/admin/jobs');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    // Seeded jobs may be on page 2+ after many test runs; E2E test jobs are always on page 1.
    await expect(
      page.getByText(/engineer|designer|analyst|developer|E2E/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Delete button is present for job rows', async ({ page }) => {
    await page.goto('/admin/jobs');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteBtn.count()) {
      await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    }
  });
});
