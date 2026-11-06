import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import {
  comboboxWithOption,
  dialogFor,
  expectNoReload,
  formWith,
  markNoReload,
} from '../helpers/ui';

test.describe('/lagjet flows (new app)', () => {
  test('validates required fields', async ({ page }) => {
    await page.goto('/lagjet');

    const createForm = formWith(page, page.getByPlaceholder('Emri i lagjes'));
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(page.getByText('Emri i lagjes eshte i detyrueshem')).toBeVisible();
    await expect(page.getByText('Zgjidh qytetin')).toBeVisible();
  });

  test('create, edit and delete refresh the list without a page reload', async ({
    page,
    seed,
  }) => {
    const name = seed.name('Lagje');
    const renamed = `${name} X`;

    await page.goto('/lagjet');
    await markNoReload(page);

    const createForm = formWith(page, page.getByPlaceholder('Emri i lagjes'));
    await createForm.getByPlaceholder('Emri i lagjes').fill(name);
    await comboboxWithOption(page, 'Zgjidh Qytetin').selectOption({ label: 'Gjakove' });
    await comboboxWithOption(page, 'Zgjidh Fshatin').selectOption({ label: 'Gjakove' });
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
    await expectNoReload(page);

    await rowFor(page, name).getByRole('button', { name: 'Ndrysho' }).click();
    const editDialog = dialogFor(page, 'Ndrysho Lagjen');
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel('Emri i lagjes').fill(renamed);
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
    const name = seed.name('Lagje');

    await page.route('**/api/v1/neighbourhoods', async (route) => {
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

    await page.goto('/lagjet');
    const createForm = formWith(page, page.getByPlaceholder('Emri i lagjes'));
    await createForm.getByPlaceholder('Emri i lagjes').fill(name);
    await comboboxWithOption(page, 'Zgjidh Qytetin').selectOption({ label: 'Gjakove' });
    await comboboxWithOption(page, 'Zgjidh Fshatin').selectOption({ label: 'Gjakove' });
    await createForm.getByRole('button', { name: 'Ruaj' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'Databaza nuk eshte e disponueshme' }).first(),
    ).toBeVisible();
  });
});
