import fs from 'node:fs';
import { test, expect } from '../helpers/fixtures';
import { rowFor } from '../helpers/seed';

test.describe('/pagesat-pakryera flows (new app)', () => {
  test('PDF download is a non-empty application/pdf', async ({ page, seed }) => {
    const nid = await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    await seed.createFamily({ ...family, members: 4 });
    await page.goto(`/pagesat-pakryera?year=${seed.year}&s_neighbourhood_id=${nid}`);
    await expect(rowFor(page, family.name)).toBeVisible();

    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/v1/invoices'));
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Gjenero Faturat/ }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = (await download.path()) as string;
    expect(fs.statSync(path).size).toBeGreaterThan(0);
    expect(fs.readFileSync(path).subarray(0, 4).toString()).toBe('%PDF');
  });

  test('404 from invoices shows a toast, not an alert', async ({ page, seed }) => {
    const nid = await seed.createNeighbourhood();
    const emptyYear = seed.year + 5;
    let dialogs = 0;
    page.on('dialog', (d) => { dialogs++; void d.dismiss(); });
    await page.goto(`/pagesat-pakryera?year=${emptyYear}&s_neighbourhood_id=${nid}`);
    await page.getByRole('button', { name: /Gjenero Faturat/ }).click();
    await expect(page.getByText(`No payments found for year ${emptyYear}`)).toBeVisible();
    expect(dialogs).toBe(0);
  });

  test('paying a family removes it from the list without reload', async ({ page, seed }) => {
    const nid = await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const other = { name: seed.name('Tjeter'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    await seed.createFamily({ ...family, members: 4 });
    await seed.createFamily({ ...other, members: 1 });
    await page.goto(`/pagesat-pakryera?year=${seed.year}&s_neighbourhood_id=${nid}`);
    await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));

    const row = rowFor(page, family.name);
    await expect(row).toBeVisible();
    await row.getByRole('button').nth(0).click();
    const dialog = page.getByRole('dialog', { name: 'Krijo Pagese' });
    await expect(dialog.getByRole('spinbutton').nth(0)).toHaveValue('12');
    await dialog.getByRole('button', { name: 'Ruaj' }).click();

    await expect(page.getByText('Pagesa u krijua')).toBeVisible();
    await expect(row).toHaveCount(0);
    await expect(rowFor(page, other.name)).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
  });

  test('multi-year pay creates a payment for every year', async ({ page, seed }) => {
    const nid = await seed.createNeighbourhood();
    const family = { name: seed.name('Familja'), middleName: 'Prindi', surname: `Mbiemri ${seed.token}` };
    const familyId = await seed.createFamily({ ...family, members: 2 });
    await page.goto(`/pagesat-pakryera?year=${seed.year}&s_neighbourhood_id=${nid}`);
    await rowFor(page, family.name).getByRole('button').nth(0).click();
    const dialog = page.getByRole('dialog', { name: 'Krijo Pagese' });
    await dialog.getByRole('checkbox', { name: /Krijo pages/ }).check();
    await dialog.getByRole('spinbutton').nth(2).fill(String(seed.year + 1));
    await dialog.getByRole('button', { name: 'Ruaj' }).click();
    await expect(page.getByText('Pagesa u krijua')).toBeVisible();
    const payments = (await (await page.request.get(`/api/v1/payments/family/${familyId}`)).json()) as { year: number }[];
    expect(payments.map((p) => p.year).sort()).toEqual([seed.year, seed.year + 1]);
  });
});
