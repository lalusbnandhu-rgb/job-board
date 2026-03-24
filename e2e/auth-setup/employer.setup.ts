/**
 * Auth setup — Employer
 * Logs in as alice@techcorp.dev (seeded by the seed script) and saves storageState.
 */
import { test as setup } from '@playwright/test';
import path from 'path';

export const EMPLOYER_AUTH_FILE = path.join(__dirname, '../.auth/employer.json');

setup('authenticate as employer', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('alice@techcorp.dev');
  await page.getByLabel(/password/i).fill('Employer123!');
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('**/employer/dashboard', { timeout: 15_000 });

  await page.context().storageState({ path: EMPLOYER_AUTH_FILE });
});
