'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import {
  EMPTY_FAMILY, FamilyFields, familySchema, type FamilyFormValues,
} from '@/components/FamilyFields';
import { FamilySheet } from '@/components/FamilySheet';
import { errMsg, useToast } from '@/components/Toast';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useYear } from '@/lib/hooks';
import { sq } from '@/lib/sq';
import type { CollectionRow, FamilyDetails } from '@/lib/types';

function fullName(family: FamilyDetails): string {
  return [family.name, family.middle_name, family.surname].filter(Boolean).join(' ');
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

  const addForm = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: EMPTY_FAMILY,
  });

  const create = useMutation({
    mutationFn: (values: FamilyFormValues) => api.families.create(values),
    onSuccess: () => {
      setAddOpen(false);
      addForm.reset(EMPTY_FAMILY);
      qc.invalidateQueries({ queryKey: ['collection'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['families'] });
      toast.success(sq.messages.created);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const columns: Column<CollectionRow>[] = [
    { header: sq.fields.name, primary: true, render: (f) => fullName(f) },
    { header: sq.fields.neighbourhood, render: (f) => f.neighbourhood_name },
    { header: sq.fields.members, render: (f) => f.members },
    { header: sq.fields.status, render: (f) => <StatusBadge paid={f.paid} /> },
  ];

  function openAdd() {
    addForm.reset(EMPTY_FAMILY);
    setAddOpen(true);
  }

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
        <Select id="neighbourhood-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
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

      <FamilySheet familyId={openId} year={year} onClose={() => setOpenId(undefined)} />

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
