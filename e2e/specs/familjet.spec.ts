import { test, expect } from '../helpers/fixtures';
import type { Page } from '@playwright/test';

const YEAR = new Date().getFullYear();

/** A seeded family's row on desktop or card on phone. */
function familyItem(page: Page, name: string) {
  return page.locator('tr, li').filter({ hasText: name }).first();
}

async function closeSheet(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Mbyll', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test.describe('/familjet', () => {
  test('lists families with payment status, filters and search', async ({ page, seed }) => {
    const scenario = await seed.scenario({ families: 2, members: 3, paid: 1, year: YEAR });
    const paid = scenario.families[0];
    const unpaid = scenario.families[1];

    await page.goto(`/familjet?viti=${YEAR}`);
    await expect(page.getByRole('heading', { name: 'Familjet', exact: true })).toBeVisible();
    await expect(familyItem(page, unpaid.name)).toBeVisible();

    await expect(familyItem(page, paid.name).getByText('Paguar', { exact: true })).toBeVisible();
    await expect(familyItem(page, unpaid.name).getByText('Pa paguar', { exact: true })).toBeVisible();

    await page.getByLabel('Kërko', { exact: true }).fill(unpaid.name);
    await expect(familyItem(page, unpaid.name)).toBeVisible();
    await expect(page.getByText(paid.name)).toHaveCount(0);

    await page.getByLabel('Kërko', { exact: true }).fill('');
    await page.getByRole('combobox', { name: 'Lagjja', exact: true }).selectOption({
      label: seed.neighbourhoodName,
    });

    await familyItem(page, unpaid.name).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Historiku i pagesave')).toBeVisible();
    await closeSheet(page);
  });

  test('family sheet shows the year history and pays the remaining years', async ({ page, seed }) => {
    const scenario = await seed.scenario({ families: 2, members: 3, paid: 1, year: YEAR });
    const unpaid = scenario.families[1];

    await page.goto(`/familjet?viti=${YEAR}&id=${unpaid.id}`);
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(unpaid.name).first()).toBeVisible();
    await expect(sheet.getByText('Historiku i pagesave')).toBeVisible();
    await expect(sheet.getByText(String(YEAR), { exact: true })).toBeVisible();
    await expect(sheet.getByText('Pa paguar', { exact: true })).toBeVisible();

    await sheet.getByRole('button', { name: 'Paguaj vitet e mbetura' }).click();
    await expect(sheet.getByText('Paguar', { exact: true })).toBeVisible();

    const response = await page.request.get(`/api/v1/collection?year=${YEAR}`);
    expect(response.ok()).toBeTruthy();
    const rows = (await response.json()) as { id: string; paid: boolean }[];
    expect(rows.find((row) => row.id === unpaid.id)?.paid).toBe(true);
  });

  test('adds a family in a dialog and deletes one with consequences', async ({ page, seed }) => {
    const scenario = await seed.scenario({ families: 1, members: 2, paid: 1, year: YEAR });
    const paid = scenario.families[0];
    const created = `Shtuar ${seed.token}`;

    await page.goto(`/familjet?viti=${YEAR}`);
    await page.getByRole('button', { name: 'Shto familje' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Emri', { exact: true }).fill(created);
    await dialog.getByLabel('Emri i prindit', { exact: true }).fill('Prindi');
    await dialog.getByLabel('Mbiemri', { exact: true }).fill('Test');
    await dialog.getByLabel('Numri i anëtarëve', { exact: true }).fill('3');
    await dialog.getByRole('combobox', { name: 'Lagjja', exact: true }).selectOption({
      label: seed.neighbourhoodName,
    });
    await dialog.getByRole('button', { name: 'Ruaj', exact: true }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText(created).first()).toBeVisible();

    await page.goto(`/familjet?viti=${YEAR}&id=${paid.id}`);
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Fshi', exact: true }).click();

    const alert = page.getByRole('alertdialog');
    await expect(alert).toBeVisible();
    await expect(alert.getByText('A jeni të sigurt që dëshironi ta fshini këtë familje?')).toBeVisible();
    await expect(alert.getByText('Kjo fshin edhe 1 pagesa.')).toBeVisible();
    await alert.getByRole('button', { name: 'Fshi', exact: true }).click();

    await expect(page.getByText(paid.name)).toHaveCount(0);
  });
});
