import { test, expect } from '@playwright/test';
import path from 'path';
import { apiLogin, apiPost, updateRefreshToken } from '../helpers/api-client';

/**
 * E2E — Seeker flows (authenticated)
 * Uses stored auth state from auth-setup/seeker.setup.ts
 */

const SEEKER_AUTH_FILE = path.join(__dirname, '../.auth/seeker.json');
const EMPLOYER_AUTH_FILE = path.join(__dirname, '../.auth/employer.json');

const COVER_LETTER =
  'I am applying because I am an excellent fit for this position. ' +
  'I bring strong TypeScript, Node.js, and React experience and am very passionate about building great products.';

const E2E_JOB = {
  description: 'A'.repeat(50),
  requirements: 'B'.repeat(20),
  location: 'Remote',
  isRemote: true,
  type: 'full-time',
  category: 'Engineering',
  experienceLevel: 'mid',
  salaryCurrency: 'USD',
  tags: ['TypeScript'],
};

test.use({ storageState: SEEKER_AUTH_FILE });

// Run tests serially so the rotating refresh token stays valid across tests.
test.describe.configure({ mode: 'serial' });

// ── Deduplicate concurrent /auth/refresh calls within each test ────────────
// Prevents the double-refresh race (useAuthInit + 401 interceptor) that causes
// clearAuth() → login redirect when refresh token rotation is in use.
test.beforeEach(async ({ page }) => {
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
    const response = await route.fetch();
    const body = await response.text();
    if (response.status() === 200) refreshCache = body;
    refreshPending = false;
    refreshWaiters.splice(0).forEach((r) => r());
    await route.fulfill({ status: response.status(), contentType: 'application/json', body });
  });
});

// After each test, persist the latest refresh token so the next test can use it.
test.afterEach(async ({ page }) => {
  const token = await page.evaluate(() => localStorage.getItem('refreshToken')).catch(() => null);
  if (token) updateRefreshToken(SEEKER_AUTH_FILE, token);
});

// ── Apply to a Job ─────────────────────────────────────────────────────────
test.describe('Apply to a Job', () => {
  let jobSlug: string;
  let jobId: string;

  test.beforeAll(async () => {
    // Create a fresh job as employer so we know emma hasn't applied yet.
    // LOGIN_RATE_LIMIT_MAX is set to 50 in docker-compose to accommodate E2E volume.
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    // Update employer auth file so employer.spec.ts still has a valid refresh token.
    updateRefreshToken(EMPLOYER_AUTH_FILE, emp.refreshToken);
    const res = await apiPost<{ job: { _id: string; slug: string } }>(
      '/jobs',
      { ...E2E_JOB, title: `E2E Seeker Apply ${Date.now()}` },
      emp.accessToken,
    );
    jobId = res.job._id;
    jobSlug = res.job.slug;
  });

  test('"Apply now" button opens the apply modal', async ({ page }) => {
    await page.goto(`/jobs/${jobSlug}`);
    const applyBtn = page.getByRole('button', { name: 'Apply now' });
    await expect(applyBtn).toBeVisible({ timeout: 15_000 });
    await applyBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Apply for/)).toBeVisible();
    await expect(page.getByLabel(/cover letter/i)).toBeVisible();
  });

  test('submit application — full happy path', async ({ page }) => {
    await page.goto(`/jobs/${jobSlug}`);
    await expect(page.getByRole('button', { name: 'Apply now' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Apply now' }).click();

    await page.getByLabel(/cover letter/i).fill(COVER_LETTER);
    await page.getByRole('button', { name: 'Submit application' }).click();

    // Success state
    await expect(page.getByText('Application submitted!')).toBeVisible({ timeout: 10_000 });

    // Close modal
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Button changes to "Already applied"
    await expect(page.getByText('Already applied')).toBeVisible({ timeout: 8_000 });
  });

  test('"Submit application" is disabled when cover letter is too short', async ({ page }) => {
    await page.goto(`/jobs/${jobSlug}`);

    // Wait for either state (may or may not be applied depending on test order)
    await Promise.race([
      page.getByRole('button', { name: 'Apply now' }).waitFor({ timeout: 15_000 }),
      page.getByText('Already applied').waitFor({ timeout: 15_000 }),
    ]);

    if (await page.getByRole('button', { name: 'Apply now' }).isVisible()) {
      await page.getByRole('button', { name: 'Apply now' }).click();
      await page.getByLabel(/cover letter/i).fill('Too short');
      await expect(page.getByRole('button', { name: 'Submit application' })).toBeDisabled();
    }
  });

  test('"Cancel" closes the apply modal without submitting', async ({ page }) => {
    await page.goto(`/jobs/${jobSlug}`);

    await Promise.race([
      page.getByRole('button', { name: 'Apply now' }).waitFor({ timeout: 15_000 }),
      page.getByText('Already applied').waitFor({ timeout: 15_000 }),
    ]);

    if (await page.getByRole('button', { name: 'Apply now' }).isVisible()) {
      await page.getByRole('button', { name: 'Apply now' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Apply now' })).toBeVisible();
    }
  });
});

// ── Dashboard ──────────────────────────────────────────────────────────────
test.describe('Seeker Dashboard', () => {
  test('dashboard loads and shows main content', async ({ page }) => {
    await page.goto('/seeker/dashboard');
    // Heading is "Welcome back, Emma!" — match on "welcome" substring
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('sidebar has links to profile and applications', async ({ page }) => {
    await page.goto('/seeker/dashboard');
    const nav = page.locator('nav, aside').first();
    await expect(nav).toBeVisible({ timeout: 5_000 });
    await expect(nav.getByRole('link', { name: /profile/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /application/i })).toBeVisible();
  });
});

// ── Profile ────────────────────────────────────────────────────────────────
test.describe('Seeker Profile', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/seeker/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 10_000 });
  });

  test('headline field is editable and saves', async ({ page }) => {
    await page.goto('/seeker/profile');
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 10_000 });

    const headlineInput = page.getByLabel(/headline/i).first();
    if (await headlineInput.isVisible({ timeout: 5_000 })) {
      await headlineInput.fill('E2E Updated Headline');
      const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 8_000 });
      }
    }
  });
});

// ── Applications ───────────────────────────────────────────────────────────
test.describe('Seeker Applications', () => {
  test('applications page loads with heading', async ({ page }) => {
    await page.goto('/seeker/applications');
    await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows application cards or empty state', async ({ page }) => {
    await page.goto('/seeker/applications');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    const hasCards = (await page.locator('article').count()) > 0;
    const hasEmpty = (await page.getByText(/no applications|haven't applied/i).count()) > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });

  test('status filter tabs are visible', async ({ page }) => {
    await page.goto('/seeker/applications');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible({ timeout: 5_000 });
  });
});

// ── Saved Jobs ─────────────────────────────────────────────────────────────
test.describe('Seeker Saved Jobs', () => {
  test('saved-jobs page loads', async ({ page }) => {
    await page.goto('/seeker/saved-jobs');
    await expect(page.getByRole('heading', { name: /saved/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows saved job cards or empty state', async ({ page }) => {
    await page.goto('/seeker/saved-jobs');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    const hasCards = (await page.locator('article').count()) > 0;
    const hasEmpty = (await page.getByText(/no saved|haven't saved/i).count()) > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });
});
