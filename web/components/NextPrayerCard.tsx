'use client';
import { useQuery } from '@tanstack/react-query';
import { Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { sq } from '@/lib/sq';
import type { Prayers } from '@/lib/types';

const ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type Key = (typeof ORDER)[number];
/** Sunrise is listed but is not a prayer, so it is never "next". */
const PRAYERS: readonly Key[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

/** "05:04 (CET)" → "05:04" */
export function hhmm(value?: string): string {
  return /(\d{1,2}:\d{2})/.exec(value ?? '')?.[1] ?? value ?? '';
}

/** "05:04 (CET)" → minutes after midnight, or null. */
export function toMinutes(value?: string): number | null {
  const m = /(\d{1,2}):(\d{2})/.exec(value ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** The next prayer after `nowMin`; after Isha it is tomorrow's Fajr. */
export function nextPrayer(p: Prayers, nowMin: number): { key: Key; minutes: number; tomorrow: boolean } | null {
  for (const key of PRAYERS) {
    const t = toMinutes(p[key]);
    if (t !== null && t > nowMin) return { key, minutes: t, tomorrow: false };
  }
  const f = toMinutes(p.Fajr);
  return f === null ? null : { key: 'Fajr', minutes: f, tomorrow: true };
}

function countdown(diffMin: number): string {
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${sq.dashboard.in} ${h > 0 ? `${h} ${sq.dashboard.hourShort} ` : ''}${m} ${sq.dashboard.minuteShort}`;
}

/** Next prayer (large), with today's other times underneath. Uses the session `/prayers` endpoint. */
export function NextPrayerCard() {
  const { data } = useQuery({ queryKey: ['prayers', true], queryFn: api.prayers, staleTime: 5 * 60_000 });
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  if (!data || !now) return <Card><Skeleton className="h-28 w-full" /></Card>;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const next = nextPrayer(data, nowMin);

  return (
    <Card className="bg-sidebar text-sidebar-text">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-sidebar-muted">{sq.dashboard.nextPrayer}</p>
        <Moon aria-hidden className="size-5 text-gold" />
      </div>
      {next && (
        <>
          <p className="mt-1 font-heading text-2xl font-extrabold sm:text-3xl">
            {sq.prayers[next.key]}{' '}
            <span className="text-gold">{hhmm(data[next.key])}</span>
          </p>
          <p className="mt-1 text-sm text-sidebar-muted">
            {next.tomorrow ? sq.dashboard.tomorrow : countdown(next.minutes - nowMin)}
          </p>
        </>
      )}
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {ORDER.map((k) => (
          <li key={k} className="flex justify-between gap-2">
            <span className="text-sidebar-muted">{sq.prayers[k]}</span>
            <span className={next?.key === k && !next.tomorrow ? 'font-semibold text-gold' : ''}>{hhmm(data[k])}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
