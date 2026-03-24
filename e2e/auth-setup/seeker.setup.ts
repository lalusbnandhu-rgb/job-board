/**
 * Auth setup — Seeker
 * Logs in as emma@example.com (seeded by the seed script) and saves storageState.
 * Run once before seeker-dependent specs.
 */
import { test as setup } from '@playwright/test';
import path from 'path';

export const SEEKER_AUTH_FILE = path.join(__dirname, '../.auth/seeker.json');

setup('authenticate as seeker', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('emma@example.com');
  await page.getByLabel(/password/i).fill('Seeker123!');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to seeker dashboard
  await page.waitForURL('**/seeker/dashboard', { timeout: 15_000 });

  await page.context().storageState({ path: SEEKER_AUTH_FILE });
});
