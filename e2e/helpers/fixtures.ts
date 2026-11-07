import { test as base } from '@playwright/test';
import { Seed } from './seed';

export const test = base.extend<{ seed: Seed }>({
  seed: async ({ request }, use) => {
    const seed = new Seed(request);
    await use(seed);
    await seed.cleanup();
  },
});

export { expect } from '@playwright/test';
