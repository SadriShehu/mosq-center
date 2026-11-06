import { test, expect } from '../helpers/fixtures';
import type { Page } from '@playwright/test';
import type { Scenario, SeededFamily } from '../helpers/seed';
import { expectNoReload, markNoReload } from '../helpers/ui';

const fullName = (f: SeededFamily) => `${f.name} ${f.middleName} ${f.surname}`;

/** A family's row (table) or card (phone), found by its visible name. */
function rowOf(page: Page, f: SeededFamily) {
  const isPhone = (page.viewportSize()?.width ?? 1280) < 640;
  return page.getByRole(isPhone ? 'listitem' : 'row').filter({ hasText: fullName(f) });
}

async function open(page: Page, s: Scenario) {
  await page.goto(`/mbledhja?viti=${s.year}&lagjja=${s.neighbourhoodId}`);
  await expect(page.getByRole('heading', { name: 'Mbledhja' })).toBeVisible();
}

test('one tap pays a family and Zhbëj undoes it', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 2, paid: 0 });
  const [a, b] = s.families;
  const fee = (await seed.stats(s.year)).fee_per_member;
  await open(page, s);
  await markNoReload(page);

  const payButton = rowOf(page, a).getByRole('button', { name: /^Paguaj/ });
  const expectedMoney = await page.evaluate(
    (amount) => new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(amount),
    a.members * fee,
  );
  expect(await payButton.textContent()).toContain(expectedMoney);

  const progress = page.getByRole('progressbar');
  await expect(progress).toHaveAttribute('aria-valuenow', '0');

  await payButton.click();
  await expect(rowOf(page, a).getByText('Paguar', { exact: true })).toBeVisible();
  expect((await seed.stats(s.year)).paid_families).toBe(1);
  await expect(rowOf(page, b).getByText('Pa paguar', { exact: true })).toBeVisible();
  await expect(progress).toHaveAttribute('aria-valuenow', '50');
  await expectNoReload(page);

  await page.getByRole('button', { name: 'Zhbëj' }).click();
  await expect(rowOf(page, a).getByText('Pa paguar', { exact: true })).toBeVisible();
  expect((await seed.stats(s.year)).paid_families).toBe(0);
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  await expectNoReload(page);
});

test('multi-select marks several families paid', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 3, paid: 0 });
  await open(page, s);

  await page.getByRole('checkbox', { name: `Zgjidh ${fullName(s.families[0])}` }).check();
  await page.getByRole('checkbox', { name: `Zgjidh ${fullName(s.families[1])}` }).check();
  await page.getByRole('button', { name: 'Shëno të paguara (2)' }).click();

  await expect(rowOf(page, s.families[0]).getByText('Paguar', { exact: true })).toBeVisible();
  await expect(rowOf(page, s.families[1]).getByText('Paguar', { exact: true })).toBeVisible();
  await expect(rowOf(page, s.families[2]).getByText('Pa paguar', { exact: true })).toBeVisible();
  const stats = await seed.stats(s.year);
  expect(stats.paid_families).toBe(2);
  // amount is members x fee, computed by the server
  expect(stats.collected).toBe(2 * s.families[0].members * s.feePerMember);
});

test('tabs split paid and unpaid families', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 3, paid: 1 });
  const [paid, unpaid] = [s.families[0], s.families[1]];
  await open(page, s);

  await page.getByRole('tab', { name: 'Pa paguar', exact: true }).click();
  await expect(rowOf(page, unpaid)).toBeVisible();
  await expect(rowOf(page, paid)).toHaveCount(0);

  await page.getByRole('tab', { name: 'Paguar', exact: true }).click();
  await expect(rowOf(page, paid)).toBeVisible();
  await expect(rowOf(page, unpaid)).toHaveCount(0);

  await page.getByRole('tab', { name: 'Të gjitha', exact: true }).click();
  await expect(rowOf(page, paid)).toBeVisible();
  await expect(rowOf(page, unpaid)).toBeVisible();
});

test('search narrows the list by family name', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 3, paid: 0 });
  await open(page, s);

  await page.getByRole('searchbox', { name: 'Kërko' }).fill(s.families[1].name);
  await expect(rowOf(page, s.families[1])).toBeVisible();
  await expect(rowOf(page, s.families[0])).toHaveCount(0);
});

test('family name links to the family sheet', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 1, paid: 0 });
  await open(page, s);
  await rowOf(page, s.families[0]).getByRole('link', { name: fullName(s.families[0]) }).click();
  await expect(page).toHaveURL(new RegExp(`/familjet\\?id=${s.families[0].id}`));
});

test('Gjenero faturat downloads a PDF for unpaid families', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 2, paid: 0 });
  await open(page, s);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Gjenero faturat' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
});

test('neighbourhood select filters the list and updates the URL', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 1, paid: 0 });
  const otherName = `${seed.name('Lagje')} B`;
  const otherId = await seed.createNeighbourhood({ name: otherName });
  const otherFamily: SeededFamily = {
    id: '',
    name: `${seed.name('Familja')} B`,
    middleName: 'Prindi',
    surname: `Mbiemri ${seed.token}`,
    members: 4,
  };
  otherFamily.id = await seed.createFamily(otherFamily);

  await open(page, s);
  await expect(rowOf(page, s.families[0])).toBeVisible();

  const select = page.getByRole('combobox', { name: 'Lagjja' });
  await select.selectOption({ label: otherName });
  await expect(page).toHaveURL(new RegExp(`lagjja=${otherId}`));
  await expect(rowOf(page, otherFamily)).toBeVisible();
  await expect(rowOf(page, s.families[0])).toHaveCount(0);

  await select.selectOption({ label: 'Të gjitha lagjet' });
  await expect(page).not.toHaveURL(/lagjja=/);
  await expect(rowOf(page, otherFamily)).toBeVisible();
  await expect(rowOf(page, s.families[0])).toBeVisible();
});

test('shows an empty state when the neighbourhood has no families', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 0, paid: 0 });
  await open(page, s);
  await expect(page.getByText('Nuk ka të dhëna.')).toBeVisible();
});

test('Gjenero faturat says so when nobody is unpaid', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 1, paid: 1 });
  await open(page, s);
  await page.getByRole('button', { name: 'Gjenero faturat' }).click();
  await expect(page.getByText(`Nuk ka fatura për t'u gjeneruar për vitin ${s.year}.`)).toBeVisible();
});
