# Lead handoff (team mosq-web)

You are now the lead (role `integrator`). The previous lead ran out of tokens.
Spec: `docs/redesign/UX.md`. Git rules, ports and DBs: `docs/migration/PLAN.md`.

## State

- Integration branch **`feat/nextjs-migration`**, checked out in the main folder
  `/Users/sadrishehu/go/src/github.com/sadrishehu/mosq-center`. **Do the merges there** (`cd` into it), not in your worktree.
- Tag `migration-parity` is the proven like-for-like checkpoint (29/29 on both tenants). Don't move it.
- Merged so far: redesign API, Tailwind/shadcn foundation + AppShell + sq.ts, e2e setup (desktop + phone),
  `BRAND_NAME` (center "Xhamia Qendër", qoku "Xhamia Qoku" in Terraform, not applied).
- Built on member branches, **not merged yet**: /mbledhja and /pagesat (pages-payments), /familjet + shared
  `FamilySheet` (pages-crud), /user dashboard (web-core). In progress: #38 /lagjet and then #39 public / (pages-crud),
  #58 FamilySheet in place on /mbledhja (pages-payments), #57 brand in the shells and then #41 cleanup (web-core).
  QA and review tasks #42–#53 run per page.
- Your task: **#54** (merge everything), then qa runs **#55** (Docker image, both tenants, desktop + phone, screenshots).

## Merge routine (for each page once its QA and review tasks are done)

```sh
cd /Users/sadrishehu/go/src/github.com/sadrishehu/mosq-center
git merge --no-ff hive/mosq-web/<role> -m "Merge <role>: <what>"
go vet ./... && go test ./...
cd web && npm ci && npm run lint && npm run typecheck && npm test && npm run build && cd ..
git status --short        # must be empty (postbuild recreates web/out/.gitkeep)
```

Before #54 is done, run the full suite against Go serving the build:

```sh
PORT=8090 MONGO_COLLECTION_NAME=mosq_lead_final go run ./cmd     # in its own pane or background
cd e2e && npm ci && BASE_URL=http://localhost:8090 npx playwright test   # desktop + phone must be green
```

Then close #54 with `hive team task done 54 --note "..."` (hashes, check results, e2e summary line).

## Rules

- Never `git push`, never touch `main`, never apply Terraform, never deploy. Ask the user first.
- Don't start a server on a port another member uses (table in PLAN.md); use 8090/3090.
- Talk to members with `hive team say <role> "..."`, to the user with `hive team post "..."`.
- Close a review only when it's approved; don't merge a page whose QA or review is still open.

## Lessons learned (don't repeat them)

- zsh doesn't split `$VAR` into words: write flags out in full, or use a function.
- Never run `hive team wait ... &` with its output thrown away: it eats team messages.
- `/api` URLs without trailing slashes (next dev 308s POSTs). Go returns `null` for empty lists; `api.ts` already turns them into `[]`.
- Create/update/delete on the old endpoints reply with plain text; `api.ts` `mutate()` handles it.
- One-tap pay uses `POST /api/v1/payments/bulk` (idempotent; `skipped` lists family-years that were already paid).
- Review notes that only check code can miss runtime bugs: insist on the e2e spec passing on both projects.
- Real Auth0 login can't be tested locally; the user checks it at cutover.

## When #55 is green

Post to the user: what's merged, the test results for both tenants and both projects, where the screenshots are,
and that a PR / deploy waits for their go-ahead. Open a PR only if the user asks.
