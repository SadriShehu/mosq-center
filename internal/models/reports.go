package models

// NeighbourhoodStats is the per-neighbourhood slice of Stats.
type NeighbourhoodStats struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Families     int     `json:"families"`
	PaidFamilies int     `json:"paid_families"`
	Expected     float64 `json:"expected"`
	Collected    float64 `json:"collected"`
}

// Stats are the yearly KPIs shown on the dashboard.
type Stats struct {
	Year           int                   `json:"year"`
	FeePerMember   float64               `json:"fee_per_member"`
	Families       int                   `json:"families"`
	Members        int                   `json:"members"`
	Expected       float64               `json:"expected"`
	Collected      float64               `json:"collected"`
	PaidFamilies   int                   `json:"paid_families"`
	UnpaidFamilies int                   `json:"unpaid_families"`
	Neighbourhoods []*NeighbourhoodStats `json:"neighbourhoods"`
}

// CollectionPayment is the payment of a family for the requested year.
type CollectionPayment struct {
	ID        string  `json:"id"`
	Amount    float64 `json:"amount"`
	CreatedAt string  `json:"created_at"`
}

// CollectionItem is one family on the Mbledhja screen.
type CollectionItem struct {
	FamiliesResponse
	NeighbourhoodName string             `json:"neighbourhood_name"`
	ExpectedAmount    float64            `json:"expected_amount"`
	Paid              bool               `json:"paid"`
	Payment           *CollectionPayment `json:"payment"`
}

// HistoryYear says whether a family paid in a given year.
type HistoryYear struct {
	Year      int     `json:"year"`
	Paid      bool    `json:"paid"`
	PaymentID *string `json:"payment_id"`
}

// FamilyHistory is the family sheet: details plus a year-by-year payment grid.
type FamilyHistory struct {
	Family   *FamiliesDetails    `json:"family"`
	Payments []*PaymentsResponse `json:"payments"`
	Years    []*HistoryYear      `json:"years"`
}

// BulkPaymentsRequest records payments for many families at once.
type BulkPaymentsRequest struct {
	FamilyIDs []string `json:"family_ids"`
	Year      int      `json:"year"`
	RangeYear int      `json:"range_year"`
}

// SkippedPayment is a family-year that already had a payment and was not duplicated.
type SkippedPayment struct {
	FamilyID string `json:"family_id"`
	Year     int    `json:"year"`
}

// BulkPaymentsResponse lists the payments that were created and the
// family-years that were skipped because they were already paid.
type BulkPaymentsResponse struct {
	IDs     []string          `json:"ids"`
	Skipped []*SkippedPayment `json:"skipped"`
}
