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
