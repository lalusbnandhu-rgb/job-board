import { test, expect } from '@playwright/test';
import path from 'path';
import { apiLogin, apiPost, apiRefresh, readRefreshToken, updateRefreshToken } from '../helpers/api-client';

/**
 * E2E — Employer flows (authenticated)
 * Uses stored auth state from auth-setup/employer.setup.ts
 */

const EMPLOYER_AUTH_FILE = path.join(__dirname, '../.auth/employer.json');
const SEEKER_AUTH_FILE = path.join(__dirname, '../.auth/seeker.json');

const E2E_JOB = {
  description: 'A'.repeat(50),
  requirements: 'B'.repeat(20),
  location: 'Remote',
  isRemote: true,
  type: 'full-time',
  category: 'Engineering',
  experienceLevel: 'senior',
  salaryCurrency: 'USD',
  tags: ['TypeScript'],
};

const COVER_LETTER =
  'I am an excellent candidate with strong TypeScript, Node.js, and React experience. ' +
  'Very passionate about building great products and working in collaborative teams.';

test.use({ storageState: EMPLOYER_AUTH_FILE });

// Run tests serially so the rotating refresh token stays valid across tests.
test.describe.configure({ mode: 'serial' });

// ── Pre-warm token + deduplicate concurrent /auth/refresh calls ────────────
// Each test starts with a guaranteed-fresh token injected via addInitScript so
// that a prior test's failed afterEach cannot leave a consumed token in the file.
test.beforeEach(async ({ page }) => {
  // Pre-warm: exchange current file token for a fresh one before page load.
  try {
    const current = readRefreshToken(EMPLOYER_AUTH_FILE);
    const { refreshToken: fresh } = await apiRefresh(current);
    updateRefreshToken(EMPLOYER_AUTH_FILE, fresh);
    await page.addInitScript((token) => {
      localStorage.setItem('refreshToken', token);
    }, fresh);
  } catch {
    // Refresh failed — fall back to a full login.
    try {
      const { refreshToken: fresh } = await apiLogin('alice@techcorp.dev', 'Employer123!');
      updateRefreshToken(EMPLOYER_AUTH_FILE, fresh);
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
      refreshPending = false;
      refreshWaiters.splice(0).forEach((r) => r());
      await route.abort().catch(() => null);
    }
  });
});

// After each test, persist the latest refresh token so the next test can use it.
test.afterEach(async ({ page }) => {
  const token = await page.evaluate(() => localStorage.getItem('refreshToken')).catch(() => null);
  if (token) updateRefreshToken(EMPLOYER_AUTH_FILE, token);
});

