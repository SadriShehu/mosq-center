'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { errMsg, useToast } from '@/components/Toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDay, formatMoney } from '@/lib/format';
import { useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { CollectionRow, FamilyDetails, Neighbourhood } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(1, sq.errors.required),
  middle_name: z.string().optional(),
  surname: z.string().trim().min(1, sq.errors.required),
  members: z
    .number({ error: sq.errors.positive })
    .int(sq.errors.positive)
    .positive(sq.errors.positive),
  neighbourhood_id: z.string().min(1, sq.errors.required),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { name: '', middle_name: '', surname: '', members: 0, neighbourhood_id: '' };

function fullName(family: FamilyDetails): string {
  return [family.name, family.middle_name, family.surname].filter(Boolean).join(' ');
}

function FamilyFields({
  form, neighbourhoods, idPrefix,
}: {
  form: UseFormReturn<FormValues>;
  neighbourhoods: Neighbourhood[];
  idPrefix: string;
}) {
  const { errors } = form.formState;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>{sq.fields.name}</Label>
        <Input id={`${idPrefix}-name`} {...form.register('name')} />
        {errors.name && <p role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-parent`}>{sq.fields.parentName}</Label>
        <Input id={`${idPrefix}-parent`} {...form.register('middle_name')} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-surname`}>{sq.fields.surname}</Label>
        <Input id={`${idPrefix}-surname`} {...form.register('surname')} />
        {errors.surname && <p role="alert" className="mt-1 text-sm text-danger">{errors.surname.message}</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-members`}>{sq.fields.memberCount}</Label>
        <Input id={`${idPrefix}-members`} type="number" {...form.register('members', { valueAsNumber: true })} />
        {errors.members && <p role="alert" className="mt-1 text-sm text-danger">{errors.members.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-neighbourhood`}>{sq.fields.neighbourhood}</Label>
        <Select id={`${idPrefix}-neighbourhood`} {...form.register('neighbourhood_id')}>
          <option value="" disabled>{sq.fields.selectNeighbourhood}</option>
          {neighbourhoods.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </Select>
        {errors.neighbourhood_id && (
          <p role="alert" className="mt-1 text-sm text-danger">{errors.neighbourhood_id.message}</p>
        )}
      </div>
    </div>
  );
}

function Content() {
  const qc = useQueryClient();
  const toast = useToast();
  const [year] = useYear();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filter, setFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const openId = params.get('id');

  function setOpenId(id?: string) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('id', id); else next.delete('id');
    router.replace(`${pathname}?${next.toString()}`);
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['collection', year, filter],
    queryFn: () => api.collection(year, filter || undefined),
  });
  const { data: neighbourhoods = [] } = useQuery({
    queryKey: ['neighbourhoods'],
    queryFn: api.neighbourhoods.list,
  });
  const {
    data: history, isLoading: historyLoading, error: historyError,
  } = useQuery({
    queryKey: ['family-history', openId],
    queryFn: () => api.familyHistory(openId as string),
    enabled: !!openId,
  });

  const invalidateLists = () => {
    qc.invalidateQueries({ queryKey: ['collection'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    qc.invalidateQueries({ queryKey: ['families'] });
  };
  const invalidateHistory = () => {
    if (openId) qc.invalidateQueries({ queryKey: ['family-history', openId] });
    invalidateLists();
  };

  const addForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const create = useMutation({
    mutationFn: (values: FormValues) => api.families.create(values),
    onSuccess: () => {
      setAddOpen(false);
      addForm.reset(EMPTY);
      invalidateLists();
      toast.success(sq.messages.created);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: (values: FormValues) => {
      if (!history) return Promise.reject(new Error(sq.errors.unknown));
      return api.families.update(history.family.id, values);
    },
    onSuccess: () => {
      setEditOpen(false);
      invalidateHistory();
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
      setOpenId(undefined);
      invalidateLists();
      toast.success(sq.messages.deleted);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const unpaidYears = history?.years.filter((y) => !y.paid).map((y) => y.year) ?? [];

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
      invalidateHistory();
      toast.success(sq.messages.paid);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function openAdd() {
    addForm.reset(EMPTY);
    setAddOpen(true);
  }

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

  const columns: Column<CollectionRow>[] = [
    { header: sq.fields.name, primary: true, render: (f) => fullName(f) },
    { header: sq.fields.neighbourhood, render: (f) => f.neighbourhood_name },
    { header: sq.fields.members, render: (f) => f.members },
    { header: sq.fields.status, render: (f) => <StatusBadge paid={f.paid} /> },
  ];

  const paymentByYear = new Map(history?.payments.map((p) => [p.year, p]) ?? []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold">{sq.nav.families}</h1>
        <Button onClick={openAdd}>
          <Plus aria-hidden /> {sq.actions.addFamily}
        </Button>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="neighbourhood-filter">{sq.fields.neighbourhood}</Label>
        <Select
          id="neighbourhood-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">{sq.tabs.all}</option>
          {neighbourhoods.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(f) => f.id}
        searchText={(f) => `${fullName(f)} ${f.neighbourhood_name}`}
        loading={isLoading}
        onRowClick={(f) => setOpenId(f.id)}
        empty={(
          <EmptyState title={sq.empty.list}>
            <Button onClick={openAdd}><Plus aria-hidden /> {sq.actions.addFamily}</Button>
          </EmptyState>
        )}
      />

      <Sheet open={!!openId} onOpenChange={(open) => { if (!open) setOpenId(undefined); }}>
        <SheetContent side="right" className="gap-4">
          <SheetHeader>
            <SheetTitle>{history ? fullName(history.family) : sq.loading}</SheetTitle>
            <SheetDescription>{history?.family.neighbourhood_name ?? ''}</SheetDescription>
          </SheetHeader>

          {historyLoading && (
            <div className="space-y-2" role="status" aria-label={sq.loading}>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {historyError && <p role="alert" className="text-sm text-danger">{errMsg(historyError)}</p>}

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

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openEdit(history.family)}>
                  <Pencil aria-hidden /> {sq.actions.edit}
                </Button>
                <Button variant="danger-soft" onClick={() => setDeleteOpen(true)}>
                  <Trash2 aria-hidden /> {sq.actions.delete}
                </Button>
              </div>

              <section>
                <h3 className="font-heading text-base font-bold">{sq.history.title}</h3>
                <ul className="mt-2 space-y-2">
                  {history.years.map((y) => {
                    const payment = paymentByYear.get(y.year);
                    return (
                      <li
                        key={y.year}
                        className="flex items-center justify-between gap-3 rounded-control border border-border px-3 py-2"
                      >
                        <span className="font-medium">{y.year}</span>
                        <span className="flex items-center gap-3">
                          {payment && <span className="text-sm text-muted">{formatMoney(payment.amount)}</span>}
                          <StatusBadge paid={y.paid} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {unpaidYears.length > 0 && (
                  <Button
                    className="mt-3 w-full"
                    onClick={() => payRemaining.mutate()}
                    disabled={payRemaining.isPending}
                  >
                    <Wallet aria-hidden /> {sq.actions.payRemainingYears}
                  </Button>
                )}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={addForm.handleSubmit((v) => create.mutate(v))} noValidate>
            <DialogHeader>
              <DialogTitle>{sq.actions.addFamily}</DialogTitle>
              <DialogDescription>{sq.fields.selectNeighbourhood}</DialogDescription>
            </DialogHeader>
            <FamilyFields form={addForm} neighbourhoods={neighbourhoods} idPrefix="add" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{sq.actions.cancel}</Button>
              <Button type="submit" disabled={create.isPending}>{sq.actions.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <Content />
      </Suspense>
    </AuthGuard>
  );
}
