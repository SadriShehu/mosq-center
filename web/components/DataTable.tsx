'use client';
import { Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** In card mode (<640px) this column is the card title. Defaults to the first column. */
  primary?: boolean;
  /** Hide this column in card mode (e.g. action columns that you render elsewhere). */
  hideInCards?: boolean;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Text matched by the search box for a row. Omit to hide search. */
  searchText?: (row: T) => string;
  searchLabel?: string;
  searchPlaceholder?: string;
  /** Shown when there are no rows at all (tell the user what to do next). */
  empty?: ReactNode;
  /** @deprecated plain-text variant of `empty` */
  emptyText?: string;
  loading?: boolean;
  /** Row selection (checkbox column / card checkbox). */
  selected?: ReadonlySet<string>;
  onSelectedChange?: (next: Set<string>) => void;
  /** Accessible name for a row's checkbox, e.g. the family name. */
  rowLabel?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

/** Table ≥640px, stacked cards below. Only one of the two is ever in the DOM. */
export function DataTable<T>({
  columns, rows, rowKey, searchText, searchLabel = sq.actions.search, searchPlaceholder,
  empty, emptyText, loading, selected, onSelectedChange, rowLabel, onRowClick,
}: Props<T>) {
  const [q, setQ] = useState('');
  const cards = useMediaQuery('(max-width: 639px)');
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!searchText || !needle) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(needle));
  }, [rows, q, searchText]);

  const selectable = !!onSelectedChange;
  const toggle = (id: string, on: boolean) => {
    const next = new Set(selected ?? []);
    if (on) next.add(id); else next.delete(id);
    onSelectedChange?.(next);
  };
  const allOn = shown.length > 0 && shown.every((r) => selected?.has(rowKey(r)));
  const toggleAll = (on: boolean) => {
    const next = new Set(selected ?? []);
    shown.forEach((r) => (on ? next.add(rowKey(r)) : next.delete(rowKey(r))));
    onSelectedChange?.(next);
  };
  const checkbox = 'size-5 accent-[var(--primary)]';

  const primaryIdx = Math.max(0, columns.findIndex((c) => c.primary));

  let body: ReactNode;
  if (loading) {
    body = (
      <div role="status" aria-label={sq.loading} className="space-y-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  } else if (rows.length === 0) {
    body = empty ?? <EmptyState title={emptyText ?? sq.empty.list} />;
  } else if (shown.length === 0) {
    body = <EmptyState icon={Search} title={sq.empty.noResults} />;
  } else if (cards) {
    body = (
      <ul className="space-y-3">
        {shown.map((r) => {
          const id = rowKey(r);
          return (
            <li
              key={id}
              className={cn('rounded-card border border-border bg-surface p-4', onRowClick && 'cursor-pointer')}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <input
                    type="checkbox"
                    className={cn(checkbox, 'mt-1')}
                    aria-label={sq.selectRow(rowLabel?.(r) ?? id)}
                    checked={!!selected?.has(id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggle(id, e.target.checked)}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-bold">{columns[primaryIdx].render(r)}</div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    {columns.map((c, i) =>
                      i === primaryIdx || c.hideInCards ? null : (
                        <div key={c.header} className="contents">
                          <dt className="text-muted">{c.header}</dt>
                          <dd className="text-right">{c.render(r)}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  } else {
    body = (
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-success-soft text-muted">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" className={checkbox} aria-label={sq.selectAll} checked={allOn} onChange={(e) => toggleAll(e.target.checked)} />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.header} scope="col" className={cn('px-4 py-3 font-semibold', c.className)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((r) => {
              const id = rowKey(r);
              return (
                <tr
                  key={id}
                  className={cn('hover:bg-ground/60', onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                >
                  {selectable && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className={checkbox}
                        aria-label={sq.selectRow(rowLabel?.(r) ?? id)}
                        checked={!!selected?.has(id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggle(id, e.target.checked)}
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.header} className={cn('px-4 py-3', c.className)}>{c.render(r)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searchText && (
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            className="pl-9"
            aria-label={searchLabel}
            placeholder={searchPlaceholder ?? searchLabel}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}
      {body}
    </div>
  );
}
