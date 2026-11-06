import type {
  Family, FamilyDetails, FamilyInput, Me, Neighbourhood, NeighbourhoodInput, Payment,
  PaymentDetails, PaymentInput, Prayers, Region,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE = '/api/v1';

function qs(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const j = JSON.parse(text);
    if (j && typeof j.error === 'string') return j.error;
  } catch {
    /* plain text body */
  }
  return text.trim() || `Request failed (${res.status})`;
}

/** 401 on a protected call sends the browser to /login (Go owns auth). */
async function request(path: string, init?: RequestInit, opts: { public?: boolean } = {}): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  if (res.status === 401 && !opts.public && typeof window !== 'undefined') {
    window.location.assign('/login');
    return new Promise<Response>(() => {}); // never resolves; page is navigating away
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res;
}

async function json<T>(path: string, init?: RequestInit, opts?: { public?: boolean }): Promise<T> {
  const res = await request(path, init, opts);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const body = (data: unknown): RequestInit => ({ body: JSON.stringify(data) });

export const api = {
  me: () => json<Me>('/me'),
  regions: () => json<Region[]>('/regions'),
  publicPrayers: () => json<Prayers>('/public/prayers', undefined, { public: true }),
  prayers: () => json<Prayers>('/prayers'),

  neighbourhoods: {
    list: () => json<Neighbourhood[]>('/neighbourhoods'),
    get: (id: string) => json<Neighbourhood>(`/neighbourhoods/${id}`),
    create: (d: NeighbourhoodInput) => json<unknown>('/neighbourhoods', { method: 'POST', ...body(d) }),
    update: (id: string, d: NeighbourhoodInput) =>
      json<unknown>(`/neighbourhoods/${id}`, { method: 'PUT', ...body(d) }),
    remove: (id: string) => json<unknown>(`/neighbourhoods/${id}`, { method: 'DELETE' }),
  },

  families: {
    list: () => json<Family[]>('/families'),
    details: () => json<FamilyDetails[]>('/families/details'),
    get: (id: string) => json<Family>(`/families/${id}`),
    create: (d: FamilyInput) => json<unknown>('/families', { method: 'POST', ...body(d) }),
    update: (id: string, d: FamilyInput) => json<unknown>(`/families/${id}`, { method: 'PUT', ...body(d) }),
    remove: (id: string) => json<unknown>(`/families/${id}`, { method: 'DELETE' }),
  },

  payments: {
    list: () => json<Payment[]>('/payments'),
    /** familyId overrides year (same as the old /pagesat handler). */
    details: (p: { year?: number | string; family_id?: string } = {}) =>
      json<PaymentDetails[]>(`/payments/details${qs(p)}`),
    noPaymentDetails: (p: { year: number | string; s_neighbourhood_id?: string }) =>
      json<FamilyDetails[]>(`/payments/no-payment/details${qs(p)}`),
    create: (d: PaymentInput) => json<unknown>('/payments', { method: 'POST', ...body(d) }),
    update: (id: string, d: PaymentInput) => json<unknown>(`/payments/${id}`, { method: 'PUT', ...body(d) }),
    remove: (id: string) => json<unknown>(`/payments/${id}`, { method: 'DELETE' }),
  },

  /** Returns the PDF blob, or null when there is nothing to invoice (404). */
  invoices: async (year: number | string, neighbourhoodId?: string): Promise<Blob | null> => {
    try {
      const res = await request(`/invoices${qs({ year, s_neighbourhood_id: neighbourhoodId })}`);
      return await res.blob();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
};
