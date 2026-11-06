import { test, expect } from '../helpers/fixtures';

const LABELS: [string, string][] = [
  ['Sabahu', 'Fajr'],
  ['Lindja e Diellit', 'Sunrise'],
  ['Dreka', 'Dhuhr'],
  ['Ikindia', 'Asr'],
  ['Akshami', 'Maghrib'],
  ['Jacia', 'Isha'],
  ['Pjesa e tretë e natës', 'Midnight'],
];

test.describe('public /', () => {
  test('shows the next prayer with a countdown, all today times and Kyçu', async ({ page }) => {
    const response = await page.request.get('/api/v1/public/prayers');
    expect(response.ok()).toBeTruthy();
    const prayers = (await response.json()) as Record<string, string>;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Kohët e namazit', exact: true })).toBeVisible();
    await expect(page.getByText('Namazi i ardhshëm', { exact: true })).toBeVisible();
    await expect(page.getByText(/\d{2}:\d{2}:\d{2}/)).toBeVisible();

    for (const [label, key] of LABELS) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
      if (prayers[key]) {
        await expect(page.getByText(prayers[key], { exact: true }).first()).toBeVisible();
      }
    }

    await expect(page.getByRole('link', { name: 'Kyçu', exact: true })).toHaveAttribute('href', '/login');
    await expect(page.getByRole('link', { name: 'Lagjet', exact: true })).toHaveCount(0);
  });
});
