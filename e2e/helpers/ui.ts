import { Page, expect } from '@playwright/test';

/** Marks the current document so a full reload can be detected later. */
export async function markNoReload(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __qaNoReload?: boolean }).__qaNoReload = true;
  });
}

/** Fails if the document was reloaded since markNoReload(). */
export async function expectNoReload(page: Page) {
  const alive = await page.evaluate(
    () => (window as unknown as { __qaNoReload?: boolean }).__qaNoReload === true,
  );
  expect(alive, 'the page must refresh without a full reload').toBe(true);
}
