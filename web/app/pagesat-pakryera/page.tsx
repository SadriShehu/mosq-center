'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faPenToSquare, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AuthGuard } from '@/components/AuthGuard';
import { DataTable, type Column } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { errMsg, useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { AMOUNT_PER_MEMBER } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { FamilyDetails } from '@/lib/types';

const optNum = z.preprocess(
  (v) => (v === '' || v == null ? undefined : Number(v)),
  z.number().int().optional(),
);
const payNum = (msg: string) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ error: msg }));

const paySchema = z.object({
  amount: payNum('Shuma është e detyrueshme').pipe(z.number().positive('Shuma duhet të jetë pozitive')),
  year: payNum('Viti është i detyrueshëm').pipe(z.number().int().min(1900, 'Viti nuk është i vlefshëm')),
  range_year: optNum,
}).refine((d) => d.range_year == null || d.range_year >= d.year, {
  path: ['range_year'],
  message: 'Viti final duhet të jetë i barabartë ose më i madh se viti',
});
type PayIn = z.input<typeof paySchema>;
type PayOut = z.output<typeof paySchema>;

function UnpaidPage() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();

  const year = /^\d{4}$/.test(params.get('year') ?? '')
    ? (params.get('year') as string)
    : String(new Date().getFullYear());
  const nbhd = params.get('s_neighbourhood_id') ?? '';

  const [yearInput, setYearInput] = useState(params.get('year') ?? '');
  const [nbhdInput, setNbhdInput] = useState(nbhd);
  const [searchInput, setSearchInput] = useState('');
  const [paying, setPaying] = useState<FamilyDetails | null>(null);
  const [multi, setMulti] = useState(false);
  const [exporting, setExporting] = useState(false);

  const neighbourhoods = useQuery({ queryKey: ['neighbourhoods'], queryFn: api.neighbourhoods.list });
  const unpaid = useQuery({
    queryKey: ['payments', 'no-payment', year, nbhd],
    queryFn: () => api.payments.noPaymentDetails({ year, ...(nbhd ? { s_neighbourhood_id: nbhd } : {}) }),
  });

  const form = useForm<PayIn, unknown, PayOut>({ resolver: zodResolver(paySchema) });
  const errors = form.formState.errors;

  const pay = useMutation({
    mutationFn: api.payments.create,
    onSuccess: () => {
      toast.success('Pagesa u krijua');
      setPaying(null);
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const openPay = (f: FamilyDetails) => {
    form.reset({ amount: f.members * AMOUNT_PER_MEMBER, year: Number(year), range_year: '' });
    setMulti(false);
    setPaying(f);
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const blob = await api.invoices(year, nbhd || undefined);
      if (!blob) {
        toast.error(`No payments found for year ${year}`);
        return;
      }
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${year}-${nbhd}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<FamilyDetails>[] = [
    { header: 'Emri', render: (f) => f.name },
    { header: 'Prindi', render: (f) => f.middle_name },
    { header: 'Mbimeri', render: (f) => f.surname },
    { header: 'Numri i antareve', render: (f) => f.members },
    { header: 'Lagje', render: (f) => f.neighbourhood_name },
    { header: 'Krijuar me', render: (f) => formatDate(f.created_at) },
    { header: 'Ndryshuar me', render: (f) => formatDate(f.updated_at) },
    {
      header: 'Paguaj',
      render: (f) => (
        <Button variant="success" aria-label="Paguaj" onClick={() => openPay(f)}>
          <FontAwesomeIcon icon={faPenToSquare} />
        </Button>
      ),
    },
  ];

  const needle = searchInput.trim().toLowerCase();
  const rows = (unpaid.data ?? []).filter((f) => !needle || f.name.toLowerCase().includes(needle));
  const err = (m?: string) => (m ? <div className="text-danger small">{m}</div> : null);

  return (
    <div>
      <div className="container">
        <br />
        <h1>Kerko pagesat e pakryera</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = new URLSearchParams();
            if (yearInput) q.set('year', yearInput);
            if (nbhdInput) q.set('s_neighbourhood_id', nbhdInput);
            const s = q.toString();
            router.push(s ? `/pagesat-pakryera?${s}` : '/pagesat-pakryera');
          }}
        >
          <div className="row g-3">
            <div className="col-lg-3 col-md-6">
              <input
                type="number"
                placeholder="Viti"
                className="form-control"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <select
                aria-label="Lagjja"
                className="form-control"
                value={nbhdInput}
                onChange={(e) => setNbhdInput(e.target.value)}
              >
                <option value="" disabled>Zgjidh Lagjen</option>
                {neighbourhoods.data?.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-6">
              <button type="submit" className="btn btn-success">
                <FontAwesomeIcon icon={faSearch} /> Kerko
              </button>
            </div>
          </div>
        </form>
        <br />
      </div>

      <div className="container">
        <h3>Lista e familjeve papaguar per vitin {year}</h3>
        <div className="row g-3">
          <div className="col-lg-3 col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Kerko per familje"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="col-lg-3 col-md-3">
            <button type="button" className="btn btn-primary">
              <FontAwesomeIcon icon={faSearch} /> Kerko
            </button>
          </div>
          <div className="col-lg-6 col-md-6 text-end">
            <button type="button" className="btn btn-primary" onClick={exportPdf} disabled={exporting}>
              <FontAwesomeIcon icon={faFilePdf} /> Gjenero Faturat
            </button>
          </div>
        </div>
        <br />
        <DataTable columns={columns} rows={rows} rowKey={(f) => f.id} />
      </div>

      <FormModal
        show={!!paying}
        title="Krijo Pagese"
        busy={pay.isPending}
        onHide={() => setPaying(null)}
        onSubmit={form.handleSubmit((d) => {
          if (!paying) return;
          pay.mutate({
            family_id: paying.id,
            amount: d.amount,
            year: d.year,
            ...(multi && d.range_year ? { range_year: d.range_year } : {}),
          });
        })}
      >
        <div className="mb-3">
          <label htmlFor="m_amount" className="form-label">Shuma</label>
          <input id="m_amount" type="number" step=".01" className="form-control" {...form.register('amount')} />
          {err(errors.amount?.message)}
        </div>
        <div className="mb-3">
          <label htmlFor="m_year" className="form-label">Viti</label>
          <input id="m_year" type="number" className="form-control" {...form.register('year')} />
          {err(errors.year?.message)}
        </div>
        {multi && (
          <div className="mb-3">
            <label htmlFor="m_range_year" className="form-label">Deri në vitin</label>
            <input id="m_range_year" type="number" className="form-control" {...form.register('range_year')} />
            {err(errors.range_year?.message)}
          </div>
        )}
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="range_year_checkbox"
            checked={multi}
            onChange={(e) => setMulti(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="range_year_checkbox">Krijo pagesë për disa vite</label>
        </div>
      </FormModal>
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <Suspense>
        <UnpaidPage />
      </Suspense>
    </AuthGuard>
  );
}
