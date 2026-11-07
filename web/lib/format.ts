const dateFmt = new Intl.DateTimeFormat('sq-AL', { dateStyle: 'medium', timeStyle: 'short' });
const dayFmt = new Intl.DateTimeFormat('sq-AL', { dateStyle: 'medium' });
const moneyFmt = new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR' });
const percentFmt = new Intl.NumberFormat('sq-AL', { style: 'percent', maximumFractionDigits: 0 });

/** RFC3339 timestamp → localized date and time. Tests must not assert the output format. */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : dateFmt.format(d);
}

/** Date only. */
export function formatDay(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : dayFmt.format(d);
}

/** 12 → "€12.00" (sq-AL, EUR). */
export function formatMoney(amount: number): string {
  return moneyFmt.format(amount);
}

/** 0.5 → "50%". Safe for 0/0 (returns 0%). */
export function formatPercent(ratio: number): string {
  return percentFmt.format(Number.isFinite(ratio) ? ratio : 0);
}

/** paid / total as a 0..1 ratio; 0 when total is 0. */
export function ratio(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}
