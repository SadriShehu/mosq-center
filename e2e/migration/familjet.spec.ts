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
  'Emri',
  'Prindi',
  'Mbimeri',
  'Numri i antareve',
  'Lagje',
  'Krijuar me',
  'Ndryshuar me',
  'Ndrysho',
  'Fshi',
];

test.describe('/familjet', () => {
  test('creates a family, lists it and opens both dialogs', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const name = seed.name('Familja');
    const surname = `Mbiemri ${seed.token}`;

    await page.goto('/familjet');

    await expectAdminLayout(page);
    await expect(page.getByRole('heading', { name: 'Krijo Familje' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lista e familjeve' })).toBeVisible();
    await expectTableHeaders(page, HEADERS);

    await page.getByPlaceholder('Emri', { exact: true }).fill(name);
    await page.getByPlaceholder('Emri i Prindit', { exact: true }).fill('Prindi');
    await page.getByPlaceholder('Mbiemri', { exact: true }).fill(surname);
    await page.getByPlaceholder('Numri i anetareve', { exact: true }).fill('5');
    await comboboxWithOption(page, 'Zgjidh lagjen').selectOption({
      label: seed.neighbourhoodName,
    });
    await page.getByRole('button', { name: 'Ruaj' }).click();

    const row = rowFor(page, name);
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell', { name, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: 'Prindi', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: surname, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: '5', exact: true })).toBeVisible();
    await expect(
      row.getByRole('cell', { name: seed.neighbourhoodName, exact: true }),
    ).toBeVisible();

    await row.getByRole('button').nth(0).click();
    await expect(page.getByText('Ndrysho Familjen', { exact: true })).toBeVisible();
    await closeModal(page, 'Ndrysho Familjen');

    await row.getByRole('button').nth(1).click();
    await expect(
      visibleText(page, 'A jeni i sigurt qe deshironi te fshini kete familje?'),
    ).toBeVisible();
    await expect(visibleText(page, 'Konfirmo fshirjen')).toBeVisible();
  });
});
