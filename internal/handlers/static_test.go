package handlers

import (
	"github.com/go-chi/chi"
	"github.com/gorilla/sessions"
	"github.com/sadrishehu/mosq-center/config"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func TestStaticHandler(t *testing.T) {
	files := fstest.MapFS{
		"index.html":               {Data: []byte("INDEX")},
		"lagjet.html":              {Data: []byte("LAGJET")},
		"lagjet/__next.lagjet.txt": {Data: []byte("RSC")},
		"404.html":                 {Data: []byte("NOTFOUND")},
		"_next/static/chunks/a.js": {Data: []byte("JS")},
		"secret/../../etc":         {Data: []byte("x")},
	}
	h := StaticHandler(files)

	tests := []struct {
		name, method, path string
		status             int
		body, cache        string
	}{
		{"root", "GET", "/", 200, "INDEX", "no-cache"},
		{"clean url", "GET", "/lagjet", 200, "LAGJET", "no-cache"},
		{"explicit html", "GET", "/lagjet.html", 200, "LAGJET", ""},
		{"nested asset", "GET", "/lagjet/__next.lagjet.txt", 200, "RSC", ""},
		{"immutable", "GET", "/_next/static/chunks/a.js", 200, "JS", "public, max-age=31536000, immutable"},
		{"unknown", "GET", "/nope", 404, "NOTFOUND", ""},
		{"directory", "GET", "/_next", 404, "NOTFOUND", ""},
		{"traversal", "GET", "/../../etc/passwd", 404, "NOTFOUND", ""},
		{"encoded traversal", "GET", "/%2e%2e/%2e%2e/etc/passwd", 404, "NOTFOUND", ""},
		{"unknown api", "GET", "/api/v1/zzz", 404, "404 page not found", ""},
		{"post", "POST", "/", 405, "", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequest(tt.method, tt.path, nil))
			if rec.Code != tt.status {
				t.Fatalf("status = %d, want %d", rec.Code, tt.status)
			}
			if tt.body != "" && !strings.Contains(rec.Body.String(), tt.body) {
				t.Errorf("body = %q", rec.Body.String())
			}
			if tt.cache != "" && rec.Header().Get("Cache-Control") != tt.cache {
				t.Errorf("cache = %q", rec.Header().Get("Cache-Control"))
			}
		})
	}
}

func TestIsPublicPath(t *testing.T) {
	tests := map[string]bool{
		// public
		"/": true, "/index.html": true, "/index.txt": true, "/404.html": true,
		"/_next/static/chunks/a.js": true, "/_not-found.html": true,
		"/__next.__PAGE__.txt": true, "/__next._tree.txt": true,
		"/favicon.ico": true, "/logo.png": true,
		"/login": true, "/callback": true, "/logout": true,
		"/api/v1/health": true, "/api/v1/public/prayers": true,
		// protected
		"/mbledhja": false, "/mbledhja.html": false, "/mbledhja.txt": false,
		"/lagjet": false, "/lagjet.txt": false, "/lagjet/__next.lagjet.txt": false,
		"/familjet": false, "/pagesat": false, "/pagesat-pakryera": false, "/user": false, "/user.txt": false,
		"/unknown-route": false, "/nope/deeper": false, "/robots.txt": false,
		"/api/v1/me": false, "/api/v1/families": false, "/api/v1/stats": false, "/api/v1/zzz": false,
		"/api/v1/publicity": false, "/a/../mbledhja": false, "/_next/../mbledhja": false,
		"/sub/logo.png": false,
	}
	for p, want := range tests {
		if got := isPublicPath(p); got != want {
			t.Errorf("isPublicPath(%q) = %v, want %v", p, got, want)
		}
	}
}

func TestAdminTxtBehindAuth(t *testing.T) {
	r := chi.NewRouter()
	h := &handler{
		RouterService: r,
		AuthConfig:    &config.Auth0Config{Enable: true},
		SessionStore:  sessions.NewCookieStore([]byte("s")),
	}
	h.RegisterTemplates()

	for _, p := range []string{"/lagjet", "/lagjet.txt", "/lagjet.html", "/user.txt", "/pagesat-pakryera.txt", "/mbledhja", "/mbledhja.txt", "/unknown-route"} {
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, httptest.NewRequest("GET", p, nil))
		if rec.Code != http.StatusSeeOther || rec.Header().Get("Location") != "/logout" {
			t.Errorf("%s: status %d location %q, want redirect to /logout", p, rec.Code, rec.Header().Get("Location"))
		}
	}

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest("GET", "/", nil))
	if rec.Code == http.StatusSeeOther {
		t.Errorf("public / must not redirect")
	}
}
