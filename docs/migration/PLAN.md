# Next.js migration — team brief

Goal: replace the Go html/template frontend (`internal/templates/`) with a Next.js app,
with **behaviour parity on every page**, proven by a migration test suite that passes
against both the old and the new app.

## Architecture (decided — do not change without asking `lead`)

- `web/`: Next.js (App Router) + TypeScript. Production build uses `output: 'export'`
  → static files in `web/out`. Go embeds them (`web/embed.go`, `//go:embed all:out` —
  `all:` is required or `_next/` is silently dropped) and serves them **same-origin**
  with the API. No Node in production; Cloud Run stays at 128Mi.
- Auth is unchanged: Go owns `/login`, `/callback`, `/logout` and the `auth-store`
  cookie session. The frontend only calls `/api/v1/me` and redirects to `/login` on 401.
- Look: keep Bootstrap 5 (`bootstrap` + `react-bootstrap`). Do NOT copy the vendored
  10.8k-line `styles.css`; port only the sidebar rules (`styles.css:10831`-end).
  Icons: `@fortawesome/react-fontawesome` + free-solid.
- Data: TanStack Query (invalidate after mutations; never `location.reload()`).
  Forms: react-hook-form + zod. Errors → toast, never just `console.error`.
- Dev: `next dev` with `rewrites` for `/api/*`, `/login`, `/callback`, `/logout` →
  `process.env.API_ORIGIN` (default `http://localhost:8080`). Set `output: 'export'`
  only when `NODE_ENV === 'production'` (rewrites don't work with export).
- **Keep every Albanian label, heading, column header and button text exactly as in
  the old templates** — the migration tests select by visible text.
- Dates: render `created_at`/`updated_at` via `Intl.DateTimeFormat('sq-AL')`
  (migration tests must not assert the raw date format).

## API contract (backend implements; frontend codes against this from day one)

Existing `/api/v1` endpoints stay as they are. Changes / additions:

| Method + path | Auth | Response |
|---|---|---|
| any `/api/*` without a valid session | — | **401** `{"error":"unauthorized"}` (no redirect). Page routes keep redirecting. |
| `GET /api/v1/me` | yes | `{"name","email","picture"}`; when `AUTH0_ENABLE=false` → `{"name":"Dev","email":"","picture":""}` |
| `GET /api/v1/public/prayers` | **no** | same body as `GET /api/v1/prayers` |
| `GET /api/v1/regions` | yes | `[{"name","zip"}]` (from `models.Regions`) |
| `GET /api/v1/payments/details?year=YYYY&family_id=UUID` | yes | `[{"id","family_id","family_name","members","amount","year","neighbourhood_name","created_at","updated_at"}]`. Same semantics as today's `/pagesat` handler: default year = current year, `family_id` (if set) overrides year. A payment whose family/neighbourhood is missing gets an empty name — **never panic** (today's code nil-derefs at `internal/handlers/templates.go:131,137`). |
| `GET /api/v1/families/details` | yes | `[FamiliesResponse + "neighbourhood_name"]` |
| `GET /api/v1/payments/no-payment/details?year=YYYY&s_neighbourhood_id=UUID` | yes | same shape as `families/details`; same filtering as today's `/pagesat-pakryera` |

The join logic moves from `internal/handlers/templates.go` into the services (with Go
unit tests). `GET /api/v1/invoices?year=&s_neighbourhood_id=` is unchanged (PDF, 404 when empty).

## Page parity spec (old source of truth = template + JS listed)

Shared auth layout (`internal/templates/layout.html`, `app/js/scripts.js`): sidebar
logo + "Xhamia Qender", links **Lagjet, Familjet, Pagesat, Pagesat e pakryera**;
sidebar toggle button; top nav **Fillimi** (/user), dropdown **Shpalos** → **Profili**
(/user), **Dil** (/logout). Public layout (`layout-noauth.html`): sidebar **Fillimi** (/),
top nav **Kyqu** (/login).