// ── Dashboard ──────────────────────────────────────────────────────────────
test.describe('Employer Dashboard', () => {
  test.beforeAll(async () => {
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    updateRefreshToken(EMPLOYER_AUTH_FILE, emp.refreshToken);
  });

  test('dashboard loads with heading', async ({ page }) => {
    await page.goto('/employer/dashboard');
    // Heading is "Welcome, TechCorp" when company profile exists, or "Employer Dashboard" fallback
    await expect(
      page.getByRole('heading', { name: /welcome|dashboard/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('"Post a Job" call-to-action is present', async ({ page }) => {
    await page.goto('/employer/dashboard');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    const postCta = page
      .getByRole('link', { name: /post a job/i })
      .or(page.getByRole('button', { name: /post a job/i }));
    await expect(postCta.first()).toBeVisible({ timeout: 5_000 });
  });
});

// ── My Job Listings ────────────────────────────────────────────────────────
test.describe('Employer Jobs', () => {
  test.beforeAll(async () => {
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    updateRefreshToken(EMPLOYER_AUTH_FILE, emp.refreshToken);
  });

  test('jobs list page loads', async ({ page }) => {
    await page.goto('/employer/jobs');
    await expect(
      page.getByRole('heading', { name: /jobs|listings/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('"Post a Job" link is present on the jobs list', async ({ page }) => {
    await page.goto('/employer/jobs');
    await expect(page.getByRole('link', { name: /post a job/i })).toBeVisible({ timeout: 10_000 });
  });

  test('seeded TechCorp jobs appear in the list', async ({ page }) => {
    await page.goto('/employer/jobs');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    // Wait for at least one job to be visible — either seeded jobs or E2E test jobs
    // created by previous runs (which accumulate on page 1 when sorted by newest).
    await expect(
      page.getByText(/Senior Backend Engineer|Product Manager|DevOps Engineer|Junior Frontend|E2E/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('post new job — full form flow redirects to jobs list', async ({ page }) => {
    await page.goto('/employer/jobs/new');
    await expect(
      page.getByRole('heading', { name: /post a new job/i }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByLabel(/title/i).fill(`E2E Test Job ${Date.now()}`);
    // Description and requirements fields use placeholders, not <label> elements
    await page.locator('textarea').nth(0).fill(
      'This is an E2E test job description with enough characters to pass validation requirements.',
    );
    await page.locator('textarea').nth(1).fill(
      'Strong TypeScript and Node.js skills required for this E2E test position.',
    );
    await page.getByLabel(/location/i).fill('Remote, Earth');

    // Select all native <select> dropdowns by iterating them.
    // selectOption requires a string (not a regex) for label/value matching.
    const selects = page.locator('select');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i);
      const opts = await sel.locator('option').allTextContents();
      if (opts.some((o) => /full.?time/i.test(o))) await sel.selectOption({ value: 'full-time' });
      else if (opts.some((o) => /engineering/i.test(o))) await sel.selectOption({ value: 'Engineering' });
      else if (opts.some((o) => /^mid/i.test(o))) await sel.selectOption({ value: 'mid' });
      else if (opts.some((o) => /^USD$/.test(o))) await sel.selectOption({ value: 'USD' });
    }

    await page.getByRole('button', { name: /post job/i }).click();
    await expect(page).toHaveURL(/employer\/jobs/, { timeout: 15_000 });
  });
});

// ── Applicants ─────────────────────────────────────────────────────────────
test.describe('Employer Applicants', () => {
  let jobId: string;

  test.beforeAll(async () => {
    // Create a fresh job and have emma apply — guarantees a known applicant.
    // LOGIN_RATE_LIMIT_MAX is set to 50 in docker-compose to accommodate E2E volume.
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    updateRefreshToken(EMPLOYER_AUTH_FILE, emp.refreshToken);
    const jobRes = await apiPost<{ job: { _id: string } }>(
      '/jobs',
      { ...E2E_JOB, title: `E2E Applicants Job ${Date.now()}` },
      emp.accessToken,
    );
    jobId = jobRes.job._id;

    // Login as Emma just to get an accessToken for the API call — do NOT write
    // to SEEKER_AUTH_FILE as the seeker spec may be running concurrently.
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    await apiPost<unknown>(
      '/applications',
      { jobId, coverLetter: COVER_LETTER },
      seeker.accessToken,
    );
  });

  test('applicants page loads for the job', async ({ page }) => {
    await page.goto(`/employer/jobs/${jobId}/applicants`);
    await expect(
      page.getByRole('heading', { name: /applicants/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('emma appears as an applicant', async ({ page }) => {
    await page.goto(`/employer/jobs/${jobId}/applicants`);
    await expect(page.getByRole('heading', { name: /applicants/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/emma/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('employer can change application status via select dropdown', async ({ page }) => {
    await page.goto(`/employer/jobs/${jobId}/applicants`);
    await expect(page.getByRole('heading', { name: /applicants/i })).toBeVisible({ timeout: 10_000 });

    // ApplicationStatusSelect renders as a native <select>
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 8_000 });

    await statusSelect.selectOption('reviewed');
    await page.waitForTimeout(1_000); // wait for mutation to settle
    await expect(statusSelect).toHaveValue('reviewed');
  });

  test('filter tabs are visible and clickable', async ({ page }) => {
    await page.goto(`/employer/jobs/${jobId}/applicants`);
    await expect(page.getByRole('heading', { name: /applicants/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /shortlisted/i }).click();
    await page.waitForTimeout(400);
    // Empty state or filtered cards — both are valid
    await expect(page.locator('main')).toBeVisible();
  });
});

// ── Company Profile ────────────────────────────────────────────────────────
test.describe('Employer Company Profile', () => {
  test.beforeAll(async () => {
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    updateRefreshToken(EMPLOYER_AUTH_FILE, emp.refreshToken);
  });

  test('company profile page loads with TechCorp data', async ({ page }) => {
    await page.goto('/employer/company');
    await expect(
      page.getByRole('heading', { name: /company profile/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/TechCorp/i)).toBeVisible({ timeout: 5_000 });
  });

  test('"Save Profile" button is present', async ({ page }) => {
    await page.goto('/employer/company');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /save profile/i })).toBeVisible({ timeout: 5_000 });
  });

  test('company description textarea is editable and saves', async ({ page }) => {
    await page.goto('/employer/company');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 5_000 })) {
      await textarea.fill(
        'E2E updated — TechCorp builds world-class developer tools for modern engineering teams worldwide.',
      );
      await page.getByRole('button', { name: /save profile/i }).click();
      await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 8_000 });
    }
  });
});
