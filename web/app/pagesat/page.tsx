'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPenToSquare, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { AuthGuard } from '@/components/AuthGuard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable, type Column } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { errMsg, useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { AMOUNT_PER_MEMBER } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { Family, PaymentDetails } from '@/lib/types';

const num = (msg: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ error: msg }));

const RANGE_MSG = 'Viti final duhet të jetë i barabartë ose më i madh se viti';

const createSchema = z.object({
  family_id: z.string().min(1, 'Zgjidh familjen'),
  amount: num('Shuma është e detyrueshme').pipe(z.number().positive('Shuma duhet të jetë pozitive')),
  year: num('Viti është i detyrueshëm').pipe(z.number().int().min(1900, 'Viti nuk është i vlefshëm')),
  range_year: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().optional(),
  ),
}).refine((d) => d.range_year == null || d.range_year >= d.year, {
  path: ['range_year'],
  message: RANGE_MSG,
});
type CreateForm = z.input<typeof createSchema>;
type CreateOut = z.output<typeof createSchema>;

const editSchema = z.object({
  family_id: z.string().min(1, 'Zgjidh familjen'),
  amount: num('Shuma është e detyrueshme').pipe(z.number().positive('Shuma duhet të jetë pozitive')),
  year: num('Viti është i detyrueshëm').pipe(z.number().int().min(1900, 'Viti nuk është i vlefshëm')),
});
type EditForm = z.input<typeof editSchema>;
type EditOut = z.output<typeof editSchema>;

const familyLabel = (f: Family) => [f.name, f.middle_name, f.surname].filter(Boolean).join(' ');

function PaymentsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sYear = params.get('s_year') ?? '';
  const qc = useQueryClient();
  const toast = useToast();

  const [multi, setMulti] = useState(false);
  const [yearInput, setYearInput] = useState(sYear);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PaymentDetails | null>(null);
  const [deleting, setDeleting] = useState<PaymentDetails | null>(null);

  const families = useQuery({ queryKey: ['families'], queryFn: api.families.list });
  const payments = useQuery({
    queryKey: ['payments', 'details', sYear],
    queryFn: () => api.payments.details(sYear ? { year: sYear } : {}),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['payments'] });

  const createForm = useForm<CreateForm, unknown, CreateOut>({
    resolver: zodResolver(createSchema),
    defaultValues: { family_id: '', amount: '', year: '', range_year: '' },
  });
  const editForm = useForm<EditForm, unknown, EditOut>({ resolver: zodResolver(editSchema) });

  const create = useMutation({
    mutationFn: api.payments.create,
    onSuccess: () => {
      toast.success('Pagesa u krijua');
      createForm.reset();
      setMulti(false);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const update = useMutation({
    mutationFn: ({ id, d }: { id: string; d: EditOut }) => api.payments.update(id, d),
    onSuccess: () => {
      toast.success('Pagesa u ndryshua');
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.payments.remove(id),
    onSuccess: () => {
      toast.success('Pagesa u fshi');
      setDeleting(null);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const onFamilyChange = (id: string) => {
    const f = families.data?.find((x) => x.id === id);
    if (f) createForm.setValue('amount', f.members * AMOUNT_PER_MEMBER);
  };

  const openEdit = (p: PaymentDetails) => {
    editForm.reset({ family_id: p.family_id, amount: p.amount, year: p.year });
    setEditing(p);
  };

  const columns: Column<PaymentDetails>[] = [
    { header: 'Emri i familjes', render: (p) => p.family_name },
    { header: 'Anetaret', render: (p) => p.members },
    { header: 'Shuma e pageses', render: (p) => p.amount },
    { header: 'Viti', render: (p) => p.year },
    { header: 'Emri i lagjes', render: (p) => p.neighbourhood_name },
    { header: 'Krijuar me', render: (p) => formatDate(p.created_at) },
    { header: 'Ndryshuar me', render: (p) => formatDate(p.updated_at) },
    {
      header: 'Ndrysho',
      render: (p) => (
        <Button variant="success" aria-label="Ndrysho" onClick={() => openEdit(p)}>
          <FontAwesomeIcon icon={faPenToSquare} />
        </Button>
      ),
    },
    {
      header: 'Fshi',
      render: (p) => (
        <Button variant="danger" aria-label="Fshi" onClick={() => setDeleting(p)}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      ),
    },
  ];

  const needle = search.trim().toLowerCase();
  const rows = (payments.data ?? []).filter((p) => !needle || p.family_name.toLowerCase().includes(needle));
  const err = (m?: string) => (m ? <div className="text-danger small">{m}</div> : null);
  const ce = createForm.formState.errors;
  const ee = editForm.formState.errors;

  return (
    <div>
      <div className="container">
        <br />
        <h1>Krijo Pagese</h1>
        <form
          onSubmit={createForm.handleSubmit((d) =>
            create.mutate({
              family_id: d.family_id,
              amount: d.amount,
              year: d.year,
              ...(multi && d.range_year ? { range_year: d.range_year } : {}),
            }),
          )}
          noValidate
        >
          <div className="row g-3">
            <div>
              <input
                type="checkbox"
                id="new-year"
                className="form-check-input"
                checked={multi}
                onChange={(e) => setMulti(e.target.checked)}
              />{' '}
              <label htmlFor="new-year" className="form-check-label">Krijo pagese per disa vite</label>
            </div>
            <div className="col-lg-3 col-md-6">
              <select
                aria-label="Familja"
                className="form-control"
                {...createForm.register('family_id', { onChange: (e) => onFamilyChange(e.target.value) })}
              >
                <option value="" disabled>Zgjidh familjen</option>
                {families.data?.map((f) => (
                  <option key={f.id} value={f.id}>{familyLabel(f)}</option>
                ))}
              </select>
              {err(ce.family_id?.message)}
            </div>
            <div className="col-lg-3 col-md-6">
              <input
                type="number"
                step=".01"
                placeholder="Shuma per pagese"
                className="form-control"
                {...createForm.register('amount')}
              />
              {err(ce.amount?.message)}
            </div>
            <div className="col-lg-3 col-md-6">
              <input type="number" placeholder="Viti" className="form-control" {...createForm.register('year')} />
              {err(ce.year?.message)}
            </div>
            <div className="col-lg-3 col-md-6">
              {multi && (
                <input
                  type="number"
                  placeholder="Deri ne vitin"
                  className="form-control"
                  {...createForm.register('range_year')}
                />
              )}
              {multi && err(ce.range_year?.message)}
            </div>
            <div className="col-lg-3 col-md-6">
              <button type="submit" className="btn btn-success" disabled={create.isPending}>
                <FontAwesomeIcon icon={faFloppyDisk} /> Ruaj
              </button>
            </div>
          </div>
        </form>
        <br />
      </div>

      <div className="container">
        <div className="row g-3">
          <div className="col-6"><h3>Kerko pagesat sipas vitit</h3></div>
          <div className="col-6"><h3>Kerko pagesat sipas familjes</h3></div>
        </div>
        <div className="row g-3">
          <form
            className="col-lg-6 row g-3 m-0 p-0"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(yearInput ? `/pagesat?s_year=${encodeURIComponent(yearInput)}` : '/pagesat');
            }}
          >
            <div className="col-lg-6 col-md-6">
              <input
                type="number"
                placeholder="Viti"
                className="form-control"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
              />
            </div>
            <div className="col-lg-6 col-md-6">
              <button type="submit" className="btn btn-success">
                <FontAwesomeIcon icon={faSearch} /> Kerko vitin
              </button>
            </div>
          </form>
          <form
            className="col-lg-6 row g-3 m-0 p-0"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
            }}
          >
            <div className="col-lg-6 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Kerko per familje"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <div className="col-lg-6 col-md-6">
              <button type="submit" className="btn btn-primary">
                <FontAwesomeIcon icon={faSearch} /> Kerko familje
              </button>
            </div>
          </form>
        </div>
        <br />
      </div>

      <div className="container">
        <h3>Lista e pagesave</h3>
        <DataTable columns={columns} rows={rows} rowKey={(p) => p.id} />
      </div>

      <FormModal
        show={!!editing}
        title="Ndrysho Pagesen"
        busy={update.isPending}
        onHide={() => setEditing(null)}
        onSubmit={editForm.handleSubmit((d) => editing && update.mutate({ id: editing.id, d }))}
      >
        <div className="mb-3">
          <label htmlFor="m_family_id" className="form-label">Familja</label>
          <select id="m_family_id" className="form-control" {...editForm.register('family_id')}>
            {families.data?.map((f) => (
              <option key={f.id} value={f.id}>{familyLabel(f)}</option>
            ))}
          </select>
          {err(ee.family_id?.message)}
        </div>
        <div className="mb-3">
          <label htmlFor="m_amount" className="form-label">Shuma</label>
          <input id="m_amount" type="number" step=".01" className="form-control" {...editForm.register('amount')} />
          {err(ee.amount?.message)}
        </div>
        <div className="mb-3">
          <label htmlFor="m_year" className="form-label">Viti</label>
          <input id="m_year" type="number" className="form-control" {...editForm.register('year')} />
          {err(ee.year?.message)}
        </div>
      </FormModal>

      <ConfirmDialog
        show={!!deleting}
        title="Konfirmo fshirjen"
        message="A jeni i sigurt qe deshironi te fshini kete pagese?"
        confirmLabel="Fshije"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Suspense>
        <PaymentsPage />
      </Suspense>
    </AuthGuard>
  );
}
