import { test, expect } from '@playwright/test';

test.describe('home and user flows (new app)', () => {
  test('prayers API failure shows a visible error', async ({ page }) => {
    await page.route('**/api/v1/public/prayers', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Prayer service unavailable' }),
      }),
    );

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Kohët e namazit' })).toBeVisible();
    await expect(page.getByText('Prayer service unavailable')).toBeVisible();
  });

  test('/user redirects to /login when /api/v1/me returns 401', async ({ page }) => {
    await page.route('**/api/v1/me', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'unauthorized' }),
      }),
    );

    await page.goto('/user');

    await expect(page).toHaveURL(/\/login$/);
  });
});
