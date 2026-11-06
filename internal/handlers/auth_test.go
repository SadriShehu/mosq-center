package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/sadrishehu/mosq-center/config"
)

func TestAuthRoutesWhenDisabled(t *testing.T) {
	h := &handler{AuthConfig: &config.Auth0Config{Enable: false}} // Auth0 is nil on purpose

	t.Run("login", func(t *testing.T) {
		rec := httptest.NewRecorder()
		h.Login(rec, httptest.NewRequest(http.MethodGet, "/login", nil))
		if rec.Code != http.StatusOK || !strings.Contains(rec.Header().Get("Content-Type"), "text/html") ||
			!strings.Contains(rec.Body.String(), `href="/user"`) {
			t.Errorf("status %d ct %q body %q", rec.Code, rec.Header().Get("Content-Type"), rec.Body.String())
		}
	})
	t.Run("callback", func(t *testing.T) {
		rec := httptest.NewRecorder()
		h.Callback(rec, httptest.NewRequest(http.MethodGet, "/callback", nil))
		if rec.Code < 300 || rec.Code > 399 || rec.Header().Get("Location") != "/user" {
			t.Errorf("status %d location %q", rec.Code, rec.Header().Get("Location"))
		}
	})
	t.Run("logout", func(t *testing.T) {
		rec := httptest.NewRecorder()
		h.Logout(rec, httptest.NewRequest(http.MethodGet, "/logout", nil))
		if rec.Code < 300 || rec.Code > 399 || rec.Header().Get("Location") != "/" {
			t.Errorf("status %d location %q", rec.Code, rec.Header().Get("Location"))
		}
	})
}
