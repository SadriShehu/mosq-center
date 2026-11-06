import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';
import { formWith } from '../helpers/ui';

test.describe('/pagesat flows (new app)', () => {
  test('amount auto-fills to members x 3', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    await seed.createFamily({ ...family, members: 7 });
    await page.goto('/pagesat');
    const form = formWith(page, page.getByPlaceholder('Shuma per pagese'));
    await form
      .getByRole('combobox')
      .selectOption({ label: `${family.name} ${family.middleName} ${family.surname}` });
    await expect(form.getByPlaceholder('Shuma per pagese')).toHaveValue('21');
  });

  test('multi-year creates one payment per year and the list refreshes without reload', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const familyId = await seed.createFamily({ ...family, members: 2 });
    await page.goto('/pagesat');
    // marker survives only if the page is not reloaded
    await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));

    const form = formWith(page, page.getByPlaceholder('Shuma per pagese'));
    await form
      .getByRole('combobox')
      .selectOption({ label: `${family.name} ${family.middleName} ${family.surname}` });
    await form.getByPlaceholder('Viti', { exact: true }).fill(String(seed.year));
    await form.getByRole('checkbox', { name: 'Krijo pagese per disa vite' }).check();
    await form.getByPlaceholder('Deri ne vitin', { exact: true }).fill(String(seed.year + 2));
    await form.getByRole('button', { name: 'Ruaj' }).click();

    await expect(page.getByText('Pagesa u krijua')).toBeVisible();

    const res = await page.request.get(`/api/v1/payments/family/${familyId}`);
    const payments = (await res.json()) as { year: number }[];
    expect(payments.map((p) => p.year).sort()).toEqual([seed.year, seed.year + 1, seed.year + 2]);

    // Filter by a year in the middle of the range; list shows exactly that one.
    const filterForm = formWith(page, page.getByRole('button', { name: 'Kerko vitin' }));
    await filterForm.getByPlaceholder('Viti', { exact: true }).fill(String(seed.year + 1));
    await filterForm.getByRole('button', { name: 'Kerko vitin' }).click();
    await expect(rowFor(page, family.name)).toHaveCount(1);
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
  });

  test('?s_year= survives reload', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const familyId = await seed.createFamily({ ...family, members: 3 });
    await seed.createPayment(familyId, seed.year, 9);
    await seed.createPayment(familyId, seed.year + 1, 9);

    await page.goto(`/pagesat?s_year=${seed.year}`);
    await expect(rowFor(page, family.name)).toHaveCount(1);
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`s_year=${seed.year}`));
    await expect(rowFor(page, family.name)).toHaveCount(1);
    await expect(page.getByRole('cell', { name: String(seed.year + 1), exact: true })).toHaveCount(0);
    await expect(page.getByPlaceholder('Viti', { exact: true }).last()).toHaveValue(String(seed.year));
  });

  test('deleting a family (which cascades its payments) does not crash the list', async ({ page, seed }) => {
    // Go removes a family's payments when the family is deleted, so a truly orphaned
    // payment cannot be made through the API; nil-safety of the join is covered by Go unit tests.
    await seed.createNeighbourhood();
    const gone = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const kept = { name: seed.name('Tjeter'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const goneId = await seed.createFamily({ ...gone, members: 3 });
    const keptId = await seed.createFamily({ ...kept, members: 2 });
    await seed.createPayment(goneId, seed.year, 9);
    await seed.createPayment(keptId, seed.year, 6);
    expect((await page.request.delete(`/api/v1/families/${goneId}`)).ok()).toBe(true);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/pagesat?s_year=${seed.year}`);
    await expect(page.getByRole('heading', { name: 'Lista e pagesave' })).toBeVisible();
    await expect(rowFor(page, kept.name)).toHaveCount(1);
    await expect(rowFor(page, gone.name)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('delete removes the row and shows a toast', async ({ page, seed }) => {
    await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const familyId = await seed.createFamily({ ...family, members: 3 });
    await seed.createPayment(familyId, seed.year, 9);
    await page.goto(`/pagesat?s_year=${seed.year}`);
    const row = rowFor(page, family.name);
    await row.getByRole('button', { name: 'Fshi' }).click();
    await page.getByRole('dialog', { name: 'Konfirmo fshirjen' }).getByRole('button', { name: 'Fshije' }).click();
    await expect(page.getByText('Pagesa u fshi')).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
