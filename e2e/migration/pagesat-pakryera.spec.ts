import fs from 'node:fs';
import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import {
  closeModal,
  expectAdminLayout,
  expectTableHeaders,
} from '../helpers/ui';

const HEADERS = [
  'Emri',
  'Prindi',
  'Mbimeri',
  'Numri i antareve',
  'Lagje',
  'Krijuar me',
  'Ndryshuar me',
  'Paguaj',
];

test.describe('/pagesat-pakryera', () => {
  test('lists unpaid families, searches, opens the pay dialog and generates the PDF', async ({
    page,
    seed,
  }) => {
    const neighbourhoodId = await seed.createNeighbourhood();
    const family = {
      name: seed.name('Familja'),
      middleName: 'Prindi',
      surname: `Mbiemri ${seed.token}`,
    };
    const familyId = await seed.createFamily({ ...family, members: 4 });

    const url = `/pagesat-pakryera?year=${seed.year}&s_neighbourhood_id=${neighbourhoodId}`;
    await page.goto(url);

    await expectAdminLayout(page);
    await expect(page.getByRole('heading', { name: 'Kerko pagesat e pakryera' })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: new RegExp(`Lista e familjeve papaguar per vitin\\s*${seed.year}`),
      }),
    ).toBeVisible();
    await expectTableHeaders(page, HEADERS);

    const row = rowFor(page, family.name);
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: family.name, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: 'Prindi', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: family.surname, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: '4', exact: true })).toBeVisible();
    await expect(
      row.getByRole('cell', { name: seed.neighbourhoodName, exact: true }),
    ).toBeVisible();

    const search = page.getByPlaceholder('Kerko per familje');
    await search.fill(seed.token);
    await page.getByRole('button', { name: 'Kerko', exact: true }).last().click();
    await expect(row).toBeVisible();

    await search.fill('nuk-ekziston');
    await page.getByRole('button', { name: 'Kerko', exact: true }).last().click();
    await expect(row).toBeHidden();

    await search.fill(seed.token);
    await page.getByRole('button', { name: 'Kerko', exact: true }).last().click();
    await expect(row).toBeVisible();

    await row.getByRole('button').nth(0).click();
    await expect(page.getByText('Krijo Pagese', { exact: true })).toBeVisible();
    const payAmount = page.getByRole('spinbutton').nth(1);
    const payYear = page.getByRole('spinbutton').nth(2);
    await expect(payAmount).toHaveValue('12');
    await expect(payYear).toHaveValue(String(seed.year));

    const multiYear = page.getByRole('checkbox', { name: /Krijo pages/ });
    await expect(page.getByText('Deri në vitin')).toBeHidden();
    await multiYear.check();
    await expect(page.getByText('Deri në vitin')).toBeVisible();
    await multiYear.uncheck();
    await closeModal(page, 'Krijo Pagese');

    // Invoices are generated for families that have not paid this year.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Gjenero Faturat/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    expect(fs.statSync(downloadPath as string).size).toBeGreaterThan(0);

    await seed.createPayment(familyId, seed.year, 12);

    await page.goto(url);
    await expect(rowFor(page, family.name)).toHaveCount(0);
  });

  test('shows the "no payments" message when the invoice PDF is missing', async ({
    page,
    seed,
  }) => {
    const neighbourhoodId = await seed.createNeighbourhood();
    const emptyYear = seed.year + 5;

    await page.goto(
      `/pagesat-pakryera?year=${emptyYear}&s_neighbourhood_id=${neighbourhoodId}`,
    );

    const dialogPromise = page
      .waitForEvent('dialog', { timeout: 3_000 })
      .catch(() => null);
    await page.getByRole('button', { name: /Gjenero Faturat/ }).click();
    const dialog = await dialogPromise;

    if (dialog) {
      expect(dialog.message()).toContain(`No payments found for year ${emptyYear}`);
      await dialog.dismiss();
    } else {
      await expect(
        page.getByText(new RegExp(`No payments found for year ${emptyYear}`)),
      ).toBeVisible();
    }
  });
});
