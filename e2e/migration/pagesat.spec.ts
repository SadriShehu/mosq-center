import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import {
  closeModal,
  expectAdminLayout,
  expectTableHeaders,
  formWith,
  visibleText,
} from '../helpers/ui';

const HEADERS = [
  'Emri i familjes',
  'Anetaret',
  'Shuma e pageses',
  'Viti',
  'Emri i lagjes',
  'Krijuar me',
  'Ndryshuar me',
  'Ndrysho',
  'Fshi',
];

test.describe('/pagesat', () => {
  test('creates a payment with amount auto-fill, filter and dialogs', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const family = {
      name: seed.name('Familja'),
      middleName: 'Prindi',
      surname: `Mbiemri ${seed.token}`,
    };
    await seed.createFamily({ ...family, members: 4 });
    const displayName = `${family.name} ${family.middleName} ${family.surname}`;

    await page.goto('/pagesat');

    await expectAdminLayout(page);
    await expect(page.getByRole('heading', { name: 'Krijo Pagese' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kerko pagesat sipas vitit' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kerko pagesat sipas familjes' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lista e pagesave' })).toBeVisible();
    await expectTableHeaders(page, HEADERS);

    const createForm = formWith(page, page.getByPlaceholder('Shuma per pagese'));
    const filterForm = formWith(page, page.getByRole('button', { name: 'Kerko vitin' }));

    const rangeYear = createForm.getByPlaceholder('Deri ne vitin', { exact: true });
    await expect(rangeYear).toBeHidden();
    const multiYear = createForm.getByRole('checkbox', { name: 'Krijo pagese per disa vite' });
    await multiYear.check();
    await expect(rangeYear).toBeVisible();
    await multiYear.uncheck();
    await expect(rangeYear).toBeHidden();

    await createForm.getByRole('combobox').selectOption({ label: displayName });

    const amount = createForm.getByPlaceholder('Shuma per pagese');
    await expect(amount).toHaveValue('12');

    await createForm.getByPlaceholder('Viti', { exact: true }).fill(String(seed.year));
    const created = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/payments') &&
        response.request().method() === 'POST' &&
        response.status() === 201,
    );
    await createForm.getByRole('button', { name: 'Ruaj' }).click();
    await created;
    // Old app reloads the page, new app resets the form; both leave the family
    // select empty once the mutation has been applied.
    await expect(createForm.getByRole('combobox')).toHaveValue('');

    // Filter through the form so the year stays in the URL as the old page does.
    await filterForm.getByPlaceholder('Viti', { exact: true }).fill(String(seed.year));
    await filterForm.getByRole('button', { name: 'Kerko vitin' }).click();
    await expect(page).toHaveURL(new RegExp(`s_year=${seed.year}`));

    const row = rowFor(page, family.name);
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: displayName, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: '4', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: /^12(\.0+)?$/ })).toBeVisible();
    await expect(row.getByRole('cell', { name: String(seed.year), exact: true })).toBeVisible();
    await expect(
      row.getByRole('cell', { name: seed.neighbourhoodName, exact: true }),
    ).toBeVisible();

    const search = page.getByPlaceholder('Kerko per familje');
    await search.fill(seed.token);
    await page.getByRole('button', { name: 'Kerko familje' }).click();
    await expect(row).toBeVisible();

    await search.fill('nuk-ekziston');
    await page.getByRole('button', { name: 'Kerko familje' }).click();
    await expect(row).toBeHidden();

    await search.fill(seed.token);
    await page.getByRole('button', { name: 'Kerko familje' }).click();
    await expect(row).toBeVisible();

    await row.getByRole('button').nth(0).click();
    await expect(page.getByText('Ndrysho Pagesen', { exact: true })).toBeVisible();
    await closeModal(page, 'Ndrysho Pagesen');

    await row.getByRole('button').nth(1).click();
    await expect(
      visibleText(page, 'A jeni i sigurt qe deshironi te fshini kete pagese?'),
    ).toBeVisible();
    await expect(visibleText(page, 'Konfirmo fshirjen')).toBeVisible();
  });

  test('?s_year= shows only payments for that year', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const family = {
      name: seed.name('Familja'),
      middleName: 'Prindi',
      surname: `Mbiemri ${seed.token}`,
    };
    const familyId = await seed.createFamily({ ...family, members: 3 });
    await seed.createPayment(familyId, seed.year, 9);
    await seed.createPayment(familyId, seed.year + 1, 9);

    await page.goto(`/pagesat?s_year=${seed.year}`);

    expect(page.url()).toContain(`s_year=${seed.year}`);
    const rows = page.getByRole('row').filter({ hasText: family.name });
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByRole('cell', { name: String(seed.year), exact: true })).toBeVisible();
    await expect(
      page.getByRole('cell', { name: String(seed.year + 1), exact: true }),
    ).toHaveCount(0);
  });
});
