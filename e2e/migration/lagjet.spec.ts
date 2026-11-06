import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import {
  closeModal,
  comboboxWithOption,
  expectAdminLayout,
  expectTableHeaders,
  visibleText,
} from '../helpers/ui';

const HEADERS = [
  'Emri i lagjes',
  'Qyteti',
  'Fshati',
  'Shteti',
  'Kodi Postal',
  'Krijuar me',
  'Ndryshuar me',
  'Ndrysho',
  'Fshi',
];

test.describe('/lagjet', () => {
  test('creates a neighbourhood, auto-fills the region and opens both dialogs', async ({
    page,
    seed,
  }) => {
    const name = seed.name('Lagje');
    await page.goto('/lagjet');

    await expectAdminLayout(page);
    await expect(page.getByRole('heading', { name: 'Krijo Lagje' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lista e lagjeve' })).toBeVisible();
    await expectTableHeaders(page, HEADERS);

    const region = comboboxWithOption(page, 'Zgjidh Qytetin');
    await region.selectOption({ label: 'Junik' });

    await expect(page.getByPlaceholder('Kodi Postal')).toHaveValue('51050');

    const city = comboboxWithOption(page, 'Zgjidh Fshatin');
    await expect(city.getByRole('option', { name: 'Jasiq' })).toHaveCount(1);
    await city.selectOption({ label: 'Jasiq' });

    await page.getByPlaceholder('Emri i lagjes').fill(name);
    await page.getByRole('button', { name: 'Ruaj' }).click();

    const row = rowFor(page, name);
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name: 'Junik', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: 'Jasiq', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: '51050', exact: true })).toBeVisible();

    await row.getByRole('button').nth(0).click();
    await expect(page.getByText('Ndrysho Lagjen', { exact: true })).toBeVisible();
    await closeModal(page, 'Ndrysho Lagjen');

    await row.getByRole('button').nth(1).click();
    await expect(
      visibleText(page, 'A jeni i sigurt qe deshironi te fshini kete lagje?'),
    ).toBeVisible();
    await expect(visibleText(page, 'Konfirmo fshirjen')).toBeVisible();
  });
});
