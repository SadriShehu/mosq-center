import { readFile } from 'node:fs/promises';
import { test, expect } from '../helpers/fixtures';
import type { Page } from '@playwright/test';
import type { SeededFamily } from '../helpers/seed';

const fullName = (f: SeededFamily) => `${f.name} ${f.middleName} ${f.surname}`;

function rowOf(page: Page, f: SeededFamily) {
  const isPhone = (page.viewportSize()?.width ?? 1280) < 640;
  return page.getByRole(isPhone ? 'listitem' : 'row').filter({ hasText: f.name });
}

test('ledger lists the year payments and filters by search', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 3, paid: 3 });
  await page.goto(`/pagesat?viti=${s.year}&lagjja=${s.neighbourhoodId}`);
  await expect(page.getByRole('heading', { name: 'Pagesat' })).toBeVisible();
  for (const f of s.families) await expect(rowOf(page, f)).toBeVisible();

  await page.getByRole('searchbox', { name: 'Kërko' }).fill(s.families[1].name);
  await expect(rowOf(page, s.families[1])).toBeVisible();
  await expect(rowOf(page, s.families[0])).toHaveCount(0);
});

test('neighbourhood filter limits the ledger', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 1, paid: 1 });
  await page.goto(`/pagesat?viti=${s.year}`);
  await expect(rowOf(page, s.families[0])).toBeVisible();
  await page.getByRole('combobox', { name: 'Lagjja' }).selectOption(s.neighbourhoodId);
  await expect(rowOf(page, s.families[0])).toBeVisible();
  await page.getByRole('combobox', { name: 'Lagjja' }).selectOption('');
  await expect(rowOf(page, s.families[0])).toBeVisible();
});

test('edit a payment amount', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 1, paid: 1 });
  await page.goto(`/pagesat?viti=${s.year}&lagjja=${s.neighbourhoodId}`);
  await page.getByRole('button', { name: `Ndrysho: ${fullName(s.families[0])}` }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Shuma').fill('99');
  await dialog.getByRole('button', { name: 'Ruaj' }).click();
  await expect(dialog).toBeHidden();
  expect((await seed.stats(s.year)).collected).toBe(99);
});

test('delete asks for confirmation and removes the payment', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 1, paid: 1 });
  await page.goto(`/pagesat?viti=${s.year}&lagjja=${s.neighbourhoodId}`);
  await page.getByRole('button', { name: `Fshi: ${fullName(s.families[0])}` }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('A jeni të sigurt që dëshironi ta fshini këtë pagesë?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Fshi', exact: true }).click();
  await expect(rowOf(page, s.families[0])).toHaveCount(0);
  expect((await seed.stats(s.year)).paid_families).toBe(0);
});

test('Eksporto CSV downloads a UTF-8 file with BOM and the rows', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 2, paid: 2 });
  await page.goto(`/pagesat?viti=${s.year}&lagjja=${s.neighbourhoodId}`);
  await expect(rowOf(page, s.families[0])).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksporto CSV' }).click();
  const d = await download;
  expect(d.suggestedFilename()).toMatch(/\.csv$/);
  const buf = await readFile((await d.path())!);
  expect([...buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const text = buf.toString('utf8');
  expect(text).toContain(s.families[0].name);
  expect(text).toContain(s.families[1].name);
});
