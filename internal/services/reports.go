package services

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/sadrishehu/mosq-center/internal/models"
)

var (
	// ErrNotFound is returned when a referenced family does not exist.
	ErrNotFound = errors.New("not found")
	// ErrInvalid is returned for requests that fail validation.
	ErrInvalid = errors.New("invalid request")
)

const (
	maxBulkFamilies = 1000
	maxBulkYears    = 50
)

type reportsPayments interface {
	Create(context.Context, *models.Payments) (string, error)
	FindAll(context.Context) ([]*models.Payments, error)
	FindByYear(context.Context, int) ([]*models.Payments, error)
	FindByFamilyID(context.Context, string) ([]*models.Payments, error)
}

type reportsFamilies interface {
	FindAll(context.Context) ([]*models.Families, error)
}

type reportsNeighbourhoods interface {
	FindAll(context.Context) ([]*models.Neighbourhood, error)
}

type reportsService struct {
	payments       reportsPayments
	families       reportsFamilies
	neighbourhoods reportsNeighbourhoods
	fee            float64
	now            func() time.Time
}

// NewReportsService builds the service behind stats, collection, family
// history, bulk payments and recent payments. fee is the amount per member.
func NewReportsService(p reportsPayments, f reportsFamilies, n reportsNeighbourhoods, fee float64) *reportsService {
	return &reportsService{payments: p, families: f, neighbourhoods: n, fee: fee, now: time.Now}
}

// ---- pure builders (unit-tested directly) ----

func responseFamilies(in []*models.Families) []*models.FamiliesResponse {
	out := make([]*models.FamiliesResponse, 0, len(in))
	for _, f := range in {
		r := &models.FamiliesResponse{}
		r.MapResponse(f)
		out = append(out, r)
	}
	return out
}

func responseNeighbourhoods(in []*models.Neighbourhood) []*models.NeighbourhoodResponse {
	out := make([]*models.NeighbourhoodResponse, 0, len(in))
	for _, n := range in {
		r := &models.NeighbourhoodResponse{}
		r.MapResponse(n)
		out = append(out, r)
	}
	return out
}

func responsePayments(in []*models.Payments) []*models.PaymentsResponse {
	out := make([]*models.PaymentsResponse, 0, len(in))
	for _, p := range in {
		r := &models.PaymentsResponse{}
		r.MapResponse(p)
		out = append(out, r)
	}
	return out
}

// BuildStats computes the yearly KPIs. Only payments of existing families
// count, so the totals always agree with the per-neighbourhood numbers.
func BuildStats(year int, fee float64, families []*models.FamiliesResponse, neighbourhoods []*models.NeighbourhoodResponse, yearPayments []*models.PaymentsResponse) *models.Stats {
	s := &models.Stats{Year: year, FeePerMember: fee, Neighbourhoods: []*models.NeighbourhoodStats{}}

	byNeigh := make(map[string]*models.NeighbourhoodStats, len(neighbourhoods))
	for _, n := range neighbourhoods {
		ns := &models.NeighbourhoodStats{ID: n.ID, Name: n.Name}
		byNeigh[n.ID] = ns
		s.Neighbourhoods = append(s.Neighbourhoods, ns)
	}

	familyByID := make(map[string]*models.FamiliesResponse, len(families))
	for _, f := range families {
		familyByID[f.ID] = f
		expected := float64(f.Members) * fee
		s.Families++
		s.Members += f.Members
		s.Expected += expected
		if ns, ok := byNeigh[f.NeighbourhoodID]; ok {
			ns.Families++
			ns.Expected += expected
		}
	}

	paid := map[string]bool{}
	for _, p := range yearPayments {
		f, ok := familyByID[p.FamilyID]
		if !ok || p.Year != year {
			continue
		}
		s.Collected += p.Amount
		ns := byNeigh[f.NeighbourhoodID]
		if ns != nil {
			ns.Collected += p.Amount
		}
		if !paid[f.ID] {
			paid[f.ID] = true
			s.PaidFamilies++
			if ns != nil {
				ns.PaidFamilies++
			}
		}
	}
	s.UnpaidFamilies = s.Families - s.PaidFamilies

	return s
}

