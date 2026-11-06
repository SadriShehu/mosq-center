# e2e — acceptance + legacy parity tests

Playwright suite for the Next.js app.

- `specs/<area>.spec.ts` — new acceptance suite for the redesign
  (`docs/redesign/UX.md`). Runs by default on both projects.
- `legacy/*.spec.ts` — the archived migration/parity suite. **Not part of the
  default run**; it targets the app at tag `migration-parity`.
- `helpers/` — seed fixtures, selector helpers, layout assertions.

`BASE_URL` selects the target (default `http://localhost:8086`).

## Projects

| Project | Viewport | Device flags |
|---|---|---|
| `desktop` | 1280×800 | — |
| `phone` | 390×844 | `isMobile`, `hasTouch` |

Every new acceptance spec must pass on **both** projects:

```bash
npx playwright test --project=desktop
npx playwright test --project=phone
npx playwright test                 # both
npx playwright test --list          # shows tests under desktop and phone
```

## Install

```bash
cd e2e
npm ci
npx playwright install chromium
```

## Run the app

```bash
# Go API + embedded static build
PORT=8086 MONGO_COLLECTION_NAME=mosq_qa go run ./cmd

# during page development, with Next dev proxying to Go
cd web
API_ORIGIN=http://localhost:8086 npm run dev -- -p 3006
```

When using `next dev`, point the suite at `http://localhost:3006`.

## Run the default suites

```bash
cd e2e
BASE_URL=http://localhost:8086 npm test            # acceptance specs, desktop + phone
BASE_URL=http://localhost:3006 npm test            # same against next dev
```

The HTML report is written to `e2e/playwright-report/` (`npm run report`).
Traces, screenshots and videos are kept on failure under `e2e/test-results/`.

## Run the legacy migration suite

The legacy suite is unchanged from the migration wave and targets the app at tag
`migration-parity` (`ccfcab4`), so it keeps a single desktop project. Build and
run that tag, then point `BASE_URL` at it:

```bash
# once, from the main repo/worktree
git worktree add /tmp/mosq-parity migration-parity
docker build -t mosq-parity /tmp/mosq-parity

# Mongo must be running (docker compose up -d). host.docker.internal reaches it
# from the container on Docker Desktop.
docker run --rm -p 8088:8088 \
  -e PORT=8088 \
  -e MONGO_COLLECTION_NAME=mosq_qa_legacy \
  -e MONGO_DB_URI=mongodb://root:root@host.docker.internal:27017 \
  mosq-parity

cd e2e
BASE_URL=http://localhost:8088 npx playwright test --config playwright.legacy.config.ts
```

`npm run test:legacy` is the same command (set `BASE_URL` yourself).

## Fixtures

`helpers/fixtures.ts` exposes a `seed` fixture; every entity it creates carries a
unique token and is removed again by `seed.cleanup()` after the test.

```ts
import { test, expect } from '../helpers/fixtures';

test('example', async ({ page, seed }) => {
  const s = await seed.scenario({ families: 3, members: 4, paid: 1 });
  // s.neighbourhoodId, s.families, s.paidFamilies, s.year, s.feePerMember

  const stats = await seed.stats(s.year); // GET /api/v1/stats
  expect(stats.paid_families).toBeGreaterThanOrEqual(1);

  await page.goto(`/mbledhja?lagjja=${s.neighbourhoodId}&viti=${s.year}`);
});
```

Useful `Seed` methods:

| Method | Purpose |
|---|---|
| `createNeighbourhood(overrides?)` | `POST /api/v1/neighbourhoods`, returns id |
| `createFamily(spec)` | `POST /api/v1/families`, returns id |
| `createFamilies(n, members?)` | n families with unique names, returns records |
| `createPayment(familyId, year, amount?)` | `POST /api/v1/payments` |
| `scenario({families, members, paid, year, feePerMember})` | neighbourhood + families + payments |
| `stats(year)` | typed `GET /api/v1/stats` (shape from `docs/redesign/UX.md`) |
| `name(prefix?)`, `token`, `year` | unique names / suffix / 4-digit year |
| `cleanup()` | deletes seeded families, their payments and neighbourhood |

## Selector conventions

New acceptance specs use role/label/text selectors with the Albanian strings
from `docs/redesign/UX.md` (`web/lib/sq.ts`), never classes or ids. Legacy specs
still contain a few documented positional exceptions because the old app offers
no accessible handle:

- **Row action buttons** (legacy `lagjet`, `familjet`, `pagesat`): icon-only
  buttons; first in a row is edit, second is delete.
- **Sidebar toggle** (legacy): icon-only; first button inside the top
  `navigation` landmark.
- **Pay dialog inputs** (legacy `/pagesat-pakryera`): broken `for=` labels, so
  amount and year are addressed in order inside the dialog.
- **Two "Kerko" buttons** (legacy `/pagesat-pakryera`): the search button is
  scoped to the toolbar holding the search input and "Gjenero Faturat".

## CI

`.github/workflows/pipeline.yml` currently does **not** run Playwright, so there
is nothing to update there. If e2e is added later, install chromium and run the
default projects (`npx playwright test`) — never the legacy config.
