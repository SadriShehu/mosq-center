import { sq } from './sq.ts';
import type {
  BulkPaymentInput, BulkPaymentResult, CollectionRow, FamilyHistory, Stats,
  Family, FamilyDetails, FamilyInput, Me, Neighbourhood, NeighbourhoodInput, Payment,
  PaymentDetails, PaymentInput, Prayers, PublicConfig, Region,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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

/** User-facing Albanian message by HTTP status. Server text only goes to the console. */
export function messageForStatus(status: number): string {
  if (status === 0) return sq.errors.network;
  if (status === 400 || status === 422) return sq.errors.badRequest;
  if (status === 404) return sq.errors.notFound;
  if (status >= 500) return sq.errors.server;
  return sq.errors.unknown;
}

async function serverText(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const j = JSON.parse(text);
    if (j && typeof j.error === 'string') return j.error;
  } catch {
    /* plain text body */
  }
  return text.trim();
}

/** 401 on a protected call sends the browser to /login (Go owns auth). */
async function request(path: string, init?: RequestInit, opts: { public?: boolean } = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    });
  } catch (e) {
    console.error('network error', path, e);
    throw new ApiError(0, messageForStatus(0));
  }
  if (res.status === 401 && !opts.public && typeof window !== 'undefined') {
    window.location.assign('/login');
    return new Promise<Response>(() => {}); // never resolves; page is navigating away
  }
  if (!res.ok) {
    console.error(`API ${res.status} ${path}:`, await serverText(res));
    throw new ApiError(res.status, messageForStatus(res.status));
  }
  return res;
}

async function json<T>(path: string, init?: RequestInit, opts?: { public?: boolean }): Promise<T> {
  const res = await request(path, init, opts);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Mutations: Go replies with plain text (e.g. a bare uuid, or '[id id]' for payments), not JSON. */
async function mutate(path: string, init: RequestInit): Promise<string> {
  const res = await request(path, init);
  return (await res.text()).trim();
}

/** Go encodes an empty slice as JSON null; lists are always arrays. */
async function list<T>(path: string): Promise<T[]> {
  return (await json<T[] | null>(path)) ?? [];
}

const body = (data: unknown): RequestInit => ({ body: JSON.stringify(data) });

export const api = {
  stats: (year?: number | string) => json<Stats>(`/stats${qs({ year })}`),
  /** neighbourhoodId optional (all neighbourhoods when omitted). */
  collection: (year: number | string, neighbourhoodId?: string) =>
    list<CollectionRow>(`/collection${qs({ year, neighbourhood_id: neighbourhoodId })}`),
  familyHistory: (id: string) => json<FamilyHistory>(`/families/${id}/history`),
  recentPayments: (limit = 10) => list<PaymentDetails>(`/payments/recent${qs({ limit })}`),
  /** Amount is computed server-side (members x fee). Returns created ids + skipped (already paid) pairs. */
  payBulk: async (d: BulkPaymentInput): Promise<BulkPaymentResult> => {
    const res = await json<Partial<BulkPaymentResult> | null>('/payments/bulk', { method: 'POST', ...body(d) });
    return { ids: res?.ids ?? [], skipped: res?.skipped ?? [] };
  },
  me: () => json<Me>('/me'),
  regions: () => list<Region>('/regions'),
  publicPrayers: () => json<Prayers>('/public/prayers', undefined, { public: true }),
  publicConfig: () => json<PublicConfig>('/public/config', undefined, { public: true }),
  prayers: () => json<Prayers>('/prayers'),

  neighbourhoods: {
    list: () => list<Neighbourhood>('/neighbourhoods'),
    get: (id: string) => json<Neighbourhood>(`/neighbourhoods/${id}`),
    create: (d: NeighbourhoodInput) => mutate('/neighbourhoods', { method: 'POST', ...body(d) }),
    update: (id: string, d: NeighbourhoodInput) =>
      mutate(`/neighbourhoods/${id}`, { method: 'PUT', ...body(d) }),
    remove: (id: string) => mutate(`/neighbourhoods/${id}`, { method: 'DELETE' }),
  },

  families: {
    list: () => list<Family>('/families'),
    details: () => list<FamilyDetails>('/families/details'),
    get: (id: string) => json<Family>(`/families/${id}`),
    create: (d: FamilyInput) => mutate('/families', { method: 'POST', ...body(d) }),
    update: (id: string, d: FamilyInput) => mutate(`/families/${id}`, { method: 'PUT', ...body(d) }),
    remove: (id: string) => mutate(`/families/${id}`, { method: 'DELETE' }),
  },

  payments: {
    list: () => list<Payment>('/payments'),
    /** familyId overrides year (same as the old /pagesat handler). */
    details: (p: { year?: number | string; family_id?: string } = {}) =>
      list<PaymentDetails>(`/payments/details${qs(p)}`),
    noPaymentDetails: (p: { year: number | string; s_neighbourhood_id?: string }) =>
      list<FamilyDetails>(`/payments/no-payment/details${qs(p)}`),
    create: (d: PaymentInput) => mutate('/payments', { method: 'POST', ...body(d) }),
    update: (id: string, d: PaymentInput) => mutate(`/payments/${id}`, { method: 'PUT', ...body(d) }),
    remove: (id: string) => mutate(`/payments/${id}`, { method: 'DELETE' }),
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
