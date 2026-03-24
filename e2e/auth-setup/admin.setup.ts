/**
 * Auth setup — Admin
 * Logs in as admin@jobboard.dev (seeded by the seed script) and saves storageState.
 */
import { test as setup } from '@playwright/test';
import path from 'path';

export const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('admin@jobboard.dev');
  await page.getByLabel(/password/i).fill('Admin123!');
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('**/admin/dashboard', { timeout: 15_000 });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
