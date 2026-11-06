import { test, expect } from '../helpers/fixtures';
import { expectPrayerGrid } from '../helpers/ui';

test.describe('/user', () => {
  test('shows welcome text, avatar, success message and the prayer grid', async ({ page }) => {
    await page.goto('/user');

    await expect(page.getByRole('heading', { name: /Miresevini/ })).toBeVisible();
    await expect(page.getByText('Jeni kyqur me sukses')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kohët e namazit' })).toBeVisible();

    // The sidebar logo and the user avatar are both images.
    expect(await page.getByRole('img').count()).toBeGreaterThanOrEqual(2);

    await expectPrayerGrid(page);
  });
});
