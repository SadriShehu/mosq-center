'use client';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { errMsg, useToast } from '@/components/Toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { PaymentDetails } from '@/lib/types';

const num = (msg: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ error: msg }));

const editSchema = z.object({
  amount: num(sq.errors.required).pipe(z.number().positive(sq.errors.badRequest)),
  year: num(sq.errors.required).pipe(z.number().int().min(1900, sq.errors.badRequest)),
});
type EditIn = z.input<typeof editSchema>;
type EditOut = z.output<typeof editSchema>;

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

function Ledger() {
  const [year] = useYear();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const nbhdId = params.get('lagjja') ?? '';
  const qc = useQueryClient();
  const toast = useToast();

  const [editing, setEditing] = useState<PaymentDetails | null>(null);
  const [deleting, setDeleting] = useState<PaymentDetails | null>(null);

  const neighbourhoods = useQuery({ queryKey: ['neighbourhoods'], queryFn: api.neighbourhoods.list });
  const payments = useQuery({
    queryKey: ['payments', 'details', year],
    queryFn: () => api.payments.details({ year }),
  });

  const nbhdName = neighbourhoods.data?.find((n) => n.id === nbhdId)?.name;
  const rows = useMemo(
    () => (payments.data ?? []).filter((p) => !nbhdId || (nbhdName !== undefined && p.neighbourhood_name === nbhdName)),
    [payments.data, nbhdId, nbhdName],
  );

  const refresh = () => {
    for (const k of ['payments', 'collection', 'stats', 'family-history']) qc.invalidateQueries({ queryKey: [k] });
  };

  const form = useForm<EditIn, unknown, EditOut>({ resolver: zodResolver(editSchema) });
  const errors = form.formState.errors;

  const update = useMutation({
    mutationFn: ({ p, d }: { p: PaymentDetails; d: EditOut }) =>
      api.payments.update(p.id, { family_id: p.family_id, amount: d.amount, year: d.year }),
    onSuccess: () => {
      toast.success(sq.messages.updated);
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.payments.remove(id),
    onSuccess: () => {
      toast.success(sq.messages.deleted);
      setDeleting(null);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const setNbhd = (id: string) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('lagjja', id); else next.delete('lagjja');
    router.replace(`${pathname}?${next.toString()}`);
  };

  const openEdit = (p: PaymentDetails) => {
    form.reset({ amount: p.amount, year: p.year });
    setEditing(p);
  };

  const exportCsv = () => {
    const head = [sq.fields.name, sq.fields.members, sq.fields.amount, sq.fields.year, sq.fields.neighbourhood, sq.fields.createdAt];
    const lines = [head, ...rows.map((p) => [p.family_name, p.members, p.amount, p.year, p.neighbourhood_name, p.created_at])]
      .map((r) => r.map(csvCell).join(','));
    // UTF-8 BOM so Excel shows ë / ç correctly
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagesat-${year}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns: Column<PaymentDetails>[] = [
    { header: sq.fields.name, primary: true, render: (p) => p.family_name },
    { header: sq.fields.members, render: (p) => p.members },
    { header: sq.fields.amount, render: (p) => formatMoney(p.amount) },
    { header: sq.fields.year, render: (p) => p.year },
    { header: sq.fields.neighbourhood, render: (p) => p.neighbourhood_name },
    { header: sq.fields.createdAt, render: (p) => formatDate(p.created_at) },
    {
      header: sq.actions.edit,
      render: (p) => (
        <Button variant="ghost" size="icon" aria-label={`${sq.actions.edit}: ${p.family_name}`} onClick={() => openEdit(p)}>
          <Pencil aria-hidden />
        </Button>
      ),
    },
    {
      header: sq.actions.delete,
      render: (p) => (
        <Button variant="danger-soft" size="icon" aria-label={`${sq.actions.delete}: ${p.family_name}`} onClick={() => setDeleting(p)}>
          <Trash2 aria-hidden />
        </Button>
      ),
    },
  ];
  const err = (m?: string) => (m ? <p className="mt-1 text-sm text-danger">{m}</p> : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold">{sq.nav.payments}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label={sq.fields.neighbourhood} className="min-w-48" value={nbhdId} onChange={(e) => setNbhd(e.target.value)}>
            <option value="">{sq.fields.allNeighbourhoods}</option>
            {neighbourhoods.data?.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </Select>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download aria-hidden /> {sq.actions.exportCsv}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        searchText={(p) => p.family_name}
        loading={payments.isLoading}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form
            noValidate
            onSubmit={form.handleSubmit((d) => editing && update.mutate({ p: editing, d }))}
          >
            <DialogHeader>
              <DialogTitle>{sq.actions.edit}</DialogTitle>
              <DialogDescription>{editing?.family_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="p_amount">{sq.fields.amount}</Label>
                <Input id="p_amount" type="number" step=".01" aria-invalid={!!errors.amount} {...form.register('amount')} />
                {err(errors.amount?.message)}
              </div>
              <div>
                <Label htmlFor="p_year">{sq.fields.year}</Label>
                <Input id="p_year" type="number" aria-invalid={!!errors.year} {...form.register('year')} />
                {err(errors.year?.message)}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>{sq.actions.cancel}</Button>
              <Button type="submit" disabled={update.isPending}>{sq.actions.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sq.actions.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {sq.messages.confirmDelete('pagesë')} {deleting?.family_name}, {deleting?.year}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{sq.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) remove.mutate(deleting.id);
              }}
            >
              {sq.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Suspense>
        <Ledger />
      </Suspense>
    </AuthGuard>
  );
}
