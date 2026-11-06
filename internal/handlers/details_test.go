package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/sessions"
	"github.com/sadrishehu/mosq-center/config"
)

func TestMeAuthDisabled(t *testing.T) {
	h := &handler{AuthConfig: &config.Auth0Config{Enable: false}, SessionStore: sessions.NewCookieStore([]byte("s"))}
	rec := httptest.NewRecorder()
	h.Me(rec, httptest.NewRequest(http.MethodGet, "/api/v1/me", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var got map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	want := map[string]string{"name": "Dev", "email": "", "picture": ""}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("%s = %q, want %q", k, got[k], v)
		}
	}
}

func TestMeAuthEnabledNoSession(t *testing.T) {
	h := &handler{AuthConfig: &config.Auth0Config{Enable: true}, SessionStore: sessions.NewCookieStore([]byte("s"))}
	rec := httptest.NewRecorder()
	h.Me(rec, httptest.NewRequest(http.MethodGet, "/api/v1/me", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestGetRegions(t *testing.T) {
	h := &handler{}
	rec := httptest.NewRecorder()
	h.GetRegions(rec, httptest.NewRequest(http.MethodGet, "/api/v1/regions", nil))
	var got []map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil || len(got) == 0 || got[0]["name"] == "" || got[0]["zip"] == "" {
		t.Errorf("bad body %s (%v)", rec.Body.String(), err)
	}
}
