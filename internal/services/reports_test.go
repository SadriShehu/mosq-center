package services

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/sadrishehu/mosq-center/internal/models"
)

type fakePayments struct {
	all     []*models.Payments
	created []*models.Payments
	err     error
}

func (f *fakePayments) Create(_ context.Context, p *models.Payments) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	cp := *p
	f.created = append(f.created, &cp)
	f.all = append(f.all, &cp)
	return "oid", nil
}
func (f *fakePayments) FindAll(context.Context) ([]*models.Payments, error) { return f.all, f.err }
func (f *fakePayments) FindByYear(_ context.Context, y int) ([]*models.Payments, error) {
	var out []*models.Payments
	for _, p := range f.all {
		if p.Year == y {
			out = append(out, p)
		}
	}
	return out, f.err
}
func (f *fakePayments) FindByFamilyID(_ context.Context, id string) ([]*models.Payments, error) {
	var out []*models.Payments
	for _, p := range f.all {
		if p.FamilyID == id {
			out = append(out, p)
		}
	}
	return out, f.err
}

type fakeFamilies struct{ all []*models.Families }

func (f *fakeFamilies) FindAll(context.Context) ([]*models.Families, error) { return f.all, nil }

type fakeNeighs struct{ all []*models.Neighbourhood }

func (f *fakeNeighs) FindAll(context.Context) ([]*models.Neighbourhood, error) { return f.all, nil }

func fixture() (*fakePayments, *fakeFamilies, *fakeNeighs) {
	n := &fakeNeighs{all: []*models.Neighbourhood{
		{ID: "n1", Name: "Lagja 1"},
		{ID: "n2", Name: "Lagja Bosh"}, // no families
	}}
	f := &fakeFamilies{all: []*models.Families{
		{ID: "f1", Name: "Ali", Surname: "Zeka", Members: 4, NeighbourhoodID: "n1"},
		{ID: "f2", Name: "Besa", Surname: "Berisha", Members: 2, NeighbourhoodID: "n1"},
		{ID: "f3", Name: "Orphan", Surname: "Ci", Members: 1, NeighbourhoodID: "gone"},
	}}
	p := &fakePayments{all: []*models.Payments{
		{ID: "p1", FamilyID: "f1", Amount: 12, Year: 2025, CreatedAt: "2025-03-01T10:00:00Z"},
		{ID: "p2", FamilyID: "f1", Amount: 12, Year: 2026, CreatedAt: "2026-03-01T10:00:00Z"},
		{ID: "p3", FamilyID: "ghost", Amount: 99, Year: 2026, CreatedAt: "2026-04-01T10:00:00Z"},
	}}
	return p, f, n
}

func newTestService(p *fakePayments, f *fakeFamilies, n *fakeNeighs) *reportsService {
	s := NewReportsService(p, f, n, 3)
	s.now = func() time.Time { return time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC) }
	return s
}

func TestStats(t *testing.T) {
	ctx := context.Background()

	t.Run("populated", func(t *testing.T) {
		s := newTestService(fixture())
		got, err := s.Stats(ctx, 2026)
		if err != nil {
			t.Fatal(err)
		}
		if got.Families != 3 || got.Members != 7 || got.Expected != 21 || got.Collected != 12 ||
			got.PaidFamilies != 1 || got.UnpaidFamilies != 2 || got.FeePerMember != 3 || got.Year != 2026 {
			t.Errorf("totals: %+v", got)
		}
		if len(got.Neighbourhoods) != 2 {
			t.Fatalf("neighbourhoods: %+v", got.Neighbourhoods)
		}
		n1, empty := got.Neighbourhoods[0], got.Neighbourhoods[1]
		if n1.Families != 2 || n1.PaidFamilies != 1 || n1.Expected != 18 || n1.Collected != 12 {
			t.Errorf("n1: %+v", n1)
		}
		if empty.Families != 0 || empty.PaidFamilies != 0 || empty.Expected != 0 || empty.Collected != 0 {
			t.Errorf("neighbourhood without families should be zeros: %+v", empty)
		}
	})

	t.Run("year without payments", func(t *testing.T) {
		s := newTestService(fixture())
		got, _ := s.Stats(ctx, 2030)
		if got.Collected != 0 || got.PaidFamilies != 0 || got.UnpaidFamilies != 3 {
			t.Errorf("%+v", got)
		}
	})

	t.Run("empty db", func(t *testing.T) {
		s := newTestService(&fakePayments{}, &fakeFamilies{}, &fakeNeighs{})
		got, err := s.Stats(ctx, 2026)
		if err != nil {
			t.Fatal(err)
		}
		if got.Neighbourhoods == nil || len(got.Neighbourhoods) != 0 || got.Families != 0 || got.Expected != 0 || got.UnpaidFamilies != 0 {
			t.Errorf("%+v", got)
		}
	})

	t.Run("repo error", func(t *testing.T) {
		p, f, n := fixture()
		p.err = errors.New("db down")
		if _, err := newTestService(p, f, n).Stats(ctx, 2026); err == nil {
			t.Error("want error")
		}
	})
}

