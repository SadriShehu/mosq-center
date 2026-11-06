export interface Me { name: string; email: string; picture: string }
export interface Region { name: string; zip: string }

export interface Neighbourhood {
  id: string; name: string; region: string; city: string; country: string;
  postal_code: string; created_at: string; updated_at: string;
}
export interface NeighbourhoodInput {
  name: string; region: string; city?: string; country?: string; postal_code?: string;
}

export interface Family {
  id: string; name: string; middle_name: string; surname: string; members: number;
  neighbourhood_id: string; created_at: string; updated_at: string;
}
export interface FamilyDetails extends Family { neighbourhood_name: string }
export interface FamilyInput {
  name: string; middle_name?: string; surname: string; members: number; neighbourhood_id: string;
}

export interface Payment {
  id: string; family_id: string; amount: number; year: number; created_at: string; updated_at: string;
}
export interface PaymentDetails {
  id: string; family_id: string; family_name: string; members: number; amount: number;
  year: number; neighbourhood_name: string; created_at: string; updated_at: string;
}
export interface PaymentInput {
  family_id: string; amount: number; year: number; range_year?: number;
}

export interface Prayers {
  Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Sunset: string;
  Maghrib: string; Isha: string; Imsak: string; Midnight: string;
  Firstthird: string; Lastthird: string;
}

/* ---- redesign endpoints (docs/redesign/UX.md "API additions") ---- */
export interface NeighbourhoodStats {
  id: string; name: string; families: number; paid_families: number; expected: number; collected: number;
}
export interface Stats {
  year: number; fee_per_member: number; families: number; members: number; expected: number;
  collected: number; paid_families: number; unpaid_families: number; neighbourhoods: NeighbourhoodStats[];
}

export interface CollectionPayment { id: string; amount: number; created_at: string }
export interface CollectionRow extends FamilyDetails {
  expected_amount: number; paid: boolean; payment: CollectionPayment | null;
}

export interface HistoryYear { year: number; paid: boolean; payment_id: string }
export interface FamilyHistory {
  family: FamilyDetails; payments: Payment[]; years: HistoryYear[];
}

export interface BulkPaymentInput { family_ids: string[]; year: number; range_year?: number }
export interface BulkSkipped { family_id: string; year: number }
/** `ids` = payments created (undo deletes these); `skipped` = already paid, left untouched (idempotent). */
export interface BulkPaymentResult { ids: string[]; skipped: BulkSkipped[] }
