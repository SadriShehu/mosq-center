'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { faFloppyDisk, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AuthGuard } from '@/components/AuthGuard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable, type Column } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { errMsg, useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Neighbourhood } from '@/lib/types';

const CITIES: Record<string, string[]> = {
  Junik: ['Junik', 'Jasiq', 'Gjocaj'],
  Gjakove: ['Gjakove', 'Batushe', 'Dobrosh', 'Molliq', 'Rracaj'],
};

const schema = z.object({
  name: z.string().trim().min(1, 'Emri i lagjes eshte i detyrueshem'),
  region: z.string().min(1, 'Zgjidh qytetin'),
  city: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = { name: '', region: '', city: '', country: 'Kosove', postal_code: '' };

const COLUMNS: Column<Neighbourhood>[] = [
  { header: 'Emri i lagjes', render: (n) => n.name },
  { header: 'Qyteti', render: (n) => n.region },
  { header: 'Fshati', render: (n) => n.city },
  { header: 'Shteti', render: (n) => n.country },
  { header: 'Kodi Postal', render: (n) => n.postal_code },
  { header: 'Krijuar me', render: (n) => formatDate(n.created_at) },
  { header: 'Ndryshuar me', render: (n) => formatDate(n.updated_at) },
];

function Content() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Neighbourhood | null>(null);
  const [deleting, setDeleting] = useState<Neighbourhood | null>(null);

  const { data: neighbourhoods, error } = useQuery({ queryKey: ['neighbourhoods'], queryFn: api.neighbourhoods.list });
  const rows = neighbourhoods ?? [];
  const { data: regionList } = useQuery({ queryKey: ['regions'], queryFn: api.regions });
  const regions = useMemo(() => regionList ?? [], [regionList]);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const region = useWatch({ control: form.control, name: 'region' });
  const cities = region ? CITIES[region] ?? [] : [];

  function onRegionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    form.setValue('region', name);
    form.setValue('postal_code', regions.find((r) => r.name === name)?.zip ?? '');
    form.setValue('city', '');
  }

  const create = useMutation({
    mutationFn: (values: FormValues) => api.neighbourhoods.create({ ...values, country: 'Kosove' }),
    onSuccess: () => {
      form.reset(EMPTY);
      qc.invalidateQueries({ queryKey: ['neighbourhoods'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: (values: FormValues) => {
      if (!editing) return Promise.reject(new Error('Nuk ka lagje per ndryshim'));
      return api.neighbourhoods.update(editing.id, values);
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['neighbourhoods'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.neighbourhoods.remove(id),
    onSuccess: () => {
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['neighbourhoods'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  function openEdit(n: Neighbourhood) {
    editForm.reset({
      name: n.name,
      region: n.region,
      city: n.city,
      country: n.country,
      postal_code: n.postal_code,
    });
    setEditing(n);
  }

  const columns: Column<Neighbourhood>[] = [
    ...COLUMNS,
    {
      header: 'Ndrysho',
      render: (n) => (
        <Button variant="success" size="sm" aria-label="Ndrysho" onClick={() => openEdit(n)}>
          <FontAwesomeIcon icon={faPenToSquare} />
        </Button>
      ),
    },
    {
      header: 'Fshi',
      render: (n) => (
        <Button variant="danger" size="sm" aria-label="Fshi" onClick={() => setDeleting(n)}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="container">
        <br />
        <h1>Krijo Lagje</h1>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate>
          <div className="row g-3">
            <div className="col-lg-2 col-md-6">
              <input
                {...form.register('name')}
                type="text"
                placeholder="Emri i lagjes"
                aria-label="Emri i lagjes"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <select {...form.register('region', { onChange: onRegionChange })} aria-label="Qyteti" className="form-control">
                <option value="" disabled>Zgjidh Qytetin</option>
                {regions.map((r) => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <select {...form.register('city')} aria-label="Fshati" className="form-control">
                <option value="" disabled>Zgjidh Fshatin</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <input
                {...form.register('postal_code')}
                type="text"
                placeholder="Kodi Postal"
                aria-label="Kodi Postal"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <input
                type="text"
                value="Kosove"
                disabled
                readOnly
                aria-label="Shteti"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <Button type="submit" variant="success" disabled={create.isPending}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Ruaj
              </Button>
            </div>
          </div>
        </form>
        <br />
      </div>

      <div className="container">
        <h3>Lista e lagjeve</h3>
        {error && <p className="text-danger">{errMsg(error)}</p>}
        <div className="table-responsive">
          <DataTable columns={columns} rows={rows} rowKey={(n) => n.id} />
        </div>
      </div>

      <FormModal
        show={editing !== null}
        title="Ndrysho Lagjen"
        submitLabel="Ruaj"
        busy={update.isPending}
        onHide={() => setEditing(null)}
        onSubmit={editForm.handleSubmit((v) => update.mutate(v))}
      >
        <div className="mb-3">
          <label htmlFor="m_name" className="form-label">Emri i lagjes</label>
          <input {...editForm.register('name')} id="m_name" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_region" className="form-label">Qyteti</label>
          <input {...editForm.register('region')} id="m_region" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_city" className="form-label">Fshati</label>
          <input {...editForm.register('city')} id="m_city" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_country" className="form-label">Shteti</label>
          <input {...editForm.register('country')} id="m_country" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_postal_code" className="form-label">Kodi Postal</label>
          <input {...editForm.register('postal_code')} id="m_postal_code" type="text" className="form-control" />
        </div>
      </FormModal>

      <ConfirmDialog
        show={deleting !== null}
        title="Konfirmo fshirjen"
        message="A jeni i sigurt qe deshironi te fshini kete lagje?"
        confirmLabel="Fshije"
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Content />
    </AuthGuard>
  );
}
