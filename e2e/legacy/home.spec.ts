import { test, expect } from '../helpers/fixtures';
import { expectPrayerGrid, expectPublicLayout } from '../helpers/ui';

test.describe('public home /', () => {
  test('shows the prayer heading, public layout and all seven timings', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Kohët e namazit' })).toBeVisible();
    await expectPublicLayout(page);
    await expectPrayerGrid(page);
  });
});
