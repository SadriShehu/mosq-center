'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { Table } from 'react-bootstrap';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Text used by the search box for each row (e.g. the family name). Omit to hide search. */
  searchText?: (row: T) => string;
  searchLabel?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function DataTable<T>({
  columns, rows, rowKey, searchText, searchLabel = 'Kerko', searchPlaceholder, emptyText,
}: Props<T>) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!searchText || !needle) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(needle));
  }, [rows, q, searchText]);

  return (
    <>
      {searchText && (
        <input
          type="search"
          className="form-control mb-3"
          aria-label={searchLabel}
          placeholder={searchPlaceholder ?? searchLabel}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}
      <Table striped hover responsive>
        <thead>
          <tr>{columns.map((c) => <th key={c.header}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={rowKey(r)}>{columns.map((c) => <td key={c.header}>{c.render(r)}</td>)}</tr>
          ))}
          {shown.length === 0 && emptyText && (
            <tr><td colSpan={columns.length} className="text-center text-muted">{emptyText}</td></tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
