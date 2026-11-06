import { Locator, Page, expect } from '@playwright/test';

/** Finds a <select> by one of the option labels it renders. */
export function comboboxWithOption(page: Page, optionName: string) {
  return page.getByRole('combobox').filter({
    has: page.getByRole('option', { name: optionName }),
  });
}

export const PRAYER_LABELS = [
  'Sabahu',
  'Lindja e Diellit',
  'Dreka',
  'Ikindia',
  'Akshami',
  'Jacia',
  'Pjesa e tretë e natës',
];

/**
 * The old templates repeat modals inside every table row, so the same text can
 * exist several times in the DOM. Assertions about an open dialog must look at
 * the visible copy only.
 */
export function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true }).first();
}

/** A form located by a control it contains (keeps create/filter forms apart). */
export function formWith(page: Page, control: Locator) {
  return page.locator('form').filter({ has: control });
}

/**
 * The open modal, located by its title. The old Bootstrap modal exposes the
 * title as the dialog's accessible name; react-bootstrap does not, so match the
 * title text inside the dialog instead.
 */
export function dialogFor(page: Page, title: string) {
  return page
    .getByRole('dialog')
    .filter({ has: page.getByText(title, { exact: true }) })
    .filter({ visible: true })
    .first();
}

/** Every prayer label is present and at least seven times are rendered. */
export async function expectPrayerGrid(page: Page) {
  for (const label of PRAYER_LABELS) {
    await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
  }

  const times = page.getByText(/\b\d{1,2}:\d{2}\b/);
  await expect(times.first()).toBeVisible();
  expect(await times.count()).toBeGreaterThanOrEqual(7);
}

/** Sidebar + top nav of the authenticated layout (layout.html). */
export async function expectAdminLayout(page: Page) {
  await expect(page.getByText('Xhamia Qender')).toBeVisible();

  const sidebarLinks: Record<string, string> = {
    Lagjet: '/lagjet',
    Familjet: '/familjet',
    Pagesat: '/pagesat',
    'Pagesat e pakryera': '/pagesat-pakryera',
  };
  for (const [name, href] of Object.entries(sidebarLinks)) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }

  await expect(page.getByRole('link', { name: 'Fillimi', exact: true })).toHaveAttribute(
    'href',
    '/user',
  );

  await page.getByText('Shpalos', { exact: true }).click();
  await expect(page.getByRole('link', { name: /Profili/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Profili/ })).toHaveAttribute('href', '/user');
  await expect(page.getByRole('link', { name: /Dil/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Dil/ })).toHaveAttribute('href', '/logout');

  await page.keyboard.press('Escape');
}

/** The sidebar toggle button folds the sidebar away. */
export async function expectSidebarToggle(page: Page) {
  const logo = page.getByText('Xhamia Qender');
  const before = await logo.boundingBox();
  expect(before, 'sidebar should be expanded before toggling').not.toBeNull();

  // The old toggle button is icon-only and has no accessible name; scope it to
  // the top navigation (it is the first button there) instead of page-wide.
  await page.getByRole('navigation').getByRole('button').first().click();

  await expect
    .poll(
      async () => {
        const after = await logo.boundingBox();
        if (!after) {
          return true;
        }
        return before !== null && after.x < before.x - 10;
      },
      { message: 'sidebar toggle should move or hide the sidebar' },
    )
    .toBe(true);
}

/** Sidebar + top nav of the public layout (layout-noauth.html). */
export async function expectPublicLayout(page: Page) {
  await expect(page.getByText('Xhamia Qender')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fillimi', exact: true })).toHaveAttribute(
    'href',
    '/',
  );
  await expect(page.getByRole('link', { name: 'Kyqu', exact: true })).toHaveAttribute(
    'href',
    '/login',
  );
  await expect(page.getByRole('link', { name: 'Lagjet', exact: true })).toHaveCount(0);
}

/**
 * A field-level validation error, matched by its exact text inside a role=alert
 * container (some messages are substrings of option labels or of each other).
 */
export function fieldError(page: Page, message: string) {
  const escaped = message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page
    .getByRole('alert')
    .filter({ hasText: new RegExp(`^${escaped}$`) })
    .first();
}

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

export async function expectTableHeaders(page: Page, headers: string[]) {
  for (const header of headers) {
    await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
  }
}

/**
 * Closes the open modal. The lookup is scoped to the dialog so a toast's own
 * close button can never be clicked instead.
 */
export async function closeModal(page: Page, heading: string) {
  const dialog = dialogFor(page, heading);
  const closeButton = dialog.getByRole('button', { name: 'Close', exact: true });

  if ((await closeButton.count()) > 0) {
    await closeButton.first().click();
  } else {
    await page.keyboard.press('Escape');
  }

  await expect(page.getByText(heading, { exact: true })).toBeHidden();
}
