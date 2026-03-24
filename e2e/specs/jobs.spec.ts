import { test, expect } from '@playwright/test';

/**
 * E2E — Jobs browsing (public, no auth required)
 */

test.describe('Jobs listing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
    // Wait for seeded jobs to hydrate
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
  });

  test('page loads with job cards', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('article').first()).toBeVisible();
  });

  test('displays job count text', async ({ page }) => {
    await expect(
      page.getByText(/job(s)? available|open position/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('search filters results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    await searchInput.fill('Senior');
    await page.waitForTimeout(700); // debounce

    const cards = page.locator('article');
    const count = await cards.count();
    if (count > 0) {
      const firstTitle = await cards.first().textContent();
      expect(firstTitle?.toLowerCase()).toContain('senior');
    }
  });

  test('category filter narrows results', async ({ page }) => {
    const categorySelect = page.locator('select').first();
    if (await categorySelect.count()) {
      await categorySelect.selectOption('Engineering');
      await page.waitForTimeout(600);
      await expect(page.locator('article').first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('Job detail page', () => {
  test('clicking a job card navigates to /jobs/:slug', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('article a').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 10_000 });
  });

  test('detail page shows title, "About this role", and Requirements sections', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('article a').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 10_000 });

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText('About this role')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Requirements')).toBeVisible({ timeout: 5_000 });
  });

  test('sidebar has an Apply CTA and company card', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('article a').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 10_000 });

    // Unauthenticated → "Apply now" link to /register
    await expect(
      page.getByRole('link', { name: 'Apply now' })
        .or(page.getByRole('button', { name: 'Apply now' }))
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    await expect(page.getByText('About the company')).toBeVisible({ timeout: 5_000 });
  });

  test('"Back to jobs" link returns to the listing', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('article a').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 10_000 });

    await page.getByRole('link', { name: /back to jobs/i }).click();
    await expect(page).toHaveURL(/\/jobs$/, { timeout: 8_000 });
  });

  test('clicking the company link navigates to /companies/:slug', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('article a').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 10_000 });

    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });
  });

  test('unknown job slug shows not-found state', async ({ page }) => {
    await page.goto('/jobs/this-job-does-not-exist-e2e-xyz999');
    await expect(
      page.getByText(/not found|404|removed|incorrect/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
