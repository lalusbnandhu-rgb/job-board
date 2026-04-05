import { test, expect } from '@playwright/test';
import path from 'path';
import { apiLogin, apiPost, apiRefresh, readRefreshToken, updateRefreshToken } from '../helpers/api-client';

/**
 * Demo spec — one test per feature, ordered by user journey for video continuity.
 *
 * Run with:
 *   RECORD_VIDEO=1 npx playwright test specs/demo.spec.ts --project=chromium --workers=1
 *
 * Each test = one meaningful clip. No page is visited twice.
 */

test.describe.configure({ mode: 'serial' });

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json');
const EMPLOYER_AUTH_FILE = path.join(__dirname, '../.auth/employer.json');
const SEEKER_AUTH_FILE = path.join(__dirname, '../.auth/seeker.json');

const COVER_LETTER =
  'I am an excellent candidate with strong TypeScript, Node.js, and React experience. ' +
  'Very passionate about building great products and working in collaborative teams.';

const E2E_JOB_BASE = {
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

function useTokenPreWarm(authFile: string, email: string, password: string) {
  test.beforeEach(async ({ page }) => {
    try {
      const current = readRefreshToken(authFile);
      const { refreshToken: fresh } = await apiRefresh(current);
      updateRefreshToken(authFile, fresh);
      await page.addInitScript((token: string) => {
        localStorage.setItem('refreshToken', token);
      }, fresh);
    } catch {
      try {
        const { refreshToken: fresh } = await apiLogin(email, password);
        updateRefreshToken(authFile, fresh);
        await page.addInitScript((token: string) => {
          localStorage.setItem('refreshToken', token);
        }, fresh);
      } catch { /* continue */ }
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

  test.afterEach(async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('refreshToken')).catch(() => null);
    if (token) updateRefreshToken(authFile, token);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PLATFORM OVERVIEW — public browsing
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Platform Overview', () => {
  test('jobs listing — browse, search, and filter by category', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/job(s)? available|open position/i)).toBeVisible({ timeout: 5_000 });

    // Search
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    await searchInput.fill('Senior');
    await page.waitForTimeout(700);
    await expect(page.locator('article').first()).toBeVisible({ timeout: 5_000 });

    // Category filter
    const categorySelect = page.locator('select').first();
    if (await categorySelect.count()) {
      await categorySelect.selectOption('Engineering');
      await page.waitForTimeout(600);
      await expect(page.locator('article').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('job detail — role info, Apply CTA, then company profile', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('article').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 10_000 });

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText('About this role')).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByRole('link', { name: 'Apply now' }).or(page.getByRole('button', { name: 'Apply now' })).first(),
    ).toBeVisible({ timeout: 5_000 });

    // Navigate to company profile from job detail
    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('companies listing — browse and search', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /companies/i })).toBeVisible();
    await expect(page.getByText(/open role|no open/i).first()).toBeVisible({ timeout: 5_000 });

    // Search
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('TechCorp');
    await page.waitForTimeout(700);
    const firstCard = await page.locator('a[href*="/companies/"]').first().textContent();
    expect(firstCard?.toLowerCase()).toContain('techcorp');
  });

  test('company detail — open roles and job listings', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /open roles/i })).toBeVisible({ timeout: 5_000 });

    // Job links visible
    const jobLinks = page.locator('a[href*="/jobs/"]');
    if (await jobLinks.count() > 0) {
      await expect(jobLinks.first()).toBeVisible();
    }

    // Back to companies
    const backLink = page.getByRole('link', { name: /back to companies/i });
    await expect(backLink).toBeVisible({ timeout: 10_000 });
    await backLink.click();
    await expect(page).toHaveURL(/\/companies$/, { timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AUTH FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Auth', () => {
  test('registration — new seeker account', async ({ page }) => {
    const email = `e2e-demo-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill('Password1!');
    await page.getByLabel(/confirm password/i).fill('Password1!');
    const roleSelect = page.locator('select[name="role"], input[value="seeker"]');
    if (await roleSelect.count()) {
      const tag = await roleSelect.first().evaluate((el) => el.tagName.toLowerCase());
      if (tag === 'select') await roleSelect.first().selectOption('seeker');
    }
    await page.getByRole('button', { name: /register|sign up|create account/i }).click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible({ timeout: 15_000 });
  });

  test('seeker login — redirected to seeker dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('emma@example.com');
    await page.getByLabel(/password/i).fill('Seeker123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/seeker/dashboard', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible({ timeout: 10_000 });
  });

  test('employer login — redirected to employer dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('alice@techcorp.dev');
    await page.getByLabel(/password/i).fill('Employer123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/employer/dashboard', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /welcome|dashboard/i })).toBeVisible({ timeout: 10_000 });
  });

  test('logout — seeker is redirected to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('emma@example.com');
    await page.getByLabel(/password/i).fill('Seeker123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/seeker/dashboard', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /logout|sign out|log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('auth guard — protected routes redirect to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SEEKER JOURNEY
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Seeker Journey', () => {
  test.use({ storageState: SEEKER_AUTH_FILE });

  let jobSlug: string;

  test.beforeAll(async () => {
    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    updateRefreshToken(SEEKER_AUTH_FILE, seeker.refreshToken);

    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    const res = await apiPost<{ job: { _id: string; slug: string } }>(
      '/jobs',
      { ...E2E_JOB_BASE, title: `E2E Demo Apply ${Date.now()}` },
      emp.accessToken,
    );
    jobSlug = res.job.slug;
  });

  useTokenPreWarm(SEEKER_AUTH_FILE, 'emma@example.com', 'Seeker123!');

  test('seeker dashboard — welcome and navigation', async ({ page }) => {
    await page.goto('/seeker/dashboard');
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible({ timeout: 10_000 });
    const nav = page.locator('nav, aside').first();
    await expect(nav.getByRole('link', { name: /profile/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /application/i })).toBeVisible();
  });

  test('seeker profile — edit headline and save', async ({ page }) => {
    await page.goto('/seeker/profile');
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 10_000 });
    const headlineInput = page.getByLabel(/headline/i).first();
    if (await headlineInput.isVisible({ timeout: 5_000 })) {
      await headlineInput.fill(`Full-Stack Developer — TypeScript · Node.js · React`);
      const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
      if (await saveBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        await expect(page.getByText(/profile saved|all changes saved/i)).toBeVisible({ timeout: 8_000 });
      }
    }
  });

  test('apply to a job — open modal, submit, and confirm', async ({ page }) => {
    await page.goto(`/jobs/${jobSlug}`);
    await expect(page.getByRole('button', { name: 'Apply now' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Apply now' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Apply for/)).toBeVisible();
    await page.getByLabel(/cover letter/i).fill(COVER_LETTER);
    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page.getByText('Application submitted!')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Already applied')).toBeVisible({ timeout: 8_000 });
  });

  test('seeker applications — list and status filters', async ({ page }) => {
    await page.goto('/seeker/applications');
    await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible({ timeout: 10_000 });
    await page
      .locator('article').first()
      .or(page.getByText(/no applications yet/i))
      .waitFor({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible({ timeout: 5_000 });
  });

  test('seeker saved jobs', async ({ page }) => {
    await page.goto('/seeker/saved-jobs');
    await expect(page.getByRole('heading', { name: /saved/i })).toBeVisible({ timeout: 10_000 });
    await page
      .locator('article').first()
      .or(page.getByText(/no saved jobs/i))
      .waitFor({ timeout: 15_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. EMPLOYER JOURNEY
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Employer Journey', () => {
  test.use({ storageState: EMPLOYER_AUTH_FILE });

  let jobId: string;

  test.beforeAll(async () => {
    const emp = await apiLogin('alice@techcorp.dev', 'Employer123!');
    updateRefreshToken(EMPLOYER_AUTH_FILE, emp.refreshToken);

    const jobRes = await apiPost<{ job: { _id: string } }>(
      '/jobs',
      { ...E2E_JOB_BASE, title: `E2E Demo Applicants ${Date.now()}` },
      emp.accessToken,
    );
    jobId = jobRes.job._id;

    const seeker = await apiLogin('emma@example.com', 'Seeker123!');
    await apiPost<unknown>('/applications', { jobId, coverLetter: COVER_LETTER }, seeker.accessToken);
  });

  useTokenPreWarm(EMPLOYER_AUTH_FILE, 'alice@techcorp.dev', 'Employer123!');

  test('employer dashboard — welcome and Post a Job CTA', async ({ page }) => {
    await page.goto('/employer/dashboard');
    await expect(
      page.getByRole('heading', { name: /welcome|dashboard/i }),
    ).toBeVisible({ timeout: 10_000 });
    const postCta = page
      .getByRole('link', { name: /post a job/i })
      .or(page.getByRole('button', { name: /post a job/i }));
    await expect(postCta.first()).toBeVisible({ timeout: 5_000 });
  });

  test('post a new job — full form flow', async ({ page }) => {
    await page.goto('/employer/jobs/new');
    await expect(
      page.getByRole('heading', { name: /post a new job/i }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByLabel(/title/i).fill(`Senior TypeScript Engineer — Demo ${Date.now()}`);
    await page.locator('textarea').nth(0).fill(
      'Join our team to build world-class developer tools using TypeScript and Node.js.',
    );
    await page.locator('textarea').nth(1).fill(
      '3+ years TypeScript experience, Node.js, React, and strong communication skills.',
    );
    await page.getByLabel(/location/i).fill('Remote');

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
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('applicants — view, change status, and filter', async ({ page }) => {
    await page.goto(`/employer/jobs/${jobId}/applicants`);
    await expect(
      page.getByRole('heading', { name: /applicants/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/emma/i).first()).toBeVisible({ timeout: 8_000 });

    // Change status
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 8_000 });
    await statusSelect.selectOption('reviewed');
    await page.waitForTimeout(800);
    await expect(statusSelect).toHaveValue('reviewed');

    // Filter tabs
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /shortlisted/i }).click();
    await page.waitForTimeout(400);
    await expect(page.locator('main')).toBeVisible();
  });

  test('company profile — edit description and save', async ({ page }) => {
    await page.goto('/employer/company');
    await expect(
      page.getByRole('heading', { name: /company profile/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/TechCorp/i)).toBeVisible({ timeout: 5_000 });

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 5_000 })) {
      await textarea.fill(
        'TechCorp builds world-class developer tools that help engineering teams ship faster.',
      );
      const saveBtn = page.getByRole('button', { name: /save profile/i });
      await expect(saveBtn).toBeVisible({ timeout: 5_000 });
      await saveBtn.click({ force: true });
      await expect(page.getByText(/saved|success/i)).toBeVisible({ timeout: 8_000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ADMIN JOURNEY
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Admin Journey', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  let testEmail: string;

  test.beforeAll(async () => {
    const admin = await apiLogin('admin@jobboard.dev', 'Admin123!');
    updateRefreshToken(ADMIN_AUTH_FILE, admin.refreshToken);

    testEmail = `e2e-demo-ban-${Date.now()}@example.com`;
    await apiPost<unknown>('/auth/register', {
      email: testEmail,
      password: 'Password1!',
      role: 'seeker',
    });
  });

  useTokenPreWarm(ADMIN_AUTH_FILE, 'admin@jobboard.dev', 'Admin123!');

  test('admin dashboard — platform stats and sidebar navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(
      page.getByRole('heading', { name: /platform overview/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('main')).toBeVisible();
    const sidebar = page.locator('aside').first();
    await expect(sidebar.getByRole('link', { name: /users/i })).toBeVisible({ timeout: 5_000 });
    await expect(sidebar.getByRole('link', { name: /jobs/i })).toBeVisible();
  });

  test('user management — list, search by email, and role filter', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/emma@example\.com|alice@techcorp|e2e-/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Search
    await page.getByPlaceholder(/search by email/i).fill('emma@example.com');
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('emma@example.com')).toBeVisible({ timeout: 8_000 });

    // Role filter
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 });
  });

  test('ban and unban a user', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder(/search by email/i).fill(testEmail);
    await page.getByRole('button', { name: /^search$/i }).click();
    await page.waitForTimeout(600);

    // Ban
    const banBtn = page.getByRole('button', { name: /^ban$/i }).first();
    await expect(banBtn).toBeVisible({ timeout: 8_000 });
    await banBtn.click();
    await expect(
      page.getByRole('button', { name: /^unban$/i }).first(),
    ).toBeVisible({ timeout: 8_000 });

    // Unban
    await page.getByRole('button', { name: /^unban$/i }).first().click();
    await expect(
      page.getByRole('button', { name: /^ban$/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('jobs management — list and delete action', async ({ page }) => {
    await page.goto('/admin/jobs');
    await expect(page.getByRole('heading', { name: /job/i })).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/engineer|designer|analyst|developer|E2E/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteBtn.count()) {
      await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    }
  });
});
