'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { faFloppyDisk, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthGuard } from '@/components/AuthGuard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable, type Column } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { errMsg, useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { FamilyDetails } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(1, 'Emri eshte i detyrueshem'),
  middle_name: z.string().optional(),
  surname: z.string().trim().min(1, 'Mbiemri eshte i detyrueshem'),
  members: z.number().int().positive('Numri i antareve duhet te jete pozitiv'),
  neighbourhood_id: z.string().min(1, 'Zgjidh lagjen'),
});

type FormValues = z.infer<typeof schema>;

const EMPTY = {
  name: '',
  middle_name: '',
  surname: '',
  members: 0,
  neighbourhood_id: '',
};

const COLUMNS: Column<FamilyDetails>[] = [
  { header: 'Emri', render: (f) => f.name },
  { header: 'Prindi', render: (f) => f.middle_name },
  { header: 'Mbimeri', render: (f) => f.surname },
  { header: 'Numri i antareve', render: (f) => f.members },
  { header: 'Lagje', render: (f) => f.neighbourhood_name },
  { header: 'Krijuar me', render: (f) => formatDate(f.created_at) },
  { header: 'Ndryshuar me', render: (f) => formatDate(f.updated_at) },
];

function Content() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<FamilyDetails | null>(null);
  const [deleting, setDeleting] = useState<FamilyDetails | null>(null);

  const { data: familyList, error } = useQuery({ queryKey: ['families'], queryFn: api.families.details });
  const rows = familyList ?? [];
  const { data: neighbourhoodList } = useQuery({
    queryKey: ['neighbourhoods'],
    queryFn: api.neighbourhoods.list,
  });
  const neighbourhoods = useMemo(() => neighbourhoodList ?? [], [neighbourhoodList]);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const create = useMutation({
    mutationFn: (values: FormValues) => api.families.create(values),
    onSuccess: () => {
      form.reset(EMPTY);
      qc.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: (values: FormValues) => {
      if (!editing) return Promise.reject(new Error('Nuk ka familje per ndryshim'));
      return api.families.update(editing.id, values);
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.families.remove(id),
    onSuccess: () => {
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['families'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  function openEdit(f: FamilyDetails) {
    editForm.reset({
      name: f.name,
      middle_name: f.middle_name,
      surname: f.surname,
      members: f.members,
      neighbourhood_id: f.neighbourhood_id,
    });
    setEditing(f);
  }

  const columns: Column<FamilyDetails>[] = [
    ...COLUMNS,
    {
      header: 'Ndrysho',
      render: (f) => (
        <Button variant="success" size="sm" aria-label="Ndrysho" onClick={() => openEdit(f)}>
          <FontAwesomeIcon icon={faPenToSquare} />
        </Button>
      ),
    },
    {
      header: 'Fshi',
      render: (f) => (
        <Button variant="danger" size="sm" aria-label="Fshi" onClick={() => setDeleting(f)}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="container">
        <h1>Krijo Familje</h1>
        <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate>
          <div className="row g-3">
            <div className="col-lg-2 col-md-6">
              <input
                {...form.register('name')}
                type="text"
                placeholder="Emri"
                aria-label="Emri"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <input
                {...form.register('middle_name')}
                type="text"
                placeholder="Emri i Prindit"
                aria-label="Emri i Prindit"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <input
                {...form.register('surname')}
                type="text"
                placeholder="Mbiemri"
                aria-label="Mbiemri"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <input
                {...form.register('members', { valueAsNumber: true })}
                type="number"
                placeholder="Numri i anetareve"
                aria-label="Numri i anetareve"
                className="form-control"
              />
            </div>
            <div className="col-lg-2 col-md-6">
              <select
                {...form.register('neighbourhood_id')}
                aria-label="Lagje"
                className="form-control"
              >
                <option value="" disabled>Zgjidh lagjen</option>
                {neighbourhoods.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
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
        <h3>Lista e familjeve</h3>
        {error && <p className="text-danger">{errMsg(error)}</p>}
        <div className="table-responsive">
          <DataTable columns={columns} rows={rows} rowKey={(f) => f.id} />
        </div>
      </div>

      <FormModal
        show={editing !== null}
        title="Ndrysho Familjen"
        submitLabel="Ruaj"
        busy={update.isPending}
        onHide={() => setEditing(null)}
        onSubmit={editForm.handleSubmit((v) => update.mutate(v))}
      >
        <div className="mb-3">
          <label htmlFor="m_name" className="form-label">Emri</label>
          <input {...editForm.register('name')} id="m_name" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_middlename" className="form-label">Prindi</label>
          <input {...editForm.register('middle_name')} id="m_middlename" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_surname" className="form-label">Mbiemri</label>
          <input {...editForm.register('surname')} id="m_surname" type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_members" className="form-label">Anetaret</label>
          <input {...editForm.register('members', { valueAsNumber: true })} id="m_members" type="number" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="m_neighbourhood_id" className="form-label">Lagje</label>
          <select {...editForm.register('neighbourhood_id')} id="m_neighbourhood_id" className="form-control">
            {neighbourhoods.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <ConfirmDialog
        show={deleting !== null}
        title="Konfirmo fshirjen"
        message="A jeni i sigurt qe deshironi te fshini kete familje?"
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
