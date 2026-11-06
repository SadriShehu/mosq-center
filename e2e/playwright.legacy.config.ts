import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:8086';

/**
 * Runs the archived migration/parity suite (e2e/legacy). The suite targets the
 * app at tag migration-parity, so keep the single desktop project it was
 * written for and point BASE_URL at that app.
 */
export default defineConfig({
  testDir: './legacy',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'legacy',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
