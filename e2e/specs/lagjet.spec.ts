import { test, expect } from '../helpers/fixtures';
import type { Page } from '@playwright/test';

const YEAR = new Date().getFullYear();
const percent = new Intl.NumberFormat('sq-AL', { style: 'percent', maximumFractionDigits: 0 });

/** A neighbourhood row on desktop or card on phone. */
function neighbourhoodItem(page: Page, name: string) {
  return page
    .getByRole('row')
    .filter({ hasText: name })
    .or(page.getByRole('listitem').filter({ hasText: name }))
    .first();
}

test.describe('/lagjet', () => {
  test('shows families count, % paid and collected/expected from stats', async ({ page, seed }) => {
    const scenario = await seed.scenario({ families: 2, members: 3, paid: 1, year: YEAR });
    const stats = await seed.stats(YEAR);
    const neighbourhood = stats.neighbourhoods.find((n) => n.id === scenario.neighbourhoodId);
    expect(neighbourhood, 'stats should include the seeded neighbourhood').toBeTruthy();

    await page.goto(`/lagjet?viti=${YEAR}`);
    await expect(page.getByRole('heading', { name: 'Lagjet', exact: true })).toBeVisible();

    const row = neighbourhoodItem(page, seed.neighbourhoodName);
    await expect(row).toBeVisible();
    await expect(
      row.getByText(`${percent.format(neighbourhood!.paid_families / neighbourhood!.families)} (${neighbourhood!.paid_families}/${neighbourhood!.families})`),
    ).toBeVisible();
    const money = (value: number) => page.evaluate(
      (v) => new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' }).format(v),
      value,
    );
    await expect(row.getByText(await money(neighbourhood!.collected), { exact: true })).toBeVisible();
    await expect(row.getByText(await money(neighbourhood!.expected), { exact: true })).toBeVisible();
    await expect(row.getByText(String(neighbourhood!.families), { exact: true })).toBeVisible();

    await row.getByRole('button', { name: 'Fshi', exact: true }).click();
    const alert = page.getByRole('alertdialog');
    await expect(alert.getByText('Kjo lagje ka 2 familje.')).toBeVisible();
    await alert.getByRole('button', { name: 'Anulo', exact: true }).click();
    await expect(alert).toBeHidden();
  });

  test('adds a neighbourhood with region autofill, edits and deletes it', async ({ page, seed }) => {
    const created = `Lagje ${seed.token}`;
    const renamed = `${created} X`;

    await page.goto(`/lagjet?viti=${YEAR}`);
    await page.getByRole('button', { name: 'Shto lagje', exact: true }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Emri', { exact: true }).fill(created);
    await dialog.getByRole('combobox', { name: 'Qyteti', exact: true }).selectOption({ label: 'Junik' });
    await expect(dialog.getByLabel('Kodi postar', { exact: true })).toHaveValue('51050');
    await dialog.getByRole('combobox', { name: 'Fshati', exact: true }).selectOption({ label: 'Jasiq' });
    await dialog.getByRole('button', { name: 'Ruaj', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    const row = neighbourhoodItem(page, created);
    await expect(row).toBeVisible();
    await expect(row.getByText('Junik', { exact: true })).toBeVisible();
    await expect(row.getByText('Jasiq', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: `Ndrysho ${created}`, exact: true }).click();
    const edit = page.getByRole('dialog');
    await edit.getByLabel('Emri', { exact: true }).fill(renamed);
    await edit.getByRole('button', { name: 'Ruaj', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(neighbourhoodItem(page, renamed)).toBeVisible();

    await neighbourhoodItem(page, renamed).getByRole('button', { name: `Fshi ${renamed}`, exact: true }).click();
    const alert = page.getByRole('alertdialog');
    await expect(alert.getByText('A jeni të sigurt që dëshironi ta fshini këtë lagje?')).toBeVisible();
    await expect(alert.getByText(/Kjo lagje ka \d+ familje\./)).toBeVisible();
    await alert.getByRole('button', { name: 'Fshi', exact: true }).click();
    await expect(page.getByText(renamed)).toHaveCount(0);
  });
});