// BuildCollection lists families (optionally of one neighbourhood) with their
// payment status for the year. It never returns nil.
func BuildCollection(fee float64, neighbourhoodID string, families []*models.FamiliesResponse, neighbourhoods []*models.NeighbourhoodResponse, yearPayments []*models.PaymentsResponse, year int) []*models.CollectionItem {
	neighByID := make(map[string]string, len(neighbourhoods))
	for _, n := range neighbourhoods {
		neighByID[n.ID] = n.Name
	}

	// Earliest payment per family wins if (wrongly) there are several.
	payByFamily := map[string]*models.PaymentsResponse{}
	for _, p := range yearPayments {
		if p.Year != year {
			continue
		}
		if cur, ok := payByFamily[p.FamilyID]; !ok || p.CreatedAt < cur.CreatedAt {
			payByFamily[p.FamilyID] = p
		}
	}

	out := make([]*models.CollectionItem, 0, len(families))
	for _, f := range families {
		if neighbourhoodID != "" && f.NeighbourhoodID != neighbourhoodID {
			continue
		}
		item := &models.CollectionItem{
			FamiliesResponse:  *f,
			NeighbourhoodName: neighByID[f.NeighbourhoodID],
			ExpectedAmount:    float64(f.Members) * fee,
		}
		if p, ok := payByFamily[f.ID]; ok {
			item.Paid = true
			item.Payment = &models.CollectionPayment{ID: p.ID, Amount: p.Amount, CreatedAt: p.CreatedAt}
		}
		out = append(out, item)
	}

	sort.SliceStable(out, func(i, j int) bool {
		a := strings.ToLower(out[i].Surname + " " + out[i].Name)
		b := strings.ToLower(out[j].Surname + " " + out[j].Name)
		return a < b
	})

	return out
}

// BuildHistory builds the family sheet. Years run from the earliest payment
// (or the current year) up to the current year (or the latest payment).
func BuildHistory(family *models.FamiliesResponse, neighbourhoods []*models.NeighbourhoodResponse, payments []*models.PaymentsResponse, currentYear int) *models.FamilyHistory {
	details := &models.FamiliesDetails{FamiliesResponse: *family}
	for _, n := range neighbourhoods {
		if n.ID == family.NeighbourhoodID {
			details.NeighbourhoodName = n.Name
		}
	}

	sorted := append([]*models.PaymentsResponse{}, payments...)
	sort.SliceStable(sorted, func(i, j int) bool { return sorted[i].Year < sorted[j].Year })

	first, last := currentYear, currentYear
	byYear := map[int]*models.PaymentsResponse{}
	for _, p := range sorted {
		if p.Year < first {
			first = p.Year
		}
		if p.Year > last {
			last = p.Year
		}
		if _, ok := byYear[p.Year]; !ok {
			byYear[p.Year] = p
		}
	}

	years := make([]*models.HistoryYear, 0, last-first+1)
	for y := first; y <= last; y++ {
		hy := &models.HistoryYear{Year: y}
		if p, ok := byYear[y]; ok {
			id := p.ID
			hy.Paid = true
			hy.PaymentID = &id
		}
		years = append(years, hy)
	}

	return &models.FamilyHistory{Family: details, Payments: sorted, Years: years}
}

// ---- service methods ----

func (s *reportsService) currentYear() int { return s.now().Year() }

func (s *reportsService) load(ctx context.Context) ([]*models.FamiliesResponse, []*models.NeighbourhoodResponse, error) {
	f, err := s.families.FindAll(ctx)
	if err != nil {
		return nil, nil, err
	}
	n, err := s.neighbourhoods.FindAll(ctx)
	if err != nil {
		return nil, nil, err
	}
	return responseFamilies(f), responseNeighbourhoods(n), nil
}

func (s *reportsService) Stats(ctx context.Context, year int) (*models.Stats, error) {
	f, n, err := s.load(ctx)
	if err != nil {
		return nil, err
	}
	p, err := s.payments.FindByYear(ctx, year)
	if err != nil {
		return nil, err
	}
	return BuildStats(year, s.fee, f, n, responsePayments(p)), nil
}

