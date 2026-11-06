import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import {
  comboboxWithOption,
  dialogFor,
  expectNoReload,
  fieldError,
  formWith,
  markNoReload,
} from '../helpers/ui';

function familyForm(page: import('@playwright/test').Page) {
  return formWith(page, page.getByPlaceholder('Emri', { exact: true }));
}

test.describe('/familjet flows (new app)', () => {
  test('validates required fields and a positive member count', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    await page.goto('/familjet');

    const createForm = familyForm(page);
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(fieldError(page, 'Emri eshte i detyrueshem')).toBeVisible();
    await expect(fieldError(page, 'Mbiemri eshte i detyrueshem')).toBeVisible();
    await expect(fieldError(page, 'Numri i antareve duhet te jete pozitiv')).toBeVisible();
    await expect(fieldError(page, 'Zgjidh lagjen')).toBeVisible();

    await createForm.getByPlaceholder('Emri', { exact: true }).fill(seed.name('Familja'));
    await createForm.getByPlaceholder('Mbiemri', { exact: true }).fill(`Mbiemri ${seed.token}`);
    await createForm.getByPlaceholder('Numri i anetareve', { exact: true }).fill('-1');
    await comboboxWithOption(page, 'Zgjidh lagjen').selectOption({
      label: seed.neighbourhoodName,
    });
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(fieldError(page, 'Numri i antareve duhet te jete pozitiv')).toBeVisible();
  });

  test('create, edit and delete refresh the list without a page reload', async ({
    page,
    seed,
  }) => {
    await seed.createNeighbourhood();
    const name = seed.name('Familja');
    const surname = `Mbiemri ${seed.token}`;
    const renamed = `${name} X`;

    await page.goto('/familjet');
    await markNoReload(page);

    const createForm = familyForm(page);
    await createForm.getByPlaceholder('Emri', { exact: true }).fill(name);
    await createForm.getByPlaceholder('Emri i Prindit', { exact: true }).fill('Prindi');
    await createForm.getByPlaceholder('Mbiemri', { exact: true }).fill(surname);
    await createForm.getByPlaceholder('Numri i anetareve', { exact: true }).fill('4');
    await comboboxWithOption(page, 'Zgjidh lagjen').selectOption({
      label: seed.neighbourhoodName,
    });
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
    await expectNoReload(page);

    await rowFor(page, name).getByRole('button', { name: 'Ndrysho' }).click();
    const editDialog = dialogFor(page, 'Ndrysho Familjen');
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel('Emri', { exact: true }).fill(renamed);
    await editDialog.getByRole('button', { name: 'Ruaj' }).click();

    await expect(page.getByRole('cell', { name: renamed, exact: true })).toBeVisible();
    await expectNoReload(page);

    await rowFor(page, renamed).getByRole('button', { name: 'Fshi' }).click();
    const confirmDialog = dialogFor(page, 'Konfirmo fshirjen');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Fshije' }).click();

    await expect(page.getByRole('cell', { name: renamed, exact: true })).toHaveCount(0);
    await expectNoReload(page);
  });

  test('shows a toast when create fails', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const name = seed.name('Familja');

    await page.route('**/api/v1/families', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Databaza nuk eshte e disponueshme' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/familjet');
    const createForm = familyForm(page);
    await createForm.getByPlaceholder('Emri', { exact: true }).fill(name);
    await createForm.getByPlaceholder('Mbiemri', { exact: true }).fill(`Mbiemri ${seed.token}`);
    await createForm.getByPlaceholder('Numri i anetareve', { exact: true }).fill('4');
    await comboboxWithOption(page, 'Zgjidh lagjen').selectOption({
      label: seed.neighbourhoodName,
    });
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'Databaza nuk eshte e disponueshme' }).first(),
    ).toBeVisible();
  });
});