func TestCollection(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name, neigh string
		year        int
		wantIDs     []string
		wantPaid    map[string]bool
	}{
		{"all 2026, sorted by surname", "", 2026, []string{"f2", "f3", "f1"}, map[string]bool{"f1": true}},
		{"neighbourhood filter", "n1", 2026, []string{"f2", "f1"}, map[string]bool{"f1": true}},
		{"neighbourhood without families", "n2", 2026, []string{}, nil},
		{"unpaid year", "", 2030, []string{"f2", "f3", "f1"}, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := newTestService(fixture()).Collection(ctx, tt.year, tt.neigh)
			if err != nil {
				t.Fatal(err)
			}
			if got == nil {
				t.Fatal("nil result")
			}
			ids := []string{}
			for _, it := range got {
				ids = append(ids, it.ID)
				if it.Paid != tt.wantPaid[it.ID] || (it.Payment != nil) != it.Paid {
					t.Errorf("%s paid=%v payment=%v", it.ID, it.Paid, it.Payment)
				}
				if it.ExpectedAmount != float64(it.Members)*3 {
					t.Errorf("%s expected %v", it.ID, it.ExpectedAmount)
				}
			}
			if !reflect.DeepEqual(ids, tt.wantIDs) {
				t.Errorf("ids = %v, want %v", ids, tt.wantIDs)
			}
		})
	}

	t.Run("neighbourhood name and payment", func(t *testing.T) {
		got, _ := newTestService(fixture()).Collection(ctx, 2026, "n1")
		last := got[1]
		if last.NeighbourhoodName != "Lagja 1" || last.Payment == nil || last.Payment.ID != "p2" || last.Payment.Amount != 12 {
			t.Errorf("%+v", last)
		}
	})

	t.Run("empty db", func(t *testing.T) {
		got, err := newTestService(&fakePayments{}, &fakeFamilies{}, &fakeNeighs{}).Collection(ctx, 2026, "")
		if err != nil || got == nil || len(got) != 0 {
			t.Errorf("%v %v", got, err)
		}
	})
}

func TestFamilyHistory(t *testing.T) {
	ctx := context.Background()

	t.Run("years from earliest payment to current", func(t *testing.T) {
		got, err := newTestService(fixture()).FamilyHistory(ctx, "f1")
		if err != nil {
			t.Fatal(err)
		}
		if got.Family.NeighbourhoodName != "Lagja 1" || len(got.Payments) != 2 || len(got.Years) != 2 {
			t.Fatalf("%+v", got)
		}
		if got.Years[0].Year != 2025 || !got.Years[0].Paid || *got.Years[0].PaymentID != "p1" {
			t.Errorf("%+v", got.Years[0])
		}
	})

	t.Run("gap years are unpaid", func(t *testing.T) {
		p, f, n := fixture()
		p.all = append(p.all, &models.Payments{ID: "p0", FamilyID: "f1", Year: 2023, Amount: 12})
		got, _ := newTestService(p, f, n).FamilyHistory(ctx, "f1")
		if len(got.Years) != 4 || got.Years[1].Year != 2024 || got.Years[1].Paid || got.Years[1].PaymentID != nil {
			t.Errorf("%+v", got.Years)
		}
	})

	t.Run("family without payments", func(t *testing.T) {
		got, err := newTestService(fixture()).FamilyHistory(ctx, "f2")
		if err != nil {
			t.Fatal(err)
		}
		if got.Payments == nil || len(got.Payments) != 0 {
			t.Errorf("payments must be [] not nil: %v", got.Payments)
		}
		if len(got.Years) != 1 || got.Years[0].Year != 2026 || got.Years[0].Paid {
			t.Errorf("%+v", got.Years)
		}
	})

	t.Run("unknown family", func(t *testing.T) {
		if _, err := newTestService(fixture()).FamilyHistory(ctx, "nope"); !errors.Is(err, ErrNotFound) {
			t.Errorf("err = %v", err)
		}
	})
}

