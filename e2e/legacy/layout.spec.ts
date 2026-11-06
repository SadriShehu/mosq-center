import { test, expect } from '../helpers/fixtures';
import { expectAdminLayout, expectPublicLayout, expectSidebarToggle } from '../helpers/ui';

test.describe('layout', () => {
  test('public layout keeps its sidebar and login link', async ({ page }) => {
    await page.goto('/');
    await expectPublicLayout(page);
  });

  test('authenticated layout keeps sidebar, top nav and dropdown', async ({ page }) => {
    await page.goto('/lagjet');
    await expectAdminLayout(page);
  });

  test('sidebar toggle button folds the sidebar', async ({ page }) => {
    await page.goto('/lagjet');
    await expectSidebarToggle(page);
  });
});
