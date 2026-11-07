import { APIRequestContext, expect } from '@playwright/test';

export function uniqueToken(prefix = 'QA'): string {
  const random = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-5);
  return `${prefix}${random}${time}`;
}

function hash(value: string): number {
  let result = 0;
  for (const char of value) {
    result = (result * 31 + char.charCodeAt(0)) >>> 0;
  }
  return result;
}

/** A 4-digit year that is unlikely to collide with real or other test data. */
export function uniqueYear(token: string): number {
  return 2100 + (hash(token) % 800);
}

export const DEFAULT_FEE_PER_MEMBER = 3;

export interface FamilySpec {
  name?: string;
  middleName?: string;
  surname?: string;
  members?: number;
  neighbourhoodId?: string;
}

/** GET /api/v1/stats — shape from docs/redesign/UX.md. */
export interface StatsNeighbourhood {
  id: string;
  name: string;
  families: number;
  paid_families: number;
  expected: number;
  collected: number;
}

export interface Stats {
  year: number;
  fee_per_member: number;
  families: number;
  members: number;
  expected: number;
  collected: number;
  paid_families: number;
  unpaid_families: number;
  neighbourhoods: StatsNeighbourhood[];
}

export interface SeededFamily {
  id: string;
  name: string;
  middleName: string;
  surname: string;
  members: number;
}

export interface ScenarioOptions {
  families?: number;
  members?: number;
  paid?: number;
  year?: number;
  feePerMember?: number;
}

export interface Scenario {
  neighbourhoodId: string;
  families: SeededFamily[];
  paidFamilies: SeededFamily[];
  year: number;
  feePerMember: number;
}

/**
 * Seeds and cleans up data through /api/v1. Every entity name carries the
 * token so cleanup can find entities created through the UI as well.
 */
export class Seed {
  readonly token: string;
  readonly neighbourhoodName: string;
  readonly year: number;
  neighbourhoodId = '';
  familyIds: string[] = [];

  constructor(
    private readonly request: APIRequestContext,
    token = uniqueToken(),
  ) {
    this.token = token;
    this.neighbourhoodName = `QA Lagje ${token}`;
    this.year = uniqueYear(token);
  }

  name(prefix = 'QA'): string {
    return `${prefix} ${this.token}`;
  }

  async createNeighbourhood(overrides: Record<string, string> = {}): Promise<string> {
    const response = await this.request.post('/api/v1/neighbourhoods', {
      data: {
        name: this.neighbourhoodName,
        region: 'Gjakove',
        city: 'Gjakove',
        country: 'Kosove',
        postal_code: '50000',
        ...overrides,
      },
    });
    expect(response.status(), 'create neighbourhood').toBe(201);
    this.neighbourhoodId = (await response.text()).trim();
    return this.neighbourhoodId;
  }

  async createFamily(spec: FamilySpec = {}): Promise<string> {
    const neighbourhoodId = spec.neighbourhoodId ?? this.neighbourhoodId;
    if (!neighbourhoodId) {
      throw new Error('create a neighbourhood before creating a family');
    }

    const response = await this.request.post('/api/v1/families', {
      data: {
        name: spec.name ?? this.name('Familja'),
        middle_name: spec.middleName ?? 'Prindi',
        surname: spec.surname ?? this.token,
        members: spec.members ?? 4,
        neighbourhood_id: neighbourhoodId,
      },
    });
    expect(response.status(), 'create family').toBe(201);
    const id = (await response.text()).trim();
    this.familyIds.push(id);
    return id;
  }

  async createFamilies(count: number, members = 4): Promise<SeededFamily[]> {
    const families: SeededFamily[] = [];
    for (let index = 0; index < count; index += 1) {
      const family: SeededFamily = {
        id: '',
        name: `${this.name('Familja')} ${index + 1}`,
        middleName: 'Prindi',
        surname: `Mbiemri ${this.token}`,
        members,
      };
      family.id = await this.createFamily(family);
      families.push(family);
    }
    return families;
  }

  async createPayment(familyId: string, year: number, amount = 12): Promise<void> {
    const response = await this.request.post('/api/v1/payments', {
      data: { family_id: familyId, amount, year, range_year: 0 },
    });
    expect(response.status(), 'create payment').toBe(201);
  }

  /** One neighbourhood, N families and optionally a few paid families. */
  async scenario(options: ScenarioOptions = {}): Promise<Scenario> {
    const count = options.families ?? 3;
    const members = options.members ?? 4;
    const paid = options.paid ?? 1;
    const year = options.year ?? this.year;
    const feePerMember = options.feePerMember ?? DEFAULT_FEE_PER_MEMBER;

    const neighbourhoodId = await this.createNeighbourhood();
    const families = await this.createFamilies(count, members);
    const paidFamilies = families.slice(0, paid);

    for (const family of paidFamilies) {
      await this.createPayment(family.id, year, family.members * feePerMember);
    }

    return { neighbourhoodId, families, paidFamilies, year, feePerMember };
  }

  /** Expected figures straight from the new stats endpoint (UX.md API table). */
  async stats(year: number): Promise<Stats> {
    const response = await this.request.get(`/api/v1/stats?year=${year}`);
    expect(response.status(), 'get stats').toBe(200);
    return (await response.json()) as Stats;
  }

  familyDisplayName(spec: Required<Pick<FamilySpec, 'name' | 'middleName' | 'surname'>>): string {
    return `${spec.name} ${spec.middleName} ${spec.surname}`;
  }

  private async list<T>(path: string): Promise<T[]> {
    const response = await this.request.get(path);
    if (!response.ok()) {
      return [];
    }
    try {
      const body = await response.json();
      return Array.isArray(body) ? (body as T[]) : [];
    } catch {
      return [];
    }
  }

  /** Removes everything whose name carries this token, plus its payments. */
  async cleanup(): Promise<void> {
    const families = await this.list<{ id: string; name: string }>('/api/v1/families');
    const familyIds = new Set(
      families.filter((family) => family.name?.includes(this.token)).map((family) => family.id),
    );

    const payments = await this.list<{ id: string; family_id: string }>('/api/v1/payments');
    for (const payment of payments) {
      if (familyIds.has(payment.family_id)) {
        await this.request.delete(`/api/v1/payments/${payment.id}`);
      }
    }

    for (const id of familyIds) {
      await this.request.delete(`/api/v1/families/${id}`);
    }

    const neighbourhoods = await this.list<{ id: string; name: string }>('/api/v1/neighbourhoods');
    for (const neighbourhood of neighbourhoods) {
      if (neighbourhood.name?.includes(this.token)) {
        await this.request.delete(`/api/v1/neighbourhoods/${neighbourhood.id}`);
      }
    }
  }
}
