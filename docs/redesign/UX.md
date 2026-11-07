# Redesign wave — team brief

The migration wave is done and tagged `migration-parity` (29/29 on both tenants).
This wave makes the app a **useful platform**, not a restyle. Flows change on
purpose; the old migration suite is retired (kept in history at commit `ccfcab4`)
and qa writes a new acceptance suite for the new UX.

Design: **direction A — Emerald & Gold** (canvas: "Xhamia Qender redesign").
Stack: **Tailwind v4 + shadcn/ui** (Radix), `lucide-react` icons, `sonner` toasts.
Remove bootstrap, react-bootstrap and fontawesome. Still `output: 'export'` served by Go.

## Who uses it and for what

Admins of a mosque community collect a yearly fee per family (members × fee,
currently €3). The real job each year: go neighbourhood by neighbourhood, see who
has paid, record payments fast (often on a phone), chase the unpaid, print invoices.

## Information architecture

| Nav (sq) | Route | Purpose |
|---|---|---|
| Fillimi | `/user` (dashboard; keep the route) | Year KPIs (collected vs expected, % families paid, unpaid count), progress per neighbourhood (click → Mbledhja filtered), recent payments, next prayer card |
| Mbledhja | `/mbledhja` | **The core screen.** Year + neighbourhood; progress bar; families with status (Paguar / Pa paguar); one-click **Paguaj €X** (amount = members × fee, undo toast for 6 s); multi-select → **Shëno të paguara (n)**; tabs Të gjitha / Pa paguar / Paguar; search; **Gjenero faturat** (PDF of unpaid). Replaces /pagesat-pakryera and the create form of /pagesat |
| Familjet | `/familjet` | Table: name, neighbourhood, members, status for the selected year; filter by neighbourhood; search. Row → **family sheet** (side drawer, `?id=` in the URL): details (edit), payment history grid by year (paid/unpaid per year), **Paguaj vitet e mbetura**, delete with a consequence text ("fshin edhe N pagesa") |
| Lagjet | `/lagjet` | Neighbourhoods with families count, % paid this year, collected/expected; add/edit in a dialog (region → postal code + village autofill, as today) |
| Pagesat | `/pagesat` | Ledger of all payments: filters year + neighbourhood + search, edit/delete, **Eksporto CSV** |
| — | `/` (public) | Prayer times, mobile-first: next prayer large, today's list; "Kyçu" button |

Global: **Ctrl/⌘ K** command search (jump to a family, to a page); user menu (avatar + name → Profili, Dil); year selector in the top bar, shared by all admin pages (kept in the URL `?viti=2026`).
Old routes: `/pagesat-pakryera` → client redirect to `/mbledhja` (keep query params).
Static export: **no dynamic route segments**; use query params (`/familjet?id=…`).

## UX rules

- Mobile-first: sidebar → drawer under 1024 px; tables → stacked cards under 640 px; touch targets ≥ 44 px; primary action reachable with the thumb (sticky bottom bar on Mbledhja on phones).
- Fast paths: paying a family is one tap + undo, never a modal. Destructive actions confirm with consequences. No full-page reloads.
- Every list has an empty state that tells the user what to do next, and a loading skeleton.
- Errors: Albanian toast text from `api.ts` by status (network: "Nuk ka lidhje me serverin. Provoni përsëri."; 400: "Të dhënat nuk janë të sakta."; 404: "Nuk u gjet."; 5xx: "Ndodhi një gabim në server. Provoni përsëri."). Server text only in `console`.
- Numbers: `€12.00` via `Intl.NumberFormat('sq-AL', {style:'currency', currency:'EUR'})`; dates `Intl.DateTimeFormat('sq-AL')`.
- Accessibility: real buttons/links/labels, visible focus ring, 4.5:1 text contrast (palette below passes), `aria-live` for toasts.

## Design tokens (direction A)

ground `#F3F6F4` · surface `#FFFFFF` · border `#DCE5E0` · text `#13241C` · muted `#52645A`
primary `#0F6B4C` (hover `#0A4F38`) · sidebar `#0E3B2C` (active `#1A5240`, text `#E6EFEA`, muted `#A9C2B6`)
gold `#D4A84A` (decor/icons on dark only; on light use `#8A6212`) · gold-soft `#F6EEDB`
danger `#A03B22` · danger-soft `#FBE9E4` · success-soft `#E3EEE8`
radius 10 (controls) / 14 (cards) · fonts: Plus Jakarta Sans 600/700/800 (headings), Inter 400/500/600 (body) via `next/font/google`.

