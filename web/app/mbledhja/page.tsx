'use client';
import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Users } from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { FamilySheet } from '@/components/FamilySheet';
import { StatCard } from '@/components/StatCard';
import { errMsg, toastUndo, useToast } from '@/components/Toast';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, ApiError } from '@/lib/api';
import { formatDay, formatMoney, formatPercent, ratio } from '@/lib/format';
import { useMediaQuery, useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { CollectionRow } from '@/lib/types';

type Tab = 'all' | 'unpaid' | 'paid';
/** `singleFamilyId` is set only for a one-tap row pay (not a bulk mark). */
type PayArgs = { ids: string[]; singleFamilyId?: string };

const fullName = (f: CollectionRow) => [f.name, f.middle_name, f.surname].filter(Boolean).join(' ');

/** Undo may race with the toast action: deleting an already-deleted payment is a no-op. */
async function deletePayment(id: string) {
  try {
    await api.payments.remove(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return;
    throw e;
  }
}

function Collection() {
  const [year] = useYear();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const nbhd = params.get('lagjja') ?? '';
  const familyId = params.get('familja');
  const qc = useQueryClient();
  const toast = useToast();
  const phone = useMediaQuery('(max-width: 639px)');

  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  /** `${familyId}:${year}` -> payment id paid from this screen this year, for the row Zhbëj. */
  const [justPaid, setJustPaid] = useState<Map<string, string>>(new Map());
  const paidKey = (family: string) => `${family}:${year}`;

  const neighbourhoods = useQuery({ queryKey: ['neighbourhoods'], queryFn: api.neighbourhoods.list });
  const collection = useQuery({
    queryKey: ['collection', year, nbhd],
    queryFn: () => api.collection(year, nbhd || undefined),
  });
  const rows = useMemo(() => collection.data ?? [], [collection.data]);
  const loadError = collection.error ?? neighbourhoods.error;

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

  /** Open/close the family panel without leaving the list (keeps filters and scroll). */
  const setFamily = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('familja', id); else next.delete('familja');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
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
    mutationFn: ({ ids }: PayArgs) => api.payBulk({ family_ids: ids, year }),
    onSuccess: async (res, vars) => {
      setSelected((prev) => {
        if (!vars.singleFamilyId) return new Set();
        const next = new Set(prev);
        next.delete(vars.singleFamilyId);
        return next;
      });
      if (vars.singleFamilyId && res.ids[0]) {
        setJustPaid((prev) => new Map(prev).set(paidKey(vars.singleFamilyId as string), res.ids[0]));
      }
      refresh();
      if (res.skipped.length > 0) toast.info(sq.messages.alreadyPaid);
      if (res.ids.length === 0) return;
      toastUndo(sq.messages.paid, async () => {
        try {
          await Promise.all(res.ids.map(deletePayment));
          setJustPaid((prev) => {
            const next = new Map(prev);
            for (const [key, payment] of next) {
              if (res.ids.includes(payment)) next.delete(key);
            }
            return next;
          });
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
    payFamilies.mutate({ ids: [id], singleFamilyId: id }, {
      onSettled: () =>
        setBusy((b) => {
          const n = new Set(b);
          n.delete(id);
          return n;
        }),
    });
  };

  const undoOne = async (family: string, payment: string) => {
    try {
      await deletePayment(payment);
      setJustPaid((prev) => {
        const next = new Map(prev);
        next.delete(paidKey(family));
        return next;
      });
      toast.info(sq.messages.undone);
      refresh();
    } catch (e) {
      toast.error(errMsg(e));
    }
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
        <button
          type="button"
          className="font-semibold text-primary underline-offset-2 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            setFamily(f.id);
          }}
        >
          {fullName(f)}
        </button>
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
      render: (f) => {
        if (!f.paid) {
          return (
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
          );
        }
        const recentPayment = justPaid.get(paidKey(f.id));
        const date = f.payment ? formatDay(f.payment.created_at) : '';
        if (recentPayment) {
          return (
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <span className="font-medium text-primary">
                {sq.status.paid} tani · {date}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  undoOne(f.id, recentPayment);
                }}
              >
                {sq.actions.undo}
              </Button>
            </div>
          );
        }
        return <span className="text-sm text-muted">{sq.status.paid} · {date}</span>;
      },
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
            <Button disabled={payFamilies.isPending} onClick={() => payFamilies.mutate({ ids: unpaidSelected })}>
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
        <TabsContent value={tab}>
          {loadError ? (
            <div role="alert" className="rounded-card border border-border bg-surface p-6 text-center">
              <p className="text-sm text-danger">{errMsg(loadError)}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  void collection.refetch();
                  void neighbourhoods.refetch();
                }}
              >
                {sq.actions.retry}
              </Button>
            </div>
          ) : (
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
          )}
        </TabsContent>
      </Tabs>

      {phone && unpaidSelected.length > 0 && (
        <div className="on-dark fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-active bg-sidebar p-3 shadow-lg">
          <Button
            className="w-full bg-gold text-sidebar hover:bg-gold hover:opacity-90"
            disabled={payFamilies.isPending}
            onClick={() => payFamilies.mutate({ ids: unpaidSelected })}
          >
            {markPaidLabel}
          </Button>
        </div>
      )}

      <FamilySheet familyId={familyId} year={year} onClose={() => setFamily(null)} />
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
