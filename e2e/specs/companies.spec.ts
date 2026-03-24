import { test, expect } from '@playwright/test';

/**
 * E2E — Companies browsing (public, no auth required)
 */

test.describe('Companies listing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('page loads with heading and company cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /companies/i })).toBeVisible();
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible();
  });

  test('each company card shows an open-roles badge', async ({ page }) => {
    await expect(
      page.getByText(/open role|no open/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('search filters by company name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('TechCorp');
    await page.waitForTimeout(700); // debounce

    const cards = page.locator('a[href*="/companies/"]');
    await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    const firstCard = await cards.first().textContent();
    expect(firstCard?.toLowerCase()).toContain('techcorp');
  });

  test('no-match search shows empty state message', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill('ZZZNoSuchCompanyAtAll999');
    await page.waitForTimeout(700);
    await expect(page.getByText(/no companies|no results/i).first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Company detail page', () => {
  test('clicking a company card navigates to /companies/:slug', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });
  });

  test('profile shows company heading and open roles section', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });

    await expect(page.getByRole('heading').first()).toBeVisible();
    // "Open roles" appears in the <h2> section heading; use role to avoid matching
    // the "X open roles" badge span inside the company header card.
    await expect(page.getByRole('heading', { name: /open roles/i })).toBeVisible({ timeout: 5_000 });
  });

  test('active job listings link to /jobs/:slug', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });

    const jobLinks = page.locator('a[href*="/jobs/"]');
    if (await jobLinks.count() > 0) {
      await expect(jobLinks.first()).toBeVisible();
    }
  });

  test('"Back to companies" link returns to the list', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.locator('a[href*="/companies/"]').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('a[href*="/companies/"]').first().click();
    await expect(page).toHaveURL(/\/companies\/.+/, { timeout: 10_000 });

    const backLink = page.getByRole('link', { name: /back to companies/i });
    await expect(backLink).toBeVisible({ timeout: 10_000 });
    await backLink.click();
    await expect(page).toHaveURL(/\/companies$/, { timeout: 8_000 });
  });

  test('unknown company slug shows not-found state', async ({ page }) => {
    await page.goto('/companies/this-company-does-not-exist-e2e-xyz');
    await expect(
      page.getByText(/not found|404|removed|incorrect/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
