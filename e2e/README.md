# e2e — migration parity and flow tests

Playwright suite for the Next.js migration.

- `migration/<page>.spec.ts` — written against the **old** Go html/template app and
  must pass **unchanged** against the **new** app. Selectors are role/label/text
  only; every test seeds its own data through `/api/v1` and cleans it up.
- `flows/<page>.spec.ts` — new-app-only behaviour (toasts, validation, no-reload
  refresh, 401 → `/login`).

`BASE_URL` selects the target (default `http://localhost:8081`).

## Install

```bash
cd e2e
npm install
npx playwright install chromium
```

## Run the old app (baseline, port 8081)

```bash
git worktree add /tmp/mosq-old main   # once
# main hardcodes :8080; either run on 8080 and set BASE_URL accordingly,
# or temporarily change config/config.go Port to ":8081".
cd /tmp/mosq-old
MONGO_COLLECTION_NAME=mosq_qa go run ./cmd
```

## Run the new app

```bash
# from the repo worktree (Go API + embedded/static frontend)
PORT=8086 MONGO_COLLECTION_NAME=mosq_qa go run ./cmd

# during page development, with Next dev proxying to Go
cd web
API_ORIGIN=http://localhost:8086 npm run dev -- -p 3006
```

When using `next dev`, point the suite at `http://localhost:3006`.

## Run the suites

```bash
cd e2e
BASE_URL=http://localhost:8081 npm run test:migration   # old app
BASE_URL=http://localhost:8086 npm run test:migration   # new app (must be identical)
BASE_URL=http://localhost:3006 npm run test:flows       # new app only
```

The HTML report is written to `e2e/playwright-report/` (`npm run report`).
Traces, screenshots and videos are kept on failure under `e2e/test-results/`.
