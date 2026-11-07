'use client';
import { useQuery } from '@tanstack/react-query';
import { Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { nextPrayer } from '@/components/NextPrayerCard';
import { PublicShell } from '@/components/Shell';
import { errMsg } from '@/components/Toast';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { sq } from '@/lib/sq';
import type { Prayers } from '@/lib/types';
import { cn } from '@/lib/utils';

const ITEMS: { key: keyof Prayers; label: string; icon: LucideIcon }[] = [
  { key: 'Fajr', label: sq.prayers.Fajr, icon: Moon },
  { key: 'Sunrise', label: sq.prayers.Sunrise, icon: Sunrise },
  { key: 'Dhuhr', label: sq.prayers.Dhuhr, icon: Sun },
  { key: 'Asr', label: sq.prayers.Asr, icon: Sun },
  { key: 'Maghrib', label: sq.prayers.Maghrib, icon: Moon },
  { key: 'Isha', label: sq.prayers.Isha, icon: Moon },
  { key: 'Midnight', label: sq.prayers.Midnight, icon: Moon },
];

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-prayers'],
    queryFn: api.publicPrayers,
    refetchInterval: 60_000,
  });
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const rows = ITEMS.map((item) => ({ ...item, time: data?.[item.key] ?? '' }));

  const nowDate = now === null ? null : new Date(now);
  const nowMinutes = nowDate === null
    ? null
    : nowDate.getHours() * 60 + nowDate.getMinutes() + nowDate.getSeconds() / 60;
  const next = data && nowMinutes !== null ? nextPrayer(data, nowMinutes) : null;

  let countdown: string | null = null;
  if (now !== null && next) {
    const target = new Date(now);
    target.setHours(Math.floor(next.minutes / 60), next.minutes % 60, 0, 0);
    if (next.tomorrow) target.setDate(target.getDate() + 1);
    countdown = formatCountdown(target.getTime() - now);
  }

  return (
    <PublicShell>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-extrabold">{sq.prayers.title}</h1>

        {error && <p role="alert" className="text-sm text-danger">{errMsg(error)}</p>}

        {isLoading || !next || !data ? (
          <Skeleton className="h-36 w-full" />
        ) : (
          <section className="rounded-card bg-primary p-6 text-white">
            <p className="text-sm font-medium text-white/80">{sq.dashboard.nextPrayer}</p>
            <h2 className="mt-1 font-heading text-xl font-bold">{sq.prayers[next.key]}</h2>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
              <span className="font-heading text-4xl font-extrabold tabular-nums">{data[next.key]}</span>
                {countdown && (
                  <span className="rounded-control bg-white/10 px-3 py-1 text-sm text-white/90">
                    {sq.prayers.remaining} <span className="font-semibold tabular-nums">{countdown}</span>
                  </span>
                )}
              </div>
          </section>
        )}

        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => {
            const Icon = row.icon;
            const isNext = !!next && !next.tomorrow && row.key === next.key;
            return (
              <li
                key={row.key}
                aria-current={isNext ? 'time' : undefined}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3',
                  isNext && 'border-primary ring-2 ring-primary/25',
                )}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon aria-hidden className="size-4 text-gold-ink" />
                  {row.label}
                </span>
                <span className="font-semibold tabular-nums">{row.time || '—'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </PublicShell>
  );
}
