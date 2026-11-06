import type { Page } from '@playwright/test';
import { test, expect } from '../helpers/fixtures';

const API = '**/api/v1/public/config';
const TENANT = 'Xhamia Test';
const FALLBACK = 'Xhamia Qendër';

/** The visible brand text (desktop sidebar or the phone drawer's copy). */
const visibleBrand = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first();

test.describe('Tenant brand', () => {
  test('shells and <title> use brand_name from /api/v1/public/config', async ({ page }) => {
    await page.route(API, (route) => route.fulfill({ json: { brand_name: TENANT } }));

    await page.goto('/');
    await expect(visibleBrand(page, TENANT)).toBeVisible();
    await expect(page).toHaveTitle(TENANT);

    await page.goto('/user');
    const menu = page.getByRole('button', { name: 'Menyja' });
    if (await menu.isVisible()) await menu.click();
    await expect(visibleBrand(page, TENANT)).toBeVisible();
    await expect(page).toHaveTitle(TENANT);
  });

  test('falls back to sq.brand when the config request fails', async ({ page }) => {
    await page.route(API, (route) => route.fulfill({ json: { brand_name: TENANT } }));
    await page.goto('/');
    await expect(page).toHaveTitle(TENANT);

    await page.unroute(API);
    await page.route(API, (route) => route.abort());
    const failed = page.waitForRequest((r) => r.url().includes('/api/v1/public/config'));
    await page.reload();
    await failed;
    await expect(visibleBrand(page, FALLBACK)).toBeVisible();
    await expect(page).toHaveTitle(FALLBACK);
  });
});
