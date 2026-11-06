# Components (redesign foundation)

Stack: Tailwind v4 (tokens in `app/globals.css`, direction A) · shadcn-style Radix primitives in `components/ui` · `lucide-react` icons · `sonner` toasts.
**All copy comes from `lib/sq.ts`**; money/dates from `lib/format.ts`; the API only through `lib/api.ts` (Albanian errors by status).
Legacy pages still use `FormModal`, `ConfirmDialog` and bootstrap (lowest cascade layer); they disappear in r-cleanup.

## Layout & shell
| Component | Use |
|---|---|
| `AuthGuard` (+ `useMe`) | Wrap every admin page. Calls `/api/v1/me`, renders `AppShell` (dark sidebar → drawer <1024px, top bar with year select, Ctrl/⌘-K, user menu). |
| `PublicShell` | Public `/` only: brand + "Kyçu". |
| `useYear()` (`lib/hooks`) | `[year, setYear]` from `?viti=` (default current year). Needs a `<Suspense>` above it; pages that call it/`useSearchParams` wrap their content in `<Suspense>`. |
| `CommandSearch` | Opened by AppShell; jump to pages / `/familjet?id=…`. |

## Data display
| Component | Use |
|---|---|
| `DataTable` | Any list. Table ≥640px, stacked cards below (one of them in the DOM). Props: `columns` (`primary` = card title, `hideInCards`), `rowKey`, `searchText`, `loading` (skeleton), `empty` (EmptyState with a next action), optional row selection (`selected`/`onSelectedChange`/`rowLabel`) for "Shëno të paguara (n)", `onRowClick`. |
| `StatCard` | KPI tiles (label, big value, hint, icon). |
| `EmptyState` | Every empty list: say what to do next. |
| `ui/Skeleton` | Loading placeholders. `ui/Progress` (`value` 0–100, give `aria-label`). |
| `ui/Badge`, `StatusBadge` | `Paguar` / `Pa paguar` chips (text + colour). |
| `ui/Card` | Surface container. |

## Inputs & overlays
| Component | Use |
|---|---|
| `ui/Button` | `variant`: default, outline, secondary, ghost, danger, danger-soft; default size is 44px (touch). `size="sm"` only for dense desktop rows. `asChild` for links. |
| `ui/Input`, `ui/Label`, `ui/Select` | Form fields. `Select` is a native `<select>` (phone-friendly, testable with `selectOption`). Pair with react-hook-form + zod. |
| `ui/Dialog` | Forms (add/edit) — not for one-click payments. |
| `ui/Sheet` (`side="right"`) | Family sheet (`?id=`); `side="left"` is the mobile nav. |
| `ui/AlertDialog` | Destructive confirmation with consequence text (`sq.messages.confirmDelete`, `deleteFamilyConsequence`). |
| `ui/Tabs` | Të gjitha / Pa paguar / Paguar. |
| `ui/DropdownMenu`, `ui/Avatar` | Menus (use `asChild` + `<Link>` for navigation items). |

## Feedback
`useToast().success/error/info(msg)` · `toastUndo(msg, onUndo)` (6 s, "Zhbëj" action) · `errMsg(e)` turns an `ApiError` into its Albanian text.
Pay-in-one-tap pattern: mutate, `toastUndo(sq.messages.paid, () => api.payments.remove(id))`, invalidate `['collection']`/`['stats']`.
