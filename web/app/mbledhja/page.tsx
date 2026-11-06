'use client';
import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Users } from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import { errMsg, toastUndo, useToast } from '@/components/Toast';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatDay, formatMoney, formatPercent, ratio } from '@/lib/format';
import { useMediaQuery, useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { CollectionRow } from '@/lib/types';

type Tab = 'all' | 'unpaid' | 'paid';

const fullName = (f: CollectionRow) => [f.name, f.middle_name, f.surname].filter(Boolean).join(' ');

function Collection() {
  const [year] = useYear();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const nbhd = params.get('lagjja') ?? '';
  const qc = useQueryClient();
  const toast = useToast();
  const phone = useMediaQuery('(max-width: 639px)');

  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const neighbourhoods = useQuery({ queryKey: ['neighbourhoods'], queryFn: api.neighbourhoods.list });
  const collection = useQuery({
    queryKey: ['collection', year, nbhd],
    queryFn: () => api.collection(year, nbhd || undefined),
  });
  const rows = useMemo(() => collection.data ?? [], [collection.data]);

  const refresh = () => {
    for (const k of ['collection', 'stats', 'payments', 'family-history']) {
      qc.invalidateQueries({ queryKey: [k] });
    }
  };

  const setNbhd = (id: string) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('lagjja', id); else next.delete('lagjja');
    setSelected(new Set());
    router.replace(`${pathname}?${next.toString()}`);
  };

  const totals = useMemo(() => {
    const expected = rows.reduce((s, r) => s + r.expected_amount, 0);
    const collected = rows.reduce((s, r) => s + (r.payment?.amount ?? 0), 0);
    const paid = rows.filter((r) => r.paid).length;
    return { expected, collected, paid, families: rows.length };
  }, [rows]);

  const shown = useMemo(
    () => rows.filter((r) => (tab === 'all' ? true : tab === 'paid' ? r.paid : !r.paid)),
    [rows, tab],
  );

  const payFamilies = useMutation({
    mutationFn: (ids: string[]) => api.payBulk({ family_ids: ids, year }),
    onSuccess: async (res) => {
      setSelected(new Set());
      refresh();
      if (res.ids.length === 0) return;
      toastUndo(sq.messages.paid, async () => {
        try {
          await Promise.all(res.ids.map((id) => api.payments.remove(id)));
          toast.info(sq.messages.undone);
        } catch (e) {
          toast.error(errMsg(e));
        }
        refresh();
      });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const payOne = (id: string) => {
    setBusy((b) => new Set(b).add(id));
    payFamilies.mutate([id], {
      onSettled: () =>
        setBusy((b) => {
          const n = new Set(b);
          n.delete(id);
          return n;
        }),
    });
  };

  const unpaidSelected = rows.filter((r) => !r.paid && selected.has(r.id)).map((r) => r.id);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const blob = await api.invoices(year, nbhd || undefined);
      if (!blob) {
        toast.error(sq.messages.noInvoices(year));
        return;
      }
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${year}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<CollectionRow>[] = [
    {
      header: sq.fields.name,
      primary: true,
      render: (f) => (
        <Link
          href={`/familjet?id=${f.id}&viti=${year}`}
          className="font-semibold text-primary underline-offset-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {fullName(f)}
        </Link>
      ),
    },
    { header: sq.fields.neighbourhood, render: (f) => f.neighbourhood_name },
    { header: sq.fields.members, render: (f) => f.members },
    { header: sq.fields.status, render: (f) => <StatusBadge paid={f.paid} /> },
    {
      header: sq.fields.amount,
      render: (f) => formatMoney(f.payment ? f.payment.amount : f.expected_amount),
    },
    {
      header: sq.actions.pay,
      render: (f) =>
        f.paid ? (
          <span className="text-sm text-muted">{formatDay(f.payment?.created_at)}</span>
        ) : (
          <Button
            size={phone ? 'default' : 'sm'}
            disabled={busy.has(f.id)}
            aria-label={`${sq.actions.pay} ${formatMoney(f.expected_amount)} — ${fullName(f)}`}
            onClick={(e) => {
              e.stopPropagation();
              payOne(f.id);
            }}
          >
            {sq.actions.pay} {formatMoney(f.expected_amount)}
          </Button>
        ),
    },
  ];

  const pct = ratio(totals.collected, totals.expected);
  const markPaidLabel = `${sq.actions.markPaid} (${unpaidSelected.length})`;

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold">{sq.nav.collection}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label={sq.fields.neighbourhood}
            className="min-w-48"
            value={nbhd}
            onChange={(e) => setNbhd(e.target.value)}
          >
            <option value="">{sq.fields.allNeighbourhoods}</option>
            {neighbourhoods.data?.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </Select>
          <Button variant="outline" onClick={exportPdf} disabled={exporting}>
            <FileText aria-hidden /> {sq.actions.generateInvoices}
          </Button>
          {!phone && unpaidSelected.length > 0 && (
            <Button disabled={payFamilies.isPending} onClick={() => payFamilies.mutate(unpaidSelected)}>
              {markPaidLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={sq.collection.collected} value={formatMoney(totals.collected)} />
        <StatCard label={sq.collection.expected} value={formatMoney(totals.expected)} />
        <StatCard
          label={sq.status.paid}
          value={`${totals.paid} / ${totals.families}`}
          hint={formatPercent(pct)}
          icon={Users}
        />
      </div>
      <Progress value={pct * 100} aria-label={`${sq.collection.collected}: ${formatPercent(pct)}`} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="all">{sq.tabs.all}</TabsTrigger>
          <TabsTrigger value="unpaid">{sq.tabs.unpaid}</TabsTrigger>
          <TabsTrigger value="paid">{sq.tabs.paid}</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        rows={shown}
        rowKey={(f) => f.id}
        searchText={fullName}
        loading={collection.isLoading}
        selected={selected}
        onSelectedChange={setSelected}
        rowLabel={fullName}
        empty={
          <EmptyState title={sq.empty.list} icon={Users}>
            <Button asChild variant="outline"><Link href="/familjet">{sq.actions.addFamily}</Link></Button>
          </EmptyState>
        }
      />

      {phone && unpaidSelected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 shadow-lg">
          <Button className="w-full" disabled={payFamilies.isPending} onClick={() => payFamilies.mutate(unpaidSelected)}>
            {markPaidLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Suspense>
        <Collection />
      </Suspense>
    </AuthGuard>
  );
}
