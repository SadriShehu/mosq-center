package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi"
	"github.com/sadrishehu/mosq-center/config"
	"github.com/sadrishehu/mosq-center/internal/models"
	"github.com/sadrishehu/mosq-center/internal/services"
)

type fakeReports struct {
	err       error
	gotYear   int
	gotNeigh  string
	gotLimit  int
	gotBulk   *models.BulkPaymentsRequest
	gotFamily string
}

func (f *fakeReports) Stats(_ context.Context, y int) (*models.Stats, error) {
	f.gotYear = y
	return &models.Stats{Year: y, FeePerMember: 3, Neighbourhoods: []*models.NeighbourhoodStats{}}, f.err
}
func (f *fakeReports) Collection(_ context.Context, y int, n string) ([]*models.CollectionItem, error) {
	f.gotYear, f.gotNeigh = y, n
	return []*models.CollectionItem{}, f.err
}
func (f *fakeReports) FamilyHistory(_ context.Context, id string) (*models.FamilyHistory, error) {
	f.gotFamily = id
	return &models.FamilyHistory{Family: &models.FamiliesDetails{}, Payments: []*models.PaymentsResponse{}, Years: []*models.HistoryYear{}}, f.err
}
func (f *fakeReports) BulkPay(_ context.Context, r *models.BulkPaymentsRequest) (*models.BulkPaymentsResponse, error) {
	f.gotBulk = r
	return &models.BulkPaymentsResponse{IDs: []string{"a", "b"}}, f.err
}
func (f *fakeReports) Recent(_ context.Context, l int) ([]*models.PaymentsTemplate, error) {
	f.gotLimit = l
	return []*models.PaymentsTemplate{}, f.err
}

func reportsRouter(f *fakeReports) http.Handler {
	r := chi.NewRouter()
	h := &handler{RouterService: r, ReportsService: f, AuthConfig: &config.Auth0Config{}}
	h.RegisterRoutesV1()
	return r
}

func TestReportsHandlers(t *testing.T) {
	const uid = "0f39bc52-aef2-4739-8c02-97348739f88e"
	tests := []struct {
		name, method, path, body string
		svcErr                   error
		status                   int
		check                    func(t *testing.T, f *fakeReports, body string)
	}{
		{"stats", "GET", "/api/v1/stats?year=2025", "", nil, 200, func(t *testing.T, f *fakeReports, b string) {
			if f.gotYear != 2025 || !strings.Contains(b, `"fee_per_member":3`) || !strings.Contains(b, `"neighbourhoods":[]`) {
				t.Errorf("%d %s", f.gotYear, b)
			}
		}},
		{"stats bad year", "GET", "/api/v1/stats?year=abc", "", nil, 400, nil},
		{"stats db error", "GET", "/api/v1/stats", "", fmt.Errorf("mongo secret"), 500, func(t *testing.T, _ *fakeReports, b string) {
			if strings.Contains(b, "mongo") {
				t.Errorf("leaked: %s", b)
			}
		}},
		{"collection", "GET", "/api/v1/collection?year=2026&neighbourhood_id=" + uid, "", nil, 200, func(t *testing.T, f *fakeReports, b string) {
			if f.gotYear != 2026 || f.gotNeigh != uid || strings.TrimSpace(b) != "[]" {
				t.Errorf("%d %q %s", f.gotYear, f.gotNeigh, b)
			}
		}},
		{"collection bad neighbourhood", "GET", "/api/v1/collection?neighbourhood_id=x", "", nil, 400, nil},
		{"history", "GET", "/api/v1/families/abc/history", "", nil, 200, func(t *testing.T, f *fakeReports, _ string) {
			if f.gotFamily != "abc" {
				t.Errorf("family %q", f.gotFamily)
			}
		}},
		{"history not found", "GET", "/api/v1/families/abc/history", "", services.ErrNotFound, 404, nil},
		{"bulk", "POST", "/api/v1/payments/bulk", `{"family_ids":["a","b"],"year":2026,"range_year":2027}`, nil, 201, func(t *testing.T, f *fakeReports, b string) {
			if f.gotBulk == nil || len(f.gotBulk.FamilyIDs) != 2 || f.gotBulk.RangeYear != 2027 || !strings.Contains(b, `"ids":["a","b"]`) {
				t.Errorf("%+v %s", f.gotBulk, b)
			}
		}},
		{"bulk bad json", "POST", "/api/v1/payments/bulk", `{`, nil, 400, nil},
		{"bulk invalid", "POST", "/api/v1/payments/bulk", `{}`, fmt.Errorf("%w: family_ids is required", services.ErrInvalid), 400, nil},
		{"bulk unknown family", "POST", "/api/v1/payments/bulk", `{"family_ids":["x"],"year":2026}`, services.ErrNotFound, 404, nil},
		{"recent default", "GET", "/api/v1/payments/recent", "", nil, 200, func(t *testing.T, f *fakeReports, _ string) {
			if f.gotLimit != 10 {
				t.Errorf("limit %d", f.gotLimit)
			}
		}},
		{"recent limit", "GET", "/api/v1/payments/recent?limit=5", "", nil, 200, func(t *testing.T, f *fakeReports, _ string) {
			if f.gotLimit != 5 {
				t.Errorf("limit %d", f.gotLimit)
			}
		}},
		{"recent bad limit", "GET", "/api/v1/payments/recent?limit=0", "", nil, 400, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := &fakeReports{err: tt.svcErr}
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			reportsRouter(f).ServeHTTP(rec, req)
			if rec.Code != tt.status {
				t.Fatalf("status = %d, body %s", rec.Code, rec.Body.String())
			}
			if !json.Valid(rec.Body.Bytes()) {
				t.Errorf("not JSON: %q", rec.Body.String())
			}
			if tt.check != nil {
				tt.check(t, f, rec.Body.String())
			}
		})
	}
}
