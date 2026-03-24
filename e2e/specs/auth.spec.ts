import { test, expect } from '@playwright/test';

/**
 * E2E — Authentication flows
 * These tests run without any stored auth state (fresh browser).
 */

test.describe('Registration', () => {
  test('new seeker can register and is redirected to seeker dashboard', async ({ page }) => {
    const email = `e2e-register-${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill('Password1!');
    // Confirm password field is required by the register form
    await page.getByLabel(/confirm password/i).fill('Password1!');

    // Select seeker role if a role selector exists
    const roleSelect = page.locator('select[name="role"], input[value="seeker"]');
    if (await roleSelect.count()) {
      const tag = await roleSelect.first().evaluate((el) => el.tagName.toLowerCase());
      if (tag === 'select') await roleSelect.first().selectOption('seeker');
    }

    await page.getByRole('button', { name: /register|sign up|create account/i }).click();
    // After successful registration the page shows "Check your inbox" then redirects to /login
    await expect(page.getByText(/check your inbox/i)).toBeVisible({ timeout: 15_000 });
  });

  test('shows validation errors for empty form submission', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /register|sign up|create account/i }).click();
    const errors = page.locator('[role="alert"], .text-red-500, .text-destructive');
    await expect(errors.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Login', () => {
  test('seeker can log in and is redirected to seeker dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('emma@example.com');
    await page.getByLabel(/password/i).fill('Seeker123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/seeker/dashboard', { timeout: 15_000 });
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('employer can log in and is redirected to employer dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('alice@techcorp.dev');
    await page.getByLabel(/password/i).fill('Employer123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/employer/dashboard', { timeout: 15_000 });
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('admin can log in and is redirected to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@jobboard.dev');
    await page.getByLabel(/password/i).fill('Admin123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/admin/dashboard', { timeout: 15_000 });
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('emma@example.com');
    await page.getByLabel(/password/i).fill('TotallyWrongPassword99!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    const error = page.locator('[role="alert"], .text-red-500, .text-destructive');
    await expect(error.first()).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('shows error for unknown email', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('ghost-nobody-xyz@example.com');
    await page.getByLabel(/password/i).fill('Password1!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    const error = page.locator('[role="alert"], .text-red-500, .text-destructive');
    await expect(error.first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Logout', () => {
  test('logged-in seeker can log out and is redirected away from dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('emma@example.com');
    await page.getByLabel(/password/i).fill('Seeker123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('**/seeker/dashboard', { timeout: 15_000 });

    // Wait for the dashboard heading — confirms auth hydration is done and the
    // seeker sidebar (with the Sign out button) is fully rendered.
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible({ timeout: 15_000 });

    const logoutBtn = page.getByRole('button', { name: /logout|sign out|log out/i });
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
    await logoutBtn.click();
    await expect(page).not.toHaveURL(/seeker\/dashboard/, { timeout: 8_000 });
  });
});

test.describe('Auth Guards', () => {
  test('/seeker/dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/seeker/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test('/employer/dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/employer/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test('/admin/dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });
});
