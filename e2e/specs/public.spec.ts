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

test.describe('public / next prayer window', () => {
  test('between Fajr and sunrise the next prayer is Dreka, not Lindja e Diellit', async ({ page }) => {
    const times = {
      Fajr: '05:04 (CET)',
      Sunrise: '06:11 (CET)',
      Dhuhr: '12:30 (CET)',
      Asr: '15:45 (CET)',
      Maghrib: '17:50 (CET)',
      Isha: '19:20 (CET)',
      Midnight: '23:10 (CET)',
      Sunset: '',
      Imsak: '',
      Firstthird: '',
      Lastthird: '',
    };
    const fixed = new Date(2026, 2, 1, 5, 30, 0).getTime();

    await page.route('**/api/v1/public/prayers', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(times),
    }));
    await page.addInitScript({
      content: `
        (() => {
          const fixed = ${fixed};
          const RealDate = Date;
          class FakeDate extends RealDate {
            constructor(...args) { if (args.length === 0) super(fixed); else super(...args); }
            static now() { return fixed; }
          }
          Object.setPrototypeOf(FakeDate, RealDate);
          window.Date = FakeDate;
        })();
      `,
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dreka', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lindja e Diellit', exact: true })).toHaveCount(0);
    await expect(page.getByText(/\d{2}:\d{2}:\d{2}/)).toBeVisible();
  });
});
