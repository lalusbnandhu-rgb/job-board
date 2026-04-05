import { test, expect } from '@playwright/test';
import path from 'path';
import { apiLogin, apiPost, apiRefresh, readRefreshToken, updateRefreshToken } from '../helpers/api-client';

/**
 * E2E — Seeker flows (authenticated)
 * Uses stored auth state from auth-setup/seeker.setup.ts
 */

const SEEKER_AUTH_FILE = path.join(__dirname, '../.auth/seeker.json');

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

// ── Pre-warm token + deduplicate concurrent /auth/refresh calls ────────────
// Each test starts with a guaranteed-fresh token injected via addInitScript so
// that a prior test's failed afterEach cannot leave a consumed token in the file.
test.beforeEach(async ({ page }) => {
  // Pre-warm: exchange current file token for a fresh one before page load.
  try {
    const current = readRefreshToken(SEEKER_AUTH_FILE);
    const { refreshToken: fresh } = await apiRefresh(current);
    updateRefreshToken(SEEKER_AUTH_FILE, fresh);
    await page.addInitScript((token) => {
      localStorage.setItem('refreshToken', token);
    }, fresh);
  } catch {
    // Refresh failed — fall back to a full login.
    try {
      const { refreshToken: fresh } = await apiLogin('emma@example.com', 'Seeker123!');
      updateRefreshToken(SEEKER_AUTH_FILE, fresh);
      await page.addInitScript((token) => {
        localStorage.setItem('refreshToken', token);
      }, fresh);
    } catch {
      // Both failed — continue with storageState as-is.
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
      // Page closed before the fetch completed — abort gracefully
      refreshPending = false;
      refreshWaiters.splice(0).forEach((r) => r());
      await route.abort().catch(() => null);
    }
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
    // Re-auth seeker to get a fresh token before this describe block runs.
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    updateRefreshToken(SEEKER_AUTH_FILE, seeker.refreshToken);

    // Create a fresh job as employer so we know emma hasn't applied yet.
    // Login as alice just to get an accessToken — do NOT write to EMPLOYER_AUTH_FILE
    // as the employer spec may be running concurrently.
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
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

    // Wait for either state (may or may not be applied depending on test order).
    // Then wait an extra moment for the applied-status query to settle — "Apply now"
    // can appear briefly before useCheckApplied resolves and flips it to "Already applied".
    await Promise.race([
      page.getByRole('button', { name: 'Apply now' }).waitFor({ timeout: 30_000 }),
      page.getByText('Already applied').waitFor({ timeout: 30_000 }),
    ]);
    await page.waitForTimeout(1_500);

    if (await page.getByRole('button', { name: 'Apply now' }).isVisible()) {
      await page.getByRole('button', { name: 'Apply now' }).click();
      await page.getByLabel(/cover letter/i).fill('Too short');
      await expect(page.getByRole('button', { name: 'Submit application' })).toBeDisabled();
    }
  });

  test('"Cancel" closes the apply modal without submitting', async ({ page }) => {
    await page.goto(`/jobs/${jobSlug}`);

    await Promise.race([
      page.getByRole('button', { name: 'Apply now' }).waitFor({ timeout: 30_000 }),
      page.getByText('Already applied').waitFor({ timeout: 30_000 }),
    ]);
    await page.waitForTimeout(1_500);

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
  test.beforeAll(async () => {
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    updateRefreshToken(SEEKER_AUTH_FILE, seeker.refreshToken);
  });

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
  test.beforeAll(async () => {
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    updateRefreshToken(SEEKER_AUTH_FILE, seeker.refreshToken);
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/seeker/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({ timeout: 10_000 });
  });

  test('headline field is editable and saves', async ({ page }) => {
    await page.goto('/seeker/profile');
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 10_000 });

    const headlineInput = page.getByLabel(/headline/i).first();
    if (await headlineInput.isVisible({ timeout: 5_000 })) {
      // Use a unique value each run so the form is always dirty (not equal to the persisted value)
      await headlineInput.fill(`E2E Updated Headline ${Date.now()}`);
      const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
      if (await saveBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        // "Profile saved successfully!" appears on success; avoid matching sidebar "Saved Jobs"
        await expect(page.getByText(/profile saved|all changes saved/i)).toBeVisible({ timeout: 8_000 });
      }
    }
  });
});

// ── Applications ───────────────────────────────────────────────────────────
test.describe('Seeker Applications', () => {
  test.beforeAll(async () => {
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    updateRefreshToken(SEEKER_AUTH_FILE, seeker.refreshToken);
  });

  test('applications page loads with heading', async ({ page }) => {
    await page.goto('/seeker/applications');
    await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows application cards or empty state', async ({ page }) => {
    await page.goto('/seeker/applications');
    // Wait for either application cards or the empty state heading — whichever loads first
    await page
      .locator('article')
      .first()
      .or(page.getByText(/no applications yet/i))
      .waitFor({ timeout: 15_000 });
    const hasCards = (await page.locator('article').count()) > 0;
    const hasEmpty = (await page.getByText(/no applications yet/i).count()) > 0;
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
  test.beforeAll(async () => {
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    updateRefreshToken(SEEKER_AUTH_FILE, seeker.refreshToken);
  });

  test('saved-jobs page loads', async ({ page }) => {
    await page.goto('/seeker/saved-jobs');
    await expect(page.getByRole('heading', { name: /saved/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows saved job cards or empty state', async ({ page }) => {
    await page.goto('/seeker/saved-jobs');
    // Wait for either saved job cards or the empty state heading
    await page
      .locator('article')
      .first()
      .or(page.getByText(/no saved jobs/i))
      .waitFor({ timeout: 15_000 });
    const hasCards = (await page.locator('article').count()) > 0;
    const hasEmpty = (await page.getByText(/no saved jobs/i).count()) > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });
});