func (s *reportsService) Collection(ctx context.Context, year int, neighbourhoodID string) ([]*models.CollectionItem, error) {
	f, n, err := s.load(ctx)
	if err != nil {
		return nil, err
	}
	p, err := s.payments.FindByYear(ctx, year)
	if err != nil {
		return nil, err
	}
	return BuildCollection(s.fee, neighbourhoodID, f, n, responsePayments(p), year), nil
}

func (s *reportsService) FamilyHistory(ctx context.Context, familyID string) (*models.FamilyHistory, error) {
	f, n, err := s.load(ctx)
	if err != nil {
		return nil, err
	}
	var family *models.FamiliesResponse
	for _, c := range f {
		if c.ID == familyID {
			family = c
			break
		}
	}
	if family == nil {
		return nil, fmt.Errorf("family %s: %w", familyID, ErrNotFound)
	}
	p, err := s.payments.FindByFamilyID(ctx, familyID)
	if err != nil {
		return nil, err
	}
	return BuildHistory(family, n, responsePayments(p), s.currentYear()), nil
}

// BulkPay records a payment (members x fee) for every family and year in the
// range. Family-years that are already paid are skipped, so repeating a
// request is safe. Nothing is written if any family id is unknown. There is no
// transaction: a store error part-way leaves earlier rows in place and returns
// an error, and retrying completes the rest because paid family-years are skipped.
func (s *reportsService) BulkPay(ctx context.Context, req *models.BulkPaymentsRequest) (*models.BulkPaymentsResponse, error) {
	switch {
	case len(req.FamilyIDs) == 0:
		return nil, fmt.Errorf("%w: family_ids is required", ErrInvalid)
	case len(req.FamilyIDs) > maxBulkFamilies:
		return nil, fmt.Errorf("%w: too many families", ErrInvalid)
	case req.Year < 1900 || req.Year > 3000:
		return nil, fmt.Errorf("%w: invalid year", ErrInvalid)
	case req.RangeYear != 0 && req.RangeYear < req.Year:
		return nil, fmt.Errorf("%w: range_year must be >= year", ErrInvalid)
	case req.RangeYear-req.Year >= maxBulkYears:
		return nil, fmt.Errorf("%w: range too large", ErrInvalid)
	}
	last := req.Year
	if req.RangeYear != 0 {
		last = req.RangeYear
	}

	f, _, err := s.load(ctx)
	if err != nil {
		return nil, err
	}
	familyByID := make(map[string]*models.FamiliesResponse, len(f))
	for _, c := range f {
		familyByID[c.ID] = c
	}

	seen := map[string]bool{}
	var targets []*models.FamiliesResponse
	for _, id := range req.FamilyIDs {
		if seen[id] {
			continue
		}
		seen[id] = true
		fam, ok := familyByID[id]
		if !ok {
			return nil, fmt.Errorf("family %s: %w", id, ErrNotFound)
		}
		targets = append(targets, fam)
	}

	existing, err := s.payments.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	paid := map[string]bool{}
	for _, p := range existing {
		paid[fmt.Sprintf("%s/%d", p.FamilyID, p.Year)] = true
	}

	ids := []string{}
	for _, fam := range targets {
		for y := req.Year; y <= last; y++ {
			if paid[fmt.Sprintf("%s/%d", fam.ID, y)] {
				continue
			}
			p := &models.Payments{}
			p.Hydrate(&models.PaymentsRequest{FamilyID: fam.ID, Amount: float64(fam.Members) * s.fee, Year: y})
			if _, err := s.payments.Create(ctx, p); err != nil {
				return nil, err
			}
			ids = append(ids, p.ID)
		}
	}

	return &models.BulkPaymentsResponse{IDs: ids}, nil
}

// Recent returns the newest payments first, joined with family data.
func (s *reportsService) Recent(ctx context.Context, limit int) ([]*models.PaymentsTemplate, error) {
	all, err := s.payments.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	f, n, err := s.load(ctx)
	if err != nil {
		return nil, err
	}

	p := responsePayments(all)
	sort.SliceStable(p, func(i, j int) bool { return p[i].CreatedAt > p[j].CreatedAt })
	if limit > 0 && len(p) > limit {
		p = p[:limit]
	}

	return JoinPayments(p, f, n), nil
}
