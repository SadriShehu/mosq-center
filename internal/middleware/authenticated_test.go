package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/sessions"
)

func TestAuthenticateUserUnauthenticated(t *testing.T) {
	store := sessions.NewCookieStore([]byte("secret"))
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) })
	h := AuthenticateUser(store)(next)

	tests := []struct {
		name, path string
		wantStatus int
		wantBody   string
		wantLoc    string
	}{
		{"api gets 401 json", "/api/v1/me", http.StatusUnauthorized, `{"error":"unauthorized"}`, ""},
		{"page redirects", "/lagjet", http.StatusSeeOther, "", "/logout"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tt.path, nil))
			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d", rec.Code)
			}
			if tt.wantBody != "" {
				if rec.Body.String() != tt.wantBody || rec.Header().Get("Content-Type") != "application/json" {
					t.Errorf("body %q ct %q", rec.Body.String(), rec.Header().Get("Content-Type"))
				}
			}
			if rec.Header().Get("Location") != tt.wantLoc {
				t.Errorf("location = %q", rec.Header().Get("Location"))
			}
		})
	}
}
