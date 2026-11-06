# web/

Next.js (App Router, TS) frontend. Production = static export (`web/out`) embedded and served by Go.

## Run in dev against Go
```
# terminal 1 (repo root) – Go API, your own port + DB (see docs/migration/PLAN.md)
PORT=8083 MONGO_COLLECTION_NAME=mosq_webcore go run ./cmd
# terminal 2
cd web && npm install
API_ORIGIN=http://localhost:8083 npm run dev -- -p 3003
```
`next dev` rewrites `/api/*`, `/login`, `/callback`, `/logout` to `API_ORIGIN` (default `http://localhost:8080`).
With `AUTH0_ENABLE` unset, `/api/v1/me` returns user "Dev".

## Scripts
`npm run lint` · `npm run typecheck` · `npm run build` (NODE_ENV=production → `output: 'export'` → `out/lagjet.html` …)

## Building blocks (import with `@/…`)
- `lib/api.ts` – typed client (`api.neighbourhoods.list()`, `api.payments.details({year})`, `api.invoices(year, nid)` …). Throws `ApiError`; 401 → `/login`.
- `lib/types.ts`, `lib/format.ts` (`formatDate`, sq-AL).
- `components/AuthGuard` (wraps a page in `AppShell`, `useMe()`), `PublicShell`/`AppShell` in `Shell`.
- `Toast` (`useToast().success/error`, `errMsg(e)`), `ConfirmDialog`, `FormModal` (use with react-hook-form's `handleSubmit`),
  `DataTable` (columns + optional `searchText` client-side filter), `PrayerGrid`.
- Fetch with TanStack Query; after mutations `queryClient.invalidateQueries(...)` — never `location.reload()`. Errors → `toast.error(errMsg(e))`.
- Keep Albanian texts exactly as in the old templates; render dates only via `formatDate`.