func TestBulkPay(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name        string
		req         models.BulkPaymentsRequest
		wantErr     error
		wantCreated int
		wantSkipped []models.SkippedPayment
	}{
		{"single year", models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}, Year: 2026}, nil, 1, nil},
		{"two families", models.BulkPaymentsRequest{FamilyIDs: []string{"f2", "f3"}, Year: 2026}, nil, 2, nil},
		{"range", models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}, Year: 2024, RangeYear: 2026}, nil, 3, nil},
		{"already paid is skipped", models.BulkPaymentsRequest{FamilyIDs: []string{"f1", "f2"}, Year: 2026}, nil, 1, []models.SkippedPayment{{FamilyID: "f1", Year: 2026}}},
		{"everything skipped", models.BulkPaymentsRequest{FamilyIDs: []string{"f1"}, Year: 2025, RangeYear: 2026}, nil, 0, []models.SkippedPayment{{FamilyID: "f1", Year: 2025}, {FamilyID: "f1", Year: 2026}}},
		{"range partly skipped", models.BulkPaymentsRequest{FamilyIDs: []string{"f1"}, Year: 2026, RangeYear: 2027}, nil, 1, []models.SkippedPayment{{FamilyID: "f1", Year: 2026}}},
		{"duplicate ids once", models.BulkPaymentsRequest{FamilyIDs: []string{"f2", "f2"}, Year: 2026}, nil, 1, nil},
		{"no families", models.BulkPaymentsRequest{Year: 2026}, ErrInvalid, 0, nil},
		{"no year", models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}}, ErrInvalid, 0, nil},
		{"bad range", models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}, Year: 2026, RangeYear: 2025}, ErrInvalid, 0, nil},
		{"huge range", models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}, Year: 2000, RangeYear: 2999}, ErrInvalid, 0, nil},
		{"unknown family writes nothing", models.BulkPaymentsRequest{FamilyIDs: []string{"f2", "nope"}, Year: 2026}, ErrNotFound, 0, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p, f, n := fixture()
			req := tt.req
			got, err := newTestService(p, f, n).BulkPay(ctx, &req)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
			if len(p.created) != tt.wantCreated {
				t.Fatalf("created %d, want %d", len(p.created), tt.wantCreated)
			}
			if err == nil {
				if got.Skipped == nil || len(got.Skipped) != len(tt.wantSkipped) {
					t.Fatalf("skipped = %v, want %v", got.Skipped, tt.wantSkipped)
				}
				for i, sk := range got.Skipped {
					if *sk != tt.wantSkipped[i] {
						t.Errorf("skipped[%d] = %+v", i, sk)
					}
				}
				if got.IDs == nil || len(got.IDs) != tt.wantCreated {
					t.Errorf("ids = %v", got.IDs)
				}
				for i, c := range p.created {
					if c.Amount != float64(map[string]int{"f1": 4, "f2": 2, "f3": 1}[c.FamilyID])*3 || c.ID != got.IDs[i] {
						t.Errorf("created %+v", c)
					}
				}
			}
		})
	}

	t.Run("idempotent", func(t *testing.T) {
		p, f, n := fixture()
		s := newTestService(p, f, n)
		req := &models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}, Year: 2026}
		s.BulkPay(ctx, req)
		got, _ := s.BulkPay(ctx, req)
		if len(got.IDs) != 0 || len(got.Skipped) != 1 || len(p.created) != 1 {
			t.Errorf("second call created more: %v", got.IDs)
		}
	})

	t.Run("create error", func(t *testing.T) {
		p, f, n := fixture()
		p.err = errors.New("boom")
		if _, err := newTestService(p, f, n).BulkPay(ctx, &models.BulkPaymentsRequest{FamilyIDs: []string{"f2"}, Year: 2026}); err == nil {
			t.Error("want error")
		}
	})
}

func TestRecent(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name  string
		limit int
		want  []string
	}{
		{"newest first", 10, []string{"p3", "p2", "p1"}},
		{"limit", 2, []string{"p3", "p2"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := newTestService(fixture()).Recent(ctx, tt.limit)
			if err != nil {
				t.Fatal(err)
			}
			ids := []string{}
			for _, p := range got {
				ids = append(ids, p.ID)
			}
			if !reflect.DeepEqual(ids, tt.want) {
				t.Errorf("ids = %v", ids)
			}
		})
	}

	t.Run("missing family gives empty names", func(t *testing.T) {
		got, _ := newTestService(fixture()).Recent(ctx, 1)
		if got[0].ID != "p3" || got[0].FamilyName != "" || got[0].NeighbourhoodName != "" {
			t.Errorf("%+v", got[0])
		}
	})

	t.Run("empty db", func(t *testing.T) {
		got, err := newTestService(&fakePayments{}, &fakeFamilies{}, &fakeNeighs{}).Recent(ctx, 10)
		if err != nil || got == nil || len(got) != 0 {
			t.Errorf("%v %v", got, err)
		}
	})
}
