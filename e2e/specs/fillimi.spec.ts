import { test, expect } from '../helpers/fixtures';

import type { Page } from '@playwright/test';
import type { Stats } from '../helpers/seed';

/** Format in the browser so we compare with exactly what the page renders. */
const money = (page: Page, n: number) =>
  page.evaluate((v) => new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(v), n);
const percent = (page: Page, n: number) =>
  page.evaluate((v) => new Intl.NumberFormat('sq-AL', { style: 'percent', maximumFractionDigits: 0 }).format(v), n);

/** The stats response the page itself loaded: other tests seed in parallel, so /stats totals move. */
async function loadWithStats(page: Page, url: string, year: number): Promise<Stats> {
  const resp = page.waitForResponse((r) => r.url().includes(`/api/v1/stats?year=${year}`) && r.ok());
  await page.goto(url);
  return (await (await resp).json()) as Stats;
}

test.describe('Fillimi (/user dashboard)', () => {
  test('shows Albanian error states with retry when queries fail', async ({ page }) => {
    await page.route('**/api/v1/stats?*', (route) => route.abort());
    await page.route('**/api/v1/payments/recent?*', (route) => route.abort());
    await page.route('**/api/v1/prayers', (route) => route.abort());
    await page.goto('/user');

    const kpis = page.getByRole('region', { name: /Pasqyra për vitin/ });
    await expect(kpis.getByText('Nuk u ngarkuan të dhënat.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Pagesat e fundit' }).getByText('Nuk u ngarkuan të dhënat.')).toBeVisible();
    await expect(page.getByText('Namazi i ardhshëm')).toBeVisible();
    await expect(page.getByText('Nuk ka pagesa ende')).toHaveCount(0);

    // Retry recovers the KPIs once the API answers again.
    await page.unroute('**/api/v1/stats?*');
    await kpis.getByRole('button', { name: 'Provoni përsëri' }).click();
    await expect(kpis.getByText('Mbledhur', { exact: true })).toBeVisible();
  });

  test('KPIs, progress and links match /api/v1/stats', async ({ page, seed }) => {
    // 3 families x 4 members, 1 paid
    const sc = await seed.scenario({ families: 3, members: 4, paid: 1 });
    const stats = await loadWithStats(page, `/user?viti=${sc.year}`, sc.year);
    const mine = stats.neighbourhoods.find((n) => n.id === sc.neighbourhoodId)!;
    expect(mine).toBeTruthy();
    expect(mine.families).toBe(3);
    expect(mine.paid_families).toBe(1);

    const me = (await (await page.request.get('/api/v1/me')).json()) as { name: string };
    await expect(page.getByRole('heading', { level: 1, name: `Mirësevini ${me.name}` })).toBeVisible();

    const kpis = page.getByRole('region', { name: `Pasqyra për vitin ${sc.year}` });
    await expect(kpis.getByText('Mbledhur', { exact: true })).toBeVisible();
    await expect(kpis.getByText(await money(page, stats.collected), { exact: true })).toBeVisible();
    await expect(kpis.getByText(`Pritet ${await money(page, stats.expected)}`)).toBeVisible();
    await expect(kpis.getByText('Familjet e paguara', { exact: true })).toBeVisible();
    await expect(kpis.getByText(await percent(page, stats.paid_families / stats.families), { exact: true })).toBeVisible();
    await expect(kpis.getByText(`${stats.paid_families} nga ${stats.families} familje`)).toBeVisible();
    await expect(kpis.getByText('Familjet e papaguara', { exact: true })).toBeVisible();
    await expect(kpis.getByText(String(stats.unpaid_families), { exact: true })).toBeVisible();

    // progress for the seeded neighbourhood (1 of 3 paid → 33)
    await expect(page.getByRole('heading', { name: 'Përparimi sipas lagjeve' })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: `Përparimi i lagjes ${seed.neighbourhoodName}` })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );

    // neighbourhood card links to Mbledhja filtered by that neighbourhood
    const link = page.getByRole('link', { name: new RegExp(seed.neighbourhoodName) });
    await expect(link).toContainText(`${await money(page, mine.collected)} / ${await money(page, mine.expected)}`);
    await expect(link).toContainText('1/3');
    await link.click();
    await expect(page).toHaveURL(/\/mbledhja/);
    await expect(page).toHaveURL(new RegExp(`lagjja=${sc.neighbourhoodId}`));
    await expect(page).toHaveURL(new RegExp(`viti=${sc.year}`));
    await expect(page.getByRole('heading', { name: 'Mbledhja' })).toBeVisible();
  });

  test('"Hap mbledhjen" opens Mbledhja for the shared year', async ({ page, seed }) => {
    const sc = await seed.scenario({ families: 2, members: 3, paid: 0 });
    await page.goto(`/user?viti=${sc.year}`);
    await page.getByRole('link', { name: 'Hap mbledhjen' }).first().click();
    await expect(page).toHaveURL(new RegExp(`/mbledhja\\?viti=${sc.year}`));
  });

  test('recent payments show what the API reports', async ({ page, seed }) => {
    const sc = await seed.scenario({ families: 1, members: 5, paid: 1 });
    const resp = page.waitForResponse((r) => r.url().includes('/api/v1/payments/recent') && r.ok());
    await page.goto(`/user?viti=${sc.year}`);
    const recent = (await (await resp).json()) as { family_name: string; amount: number }[];
    expect(recent.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Pagesat e fundit' })).toBeVisible();
    const section = page.getByRole('region', { name: 'Pagesat e fundit' });
    await expect(section.getByRole('listitem')).toHaveCount(recent.length);
    await expect(section.getByText(recent[0].family_name.trim(), { exact: true })).toBeVisible();
    await expect(section.getByText(await money(page, recent[0].amount)).first()).toBeVisible();
  });

  test('next prayer card shows a time', async ({ page }) => {
    await page.goto('/user');
    await expect(page.getByText('Namazi i ardhshëm')).toBeVisible();
    for (const label of ['Sabahu', 'Dreka', 'Ikindia', 'Akshami', 'Jacia']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/^\d{2}:\d{2}$/).first()).toBeVisible();
  });

  test('year selector changes ?viti= and reloads the figures', async ({ page, seed }) => {
    const sc = await seed.scenario({ families: 2, members: 2, paid: 2 });
    const other = new Date().getFullYear();
    await page.goto(`/user?viti=${sc.year}`);
    const select = page.getByRole('combobox', { name: 'Viti' });
    await expect(select).toHaveValue(String(sc.year));
    const resp = page.waitForResponse((r) => r.url().includes(`/api/v1/stats?year=${other}`) && r.ok());
    await select.selectOption(String(other));
    await expect(page).toHaveURL(new RegExp(`viti=${other}`));
    const stats = (await (await resp).json()) as Stats;
    await expect(
      page.getByRole('region', { name: `Pasqyra për vitin ${other}` }).getByText(await money(page, stats.collected), { exact: true }),
    ).toBeVisible();
  });
});