## Albanian spelling (use exactly; central in `web/lib/sq.ts`)

Kërko · Shto lagje · Shto familje · Paguaj · Paguar · Pa paguar · Shëno të paguara · Zhbëj ·
Mbledhja · Mbledhur · Pritet · Anëtarët · Numri i anëtarëve · Emri · Emri i prindit · Mbiemri ·
Lagjja · Zgjidh lagjen · Zgjidh familjen · Shuma · Viti · Deri në vitin · Paguaj për disa vite ·
Krijuar më · Ndryshuar më · Ndrysho · Fshi · Anulo · Ruaj · Konfirmo fshirjen ·
"A jeni të sigurt që dëshironi ta fshini këtë {pagesë|familje|lagje}?" · Gjenero faturat ·
"Nuk ka fatura për t'u gjeneruar për vitin {viti}." · Historiku i pagesave · Paguaj vitet e mbetura ·
Eksporto CSV · Familjet e papaguara · Përparimi sipas lagjeve · Pagesat e fundit · Namazi i ardhshëm ·
Kohët e namazit · Sabahu · Lindja e Diellit · Dreka · Ikindia · Akshami · Jacia · Pjesa e tretë e natës ·
Qyteti · Fshati · Shteti · Kodi postar · Mirësevini · Kyçu · Dil · Profili · Fillimi.
Brand name: **Xhamia Qendër** for center, **Xhamia Qoku** for qoku (user-confirmed). Per tenant from env `BRAND_NAME` (default "Xhamia Qendër") via `GET /api/v1/public/config` → `{"brand_name"}`; the shells show it, `sq.brand` is the fallback.

## API additions (backend; JSON responses, tests required)

| Method + path | Response |
|---|---|
| `GET /api/v1/stats?year=Y` | `{year, fee_per_member, families, members, expected, collected, paid_families, unpaid_families, neighbourhoods:[{id,name,families,paid_families,expected,collected}]}` |
| `GET /api/v1/collection?year=Y&neighbourhood_id=N` (N optional) | `[{...FamiliesResponse, neighbourhood_name, expected_amount, paid, payment: {id, amount, created_at} \| null}]` |
| `GET /api/v1/families/{id}/history` | `{family: FamiliesResponse + neighbourhood_name, payments: [PaymentsResponse], years: [{year, paid, payment_id}]}` for every year from the earliest payment (or current year) to the current year, or to the latest paid year if that is later (e.g. after paying future years); `payment_id` is `null` when unpaid |
| `POST /api/v1/payments/bulk` | body `{family_ids:[…], year, range_year?}`; amount = members × fee server-side; always `201 {"ids":[…], "skipped":[{"family_id","year"}]}` (both always arrays). Family-years that already have a payment are not duplicated: they are listed in `skipped` (so repeating a request or a double tap is safe). If everything is skipped it is still `201` with `ids: []`. Unknown family id → `404`, nothing written. Invalid input → `400` |
| `GET /api/v1/payments/recent?limit=10` | `[PaymentDetails]` newest first |

- Fee: env `FEE_PER_MEMBER` (default 3), used by stats/collection/bulk and returned by stats. The frontend never hardcodes it.
- Admin gate: invert to an allowlist. Public = `/`, `/index.html`, `/index.txt`, `/_next/*`, static assets, `/404.html`, `/login`, `/callback`, `/logout`, `/api/v1/health`, `/api/v1/public/*`. Everything else needs a session.

## Tests

- `e2e/specs/<area>.spec.ts` — new acceptance suite: collection (pay, undo, bulk, filters, PDF), family sheet (history, pay remaining years, delete consequences), CRUD for neighbourhoods/families, ledger (filters, edit, delete, CSV), dashboard (numbers match `/api/v1/stats`), public prayers, auth (401 → /login), Albanian errors.
- Two Playwright projects: `desktop` (1280×800) and `phone` (390×844). Both must pass.
- Selectors: role/label/text (Albanian strings from the glossary), no classes or ids.
