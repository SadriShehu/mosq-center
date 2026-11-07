'use client';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Percent, Users } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard, useMe } from '@/components/AuthGuard';
import { EmptyState } from '@/components/EmptyState';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { StatCard } from '@/components/StatCard';
import { errMsg } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDay, formatMoney, formatPercent, ratio } from '@/lib/format';
import { useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';

function Content() {
  const me = useMe();
  const [year] = useYear();
  const stats = useQuery({ queryKey: ['stats', year], queryFn: () => api.stats(year) });
  const recent = useQuery({ queryKey: ['payments', 'recent'], queryFn: () => api.recentPayments(10) });
  const s = stats.data;
  const paidRatio = s ? ratio(s.paid_families, s.families) : 0;
  const collectedRatio = s ? ratio(s.collected, s.expected) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">
          {sq.dashboard.welcome} {me.name}
        </h1>
        <p className="text-muted">{sq.dashboard.forYear(year)}</p>
      </div>

      <section aria-label={sq.dashboard.forYear(year)} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.isError ? (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState title={sq.dashboard.loadError} description={errMsg(stats.error)}>
              <Button variant="outline" onClick={() => void stats.refetch()}>{sq.actions.retry}</Button>
            </EmptyState>
          </div>
        ) : s ? (
          <>
            <StatCard
              label={sq.collection.collected}
              icon={Banknote}
              value={formatMoney(s.collected)}
              hint={
                <>
                  {sq.collection.expected} {formatMoney(s.expected)}
                  <Progress className="mt-2" value={collectedRatio * 100} aria-label={sq.collection.collected} />
                </>
              }
            />
            <StatCard
              label={sq.dashboard.paidFamilies}
              icon={Percent}
              value={formatPercent(paidRatio)}
              hint={
                <>
                  {sq.dashboard.ofFamilies(s.paid_families, s.families)}
                  <Progress className="mt-2" value={paidRatio * 100} aria-label={sq.dashboard.paidFamilies} />
                </>
              }
            />
            <StatCard
              label={sq.dashboard.unpaidFamilies}
              icon={Users}
              value={s.unpaid_families}
              hint={
                <Link className="font-semibold text-primary underline-offset-2 hover:underline" href={`/mbledhja?viti=${year}`}>
                  {sq.dashboard.openCollection}
                </Link>
              }
            />
          </>
        ) : (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full" />)
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="dash-progress" className="space-y-3 lg:col-span-2">
          <h2 id="dash-progress" className="font-heading text-lg font-bold">{sq.dashboard.progressByNeighbourhood}</h2>
          {stats.isError ? (
            <p className="text-sm text-muted">{errMsg(stats.error)}</p>
          ) : !s ? (
            <Skeleton className="h-40 w-full" />
          ) : s.neighbourhoods.length === 0 ? (
            <EmptyState title={sq.dashboard.noNeighbourhoodsTitle} description={sq.dashboard.noNeighbourhoodsHint}>
              <Button asChild><Link href={`/lagjet?viti=${year}`}>{sq.actions.addNeighbourhood}</Link></Button>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {s.neighbourhoods.map((n) => {
                const r = ratio(n.paid_families, n.families);
                return (
                  <li key={n.id}>
                    <Link
                      href={`/mbledhja?viti=${year}&lagjja=${n.id}`}
                      className="block rounded-card border border-border bg-surface p-4 hover:border-primary"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-heading font-bold">{n.name}</span>
                        <span className="text-sm text-muted">{sq.dashboard.paidOf(n.paid_families, n.families)}</span>
                      </div>
                      <Progress className="my-2" value={r * 100} aria-label={sq.dashboard.progressOf(n.name)} />
                      <p className="text-sm text-muted">
                        {formatMoney(n.collected)} / {formatMoney(n.expected)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <NextPrayerCard />
          <section aria-labelledby="dash-recent" className="space-y-3">
            <h2 id="dash-recent" className="font-heading text-lg font-bold">{sq.dashboard.recentPayments}</h2>
            {recent.isError ? (
              <EmptyState title={sq.dashboard.loadError} description={errMsg(recent.error)}>
                <Button variant="outline" onClick={() => void recent.refetch()}>{sq.actions.retry}</Button>
              </EmptyState>
            ) : recent.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (recent.data?.length ?? 0) === 0 ? (
              <EmptyState title={sq.dashboard.noPaymentsTitle} description={sq.dashboard.noPaymentsHint}>
                <Button asChild variant="outline"><Link href={`/mbledhja?viti=${year}`}>{sq.dashboard.openCollection}</Link></Button>
              </EmptyState>
            ) : (
              <Card className="p-0 sm:p-0">
                <ul className="divide-y divide-border">
                  {recent.data!.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.family_name}</p>
                        <p className="text-xs text-muted">{p.neighbourhood_name} · {p.year} · {formatDay(p.created_at)}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-primary">{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function User() {
  return <AuthGuard><Content /></AuthGuard>;
}