| Route | Old files | Must keep |
|---|---|---|
| `/` | `app/publike.html` | public; heading "Kohët e namazit"; 7 cards: Sabahu, Lindja e Diellit, Dreka, Ikindia, Akshami, Jacia, Pjesa e tretë e natës — each with its time |
| `/user` | `app/perdoruesi.html` | avatar, "Miresevini {name}", "Jeni kyqur me sukses", same prayer grid |
| `/lagjet` | `app/lagjet.html`, `js/lagje.js` | "Krijo Lagje" form; region select auto-fills postal code + city; table (Emri i lagjes, Qyteti, Fshati, Shteti, Kodi Postal, Krijuar me, Ndryshuar me, Ndrysho, Fshi); edit modal; delete confirm |
| `/familjet` | `app/familjet.html`, `js/familje.js` | "Krijo Familje" form (name, middle name, surname, members, neighbourhood select); table (Emri, Prindi, Mbimeri, Numri i antareve, Lagje, …); edit modal; delete confirm |
| `/pagesat` | `app/pagesat.html`, `js/pagese.js` | "Krijo Pagese": family select auto-sets amount = members × 3; year; checkbox "Krijo pagese per disa vite" reveals "Deri ne vitin" (range_year); filter by year (`?s_year=`); client-side family-name search; table (Emri i familjes, Anetaret, Shuma e pageses, Viti, Emri i lagjes, …); edit modal; delete confirm |
| `/pagesat-pakryera` | `app/pagesat-pakryera.html`, `js/pagese-pakryer.js` | filter year + neighbourhood (`?year=&s_neighbourhood_id=`); heading "Lista e familjeve papaguar per vitin {year}"; client-side search; "Gjenero Faturat" downloads the invoices PDF (404 → message "No payments found for year …"); pay modal: amount = members × 3, year, optional multi-year range |

Read the old files for anything not listed — they win over this table.

## Local environment (avoid collisions — use YOUR row)

Shared Mongo is already running: `mongodb://root:root@localhost:27017` (`docker compose up -d`).
`MONGO_COLLECTION_NAME` is actually the **database** name — use your own. Leave
`AUTH0_ENABLE` unset (auth off locally).

| Role | Go `PORT` | Next dev port | `MONGO_COLLECTION_NAME` |
|---|---|---|---|
| backend | 8082 | — | mosq_backend |
| web-core | 8083 | 3003 | mosq_webcore |
| pages-crud | 8084 | 3004 | mosq_crud |
| pages-payments | 8085 | 3005 | mosq_payments |
| qa | 8081 (old app, from `main`) / 8086 (new app) | 3006 | mosq_qa |

Run Go: `PORT=8082 MONGO_COLLECTION_NAME=mosq_backend go run ./cmd`.
Run web: `API_ORIGIN=http://localhost:8083 npm run dev -- -p 3003`.
Run the old app for baselines: `git worktree add /tmp/mosq-old main` once, then run it from there.

## Tests

- `e2e/` — top-level, its own `package.json`, Playwright + chromium.
- **Migration suite** `e2e/migration/<page>.spec.ts`: written and green against the OLD
  app first; must then pass **unchanged** against the NEW app. Role/label/text
  selectors only (no ids, classes, or DOM structure). Every test seeds its own data
  through `/api/v1` with a unique suffix and cleans up. `BASE_URL` picks the target.
- **Flow suite** `e2e/flows/<page>.spec.ts`: new-app-only behaviour (toast on error,
  form validation, list refresh without reload, 401 → /login).
- Go: `go vet ./... && go test ./...`. Web: `npm run lint && npm run typecheck && npm run build`.

## Git rules

- You work in your own worktree on `hive/mosq-web/<role>`. Commit there, small and
  clear. **Never push. Never touch `main`.**
- Before you start a task that waits on others, run `git merge feat/nextjs-migration`
  in your worktree — the lead merges finished, reviewed work there.
- Stay in your task's files. Need a change elsewhere (e.g. the API contract)? Ask:
  `hive team say lead "…"`.
- Wait until hive tells you a task is yours and ready, then `hive team task claim <n>`.
  Read its full spec with `hive team task ls <n>`.
- Close a task only when its tests pass and its work is committed:
  `hive team task done <n> --note "<what changed; how tested>"`.
  Blocked? `hive team task block <n> --why "<what stops it>"`. Post progress with `hive team post`.
- Flow: owner marks done → reviewer reviews → lead merges → dependents are notified.
- Review loop: the reviewer does NOT close a review task until it approves. Findings go to
  the owner with `hive team say <owner> "…"`; the owner fixes, commits, and replies
  `hive team say reviewer "fixed: …"`.
