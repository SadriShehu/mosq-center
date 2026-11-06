'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { errMsg, useToast } from '@/components/Toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatMoney, formatPercent, ratio } from '@/lib/format';
import { useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { Neighbourhood, Region } from '@/lib/types';

const VILLAGES: Record<string, string[]> = {
  Junik: ['Junik', 'Jasiq', 'Gjocaj'],
  Gjakove: ['Gjakove', 'Batushe', 'Dobrosh', 'Molliq', 'Rracaj'],
};

const schema = z.object({
  name: z.string().trim().min(1, sq.errors.required),
  region: z.string().min(1, sq.errors.required),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { name: '', region: '', city: '', postal_code: '' };

function NeighbourhoodFields({
  form, regions, villages, idPrefix, country,
}: {
  form: UseFormReturn<FormValues>;
  regions: Region[];
  villages: string[];
  idPrefix: string;
  country: string;
}) {
  const { errors } = form.formState;

  function onRegionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    form.setValue('region', name);
    form.setValue('city', '');
    form.setValue('postal_code', regions.find((r) => r.name === name)?.zip ?? '');
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>{sq.fields.name}</Label>
        <Input id={`${idPrefix}-name`} {...form.register('name')} />
        {errors.name && <p role="alert" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-region`}>{sq.fields.city}</Label>
        <Select id={`${idPrefix}-region`} {...form.register('region', { onChange: onRegionChange })}>
          <option value="" disabled>{sq.fields.selectCity}</option>
          {regions.map((r) => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </Select>
        {errors.region && <p role="alert" className="mt-1 text-sm text-danger">{errors.region.message}</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-village`}>{sq.fields.village}</Label>
        <Select id={`${idPrefix}-village`} {...form.register('city')}>
          <option value="" disabled>{sq.fields.selectVillage}</option>
          {villages.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-postal`}>{sq.fields.postalCode}</Label>
        <Input id={`${idPrefix}-postal`} {...form.register('postal_code')} />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-country`}>{sq.fields.country}</Label>
        <Input id={`${idPrefix}-country`} value={country} disabled readOnly />
      </div>
    </div>
  );
}

function Content() {
  const qc = useQueryClient();
  const toast = useToast();
  const [year] = useYear();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Neighbourhood | null>(null);
  const [deleting, setDeleting] = useState<Neighbourhood | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['neighbourhoods'],
    queryFn: api.neighbourhoods.list,
  });
  const { data: regions = [] } = useQuery({ queryKey: ['regions'], queryFn: api.regions });
  const { data: stats } = useQuery({ queryKey: ['stats', year], queryFn: () => api.stats(year) });

  const statsById = new Map(stats?.neighbourhoods.map((s) => [s.id, s]) ?? []);

  const addForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const addRegion = useWatch({ control: addForm.control, name: 'region' });
  const editRegion = useWatch({ control: editForm.control, name: 'region' });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['neighbourhoods'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
    qc.invalidateQueries({ queryKey: ['collection'] });
    qc.invalidateQueries({ queryKey: ['families'] });
  };

  const create = useMutation({
    mutationFn: (values: FormValues) => api.neighbourhoods.create({ ...values, country: 'Kosove' }),
    onSuccess: () => {
      setAddOpen(false);
      addForm.reset(EMPTY);
      invalidate();
      toast.success(sq.messages.created);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: (values: FormValues) => {
      if (!editing) return Promise.reject(new Error(sq.errors.unknown));
      return api.neighbourhoods.update(editing.id, { ...values, country: editing.country || 'Kosove' });
    },
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast.success(sq.messages.updated);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: () => {
      if (!deleting) return Promise.reject(new Error(sq.errors.unknown));
      return api.neighbourhoods.remove(deleting.id);
    },
    onSuccess: () => {
      setDeleting(null);
      invalidate();
      toast.success(sq.messages.deleted);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  function openAdd() {
    addForm.reset(EMPTY);
    setAddOpen(true);
  }

  function openEdit(n: Neighbourhood) {
    editForm.reset({
      name: n.name,
      region: n.region,
      city: n.city,
      postal_code: n.postal_code,
    });
    setEditing(n);
  }

  const columns: Column<Neighbourhood>[] = [
    { header: sq.fields.neighbourhood, primary: true, render: (n) => n.name },
    { header: sq.fields.city, render: (n) => n.region },
    { header: sq.fields.village, render: (n) => n.city },
    { header: sq.fields.families, render: (n) => statsById.get(n.id)?.families ?? 0 },
    {
      header: sq.status.paid,
      render: (n) => {
        const s = statsById.get(n.id);
        if (!s) return '—';
        return `${formatPercent(ratio(s.paid_families, s.families))} (${s.paid_families}/${s.families})`;
      },
    },
    { header: sq.collection.collected, render: (n) => formatMoney(statsById.get(n.id)?.collected ?? 0) },
    { header: sq.collection.expected, render: (n) => formatMoney(statsById.get(n.id)?.expected ?? 0) },
    {
      header: sq.actions.edit,
      render: (n) => (
        <Button variant="outline" size="sm" aria-label={sq.actions.edit} onClick={() => openEdit(n)}>
          <Pencil aria-hidden />
        </Button>
      ),
    },
    {
      header: sq.actions.delete,
      render: (n) => (
        <Button variant="danger-soft" size="sm" aria-label={sq.actions.delete} onClick={() => setDeleting(n)}>
          <Trash2 aria-hidden />
        </Button>
      ),
    },
  ];

  const deletingFamilies = deleting ? statsById.get(deleting.id)?.families ?? 0 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold">{sq.nav.neighbourhoods}</h1>
        <Button onClick={openAdd}>
          <Plus aria-hidden /> {sq.actions.addNeighbourhood}
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(n) => n.id}
        searchText={(n) => `${n.name} ${n.region} ${n.city}`}
        loading={isLoading}
        empty={(
          <EmptyState title={sq.empty.list}>
            <Button onClick={openAdd}><Plus aria-hidden /> {sq.actions.addNeighbourhood}</Button>
          </EmptyState>
        )}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={addForm.handleSubmit((v) => create.mutate(v))} noValidate>
            <DialogHeader>
              <DialogTitle>{sq.actions.addNeighbourhood}</DialogTitle>
              <DialogDescription>{sq.fields.selectCity}</DialogDescription>
            </DialogHeader>
            <NeighbourhoodFields
              form={addForm}
              regions={regions}
              villages={VILLAGES[addRegion] ?? []}
              idPrefix="add"
              country="Kosove"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>{sq.actions.cancel}</Button>
              <Button type="submit" disabled={create.isPending}>{sq.actions.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <form onSubmit={editForm.handleSubmit((v) => update.mutate(v))} noValidate>
            <DialogHeader>
              <DialogTitle>{sq.actions.edit}</DialogTitle>
            </DialogHeader>
            <NeighbourhoodFields
              form={editForm}
              regions={regions}
              villages={VILLAGES[editRegion] ?? []}
              idPrefix="edit"
              country={editing?.country || 'Kosove'}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>{sq.actions.cancel}</Button>
              <Button type="submit" disabled={update.isPending}>{sq.actions.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sq.actions.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {sq.messages.confirmDelete('lagje')} {sq.messages.deleteNeighbourhoodConsequence(deletingFamilies)}
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
