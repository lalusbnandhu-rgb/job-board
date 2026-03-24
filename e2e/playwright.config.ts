import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 * Tests run against the Docker stack (frontend: 3000, backend: 5000).
 * Auth states are pre-computed by setup projects so most spec files skip the login UI.
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: process.env['CI'] ? 1 : 2,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ── Auth setup (runs first, saves storageState) ──────────────────────────
    // testDir must be set per-project so Playwright finds files outside ./specs
    {
      name: 'seeker-auth-setup',
      testDir: './auth-setup',
      testMatch: 'seeker.setup.ts',
    },
    {
      name: 'employer-auth-setup',
      testDir: './auth-setup',
      testMatch: 'employer.setup.ts',
    },
    {
      name: 'admin-auth-setup',
      testDir: './auth-setup',
      testMatch: 'admin.setup.ts',
    },

    // ── Spec projects (Chromium only for speed — CI; all browsers for thorough) ─
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['seeker-auth-setup', 'employer-auth-setup', 'admin-auth-setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['seeker-auth-setup', 'employer-auth-setup', 'admin-auth-setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['seeker-auth-setup', 'employer-auth-setup', 'admin-auth-setup'],
    },
  ],
});
