'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { errMsg, useToast } from '@/components/Toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FamilyFields, EMPTY_FAMILY, familySchema, type FamilyFormValues } from '@/components/FamilyFields';
import { api } from '@/lib/api';
import { formatDay, formatMoney } from '@/lib/format';
import { sq } from '@/lib/sq';
import type { FamilyDetails } from '@/lib/types';

interface Props {
  familyId: string | null;
  year: number;
  onClose: () => void;
}

function fullName(family: FamilyDetails): string {
  return [family.name, family.middle_name, family.surname].filter(Boolean).join(' ');
}

/**
 * The family panel: details, edit, payment history grid, pay remaining years and delete.
 * Shared by /familjet (right sheet) and /mbledhja (in-place panel). Page code stays outside.
 */
export function FamilySheet({ familyId, year, onClose }: Props) {
  const qc = useQueryClient();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: history, isLoading, error,
  } = useQuery({
    queryKey: ['family-history', familyId],
    queryFn: () => api.familyHistory(familyId as string),
    enabled: !!familyId,
  });
  const { data: stats } = useQuery({
    queryKey: ['stats', year],
    queryFn: () => api.stats(year),
    enabled: !!familyId,
  });
  const { data: neighbourhoods = [] } = useQuery({
    queryKey: ['neighbourhoods'],
    queryFn: api.neighbourhoods.list,
  });

  const editForm = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: EMPTY_FAMILY,
  });

  const invalidateAll = () => {
    if (familyId) qc.invalidateQueries({ queryKey: ['family-history', familyId] });
    qc.invalidateQueries({ queryKey: ['collection'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    qc.invalidateQueries({ queryKey: ['families'] });
  };

  const update = useMutation({
    mutationFn: (values: FamilyFormValues) => {
      if (!history) return Promise.reject(new Error(sq.errors.unknown));
      return api.families.update(history.family.id, values);
    },
    onSuccess: () => {
      setEditOpen(false);
      invalidateAll();
      toast.success(sq.messages.updated);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: () => {
      if (!history) return Promise.reject(new Error(sq.errors.unknown));
      return api.families.remove(history.family.id);
    },
    onSuccess: () => {
      setDeleteOpen(false);
      invalidateAll();
      onClose();
      toast.success(sq.messages.deleted);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const unpaidYears = history?.years.filter((y) => !y.paid).map((y) => y.year) ?? [];
  const fee = stats?.fee_per_member;
  const total = history && fee !== undefined ? unpaidYears.length * history.family.members * fee : undefined;

  const payRemaining = useMutation({
    mutationFn: () => {
      if (!history || unpaidYears.length === 0) return Promise.reject(new Error(sq.errors.unknown));
      const first = Math.min(...unpaidYears);
      const last = Math.max(...unpaidYears);
      return api.payBulk({
        family_ids: [history.family.id],
        year: first,
        range_year: last > first ? last : undefined,
      });
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(sq.messages.paid);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function openEdit(family: FamilyDetails) {
    editForm.reset({
      name: family.name,
      middle_name: family.middle_name,
      surname: family.surname,
      members: family.members,
      neighbourhood_id: family.neighbourhood_id,
    });
    setEditOpen(true);
  }

  const paymentByYear = new Map(history?.payments.map((p) => [p.year, p]) ?? []);

  return (
    <>
      <Sheet open={!!familyId} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="gap-4">
          <SheetHeader>
            <SheetTitle>{history ? fullName(history.family) : sq.loading}</SheetTitle>
            <SheetDescription>{history?.family.neighbourhood_name ?? ''}</SheetDescription>
          </SheetHeader>

          {isLoading && (
            <div className="space-y-2" role="status" aria-label={sq.loading}>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-danger">{errMsg(error)}</p>}

          {history && (
            <div className="space-y-6">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted">{sq.fields.name}</dt>
                <dd className="text-right font-medium">{history.family.name}</dd>
                <dt className="text-muted">{sq.fields.parentName}</dt>
                <dd className="text-right font-medium">{history.family.middle_name || '—'}</dd>
                <dt className="text-muted">{sq.fields.surname}</dt>
                <dd className="text-right font-medium">{history.family.surname}</dd>
                <dt className="text-muted">{sq.fields.members}</dt>
                <dd className="text-right font-medium">{history.family.members}</dd>
                <dt className="text-muted">{sq.fields.neighbourhood}</dt>
                <dd className="text-right font-medium">{history.family.neighbourhood_name}</dd>
                <dt className="text-muted">{sq.fields.createdAt}</dt>
                <dd className="text-right font-medium">{formatDay(history.family.created_at)}</dd>
              </dl>

              <Button variant="outline" onClick={() => openEdit(history.family)}>
                <Pencil aria-hidden /> {sq.actions.edit}
              </Button>

              <section>
                <h3 className="font-heading text-base font-bold">{sq.history.title}</h3>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {history.years.map((y) => {
                    const payment = paymentByYear.get(y.year);
                    return (
                      <div
                        key={y.year}
                        className="rounded-control border border-border px-2 py-2 text-center"
                      >
                        <div className="text-sm font-semibold">{y.year}</div>
                        <StatusBadge paid={y.paid} className="mt-1" />
                        {payment && <div className="mt-1 text-xs text-muted">{formatMoney(payment.amount)}</div>}
                      </div>
                    );
                  })}
                </div>
                {unpaidYears.length > 0 && (
                  <Button
                    className="mt-3 w-full"
                    onClick={() => payRemaining.mutate()}
                    disabled={payRemaining.isPending}
                  >
                    <Wallet aria-hidden />
                    {sq.actions.payRemainingYears} ({unpaidYears.length})
                    {total !== undefined ? ` · ${formatMoney(total)}` : ''}
                  </Button>
                )}
              </section>

              <Button variant="danger-soft" onClick={() => setDeleteOpen(true)}>
                <Trash2 aria-hidden /> {sq.actions.deleteFamily}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={editForm.handleSubmit((v) => update.mutate(v))} noValidate>
            <DialogHeader>
              <DialogTitle>{sq.actions.edit}</DialogTitle>
            </DialogHeader>
            <FamilyFields form={editForm} neighbourhoods={neighbourhoods} idPrefix="edit" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>{sq.actions.cancel}</Button>
              <Button type="submit" disabled={update.isPending}>{sq.actions.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sq.actions.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {sq.messages.confirmDelete('familje')}
              {history && ` ${sq.messages.deleteFamilyConsequence(history.payments.length)}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{sq.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()} disabled={remove.isPending}>
              {sq.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
