const fmt = new Intl.DateTimeFormat('sq-AL', { dateStyle: 'medium', timeStyle: 'short' });

/** Format an RFC3339 timestamp for display. Never assert the output format in tests. */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : fmt.format(d);
}
