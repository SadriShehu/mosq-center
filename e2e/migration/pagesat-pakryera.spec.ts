import fs from 'node:fs';
import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import {
  closeModal,
  dialogFor,
  expectAdminLayout,
  expectTableHeaders,
  formWith,
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

    // The list section and the filter form both have a "Kerko" button; scope
    // the client-side search button to the toolbar that holds the search input
    // and the Gjenero Faturat button.
    const search = page.getByPlaceholder('Kerko per familje');
    const searchButton = page
      .locator('div')
      .filter({ has: search })
      .filter({ has: page.getByRole('button', { name: /Gjenero Faturat/ }) })
      .last()
      .getByRole('button', { name: 'Kerko', exact: true });

    await search.fill(seed.token);
    await searchButton.click();
    await expect(row).toBeVisible();

    await search.fill('nuk-ekziston');
    await searchButton.click();
    await expect(row).toBeHidden();

    await search.fill(seed.token);
    await searchButton.click();
    await expect(row).toBeVisible();

    await row.getByRole('button').nth(0).click();
    const payDialog = dialogFor(page, 'Krijo Pagese');
    await expect(payDialog).toBeVisible();
    // The old modal's labels point at the filter inputs (for=amount has no
    // matching control, for=year is the filter year), so the dialog's own two
    // number inputs are addressed in order.
    const payAmount = payDialog.getByRole('spinbutton').nth(0);
    const payYear = payDialog.getByRole('spinbutton').nth(1);
    await expect(payAmount).toHaveValue('12');
    await expect(payYear).toHaveValue(String(seed.year));

    const multiYear = payDialog.getByRole('checkbox', { name: /Krijo pages/ });
    await expect(payDialog.getByText('Deri në vitin')).toBeHidden();
    await multiYear.check();
    await expect(payDialog.getByText('Deri në vitin')).toBeVisible();
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

  test('filters by year and neighbourhood through the form', async ({ page, seed }) => {
    const neighbourhoodId = await seed.createNeighbourhood();
    const family = {
      name: seed.name('Familja'),
      middleName: 'Prindi',
      surname: `Mbiemri ${seed.token}`,
    };
    await seed.createFamily({ ...family, members: 4 });

    await page.goto('/pagesat-pakryera');

    const filterForm = formWith(page, page.getByPlaceholder('Viti', { exact: true }));
    await filterForm.getByPlaceholder('Viti', { exact: true }).fill(String(seed.year));
    await filterForm
      .getByRole('combobox')
      .selectOption({ label: seed.neighbourhoodName });
    await filterForm.getByRole('button', { name: 'Kerko', exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`year=${seed.year}`));
    await expect(page).toHaveURL(new RegExp(`s_neighbourhood_id=${neighbourhoodId}`));
    await expect(
      page.getByRole('heading', {
        name: new RegExp(`Lista e familjeve papaguar per vitin\\s*${seed.year}`),
      }),
    ).toBeVisible();
    await expect(rowFor(page, family.name)).toBeVisible();
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
      .waitForEvent('dialog', { timeout: 2_000 })
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
