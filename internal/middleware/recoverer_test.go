package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRecoverer(t *testing.T) {
	t.Run("panic returns 500", func(t *testing.T) {
		h := Recoverer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("boom") }))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/x", nil))
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d", rec.Code)
		}
	})

	t.Run("started response is not overwritten", func(t *testing.T) {
		h := Recoverer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusAccepted)
			panic("late")
		}))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/x", nil))
		if rec.Code != http.StatusAccepted {
			t.Fatalf("status = %d", rec.Code)
		}
	})

	t.Run("ErrAbortHandler is re-panicked", func(t *testing.T) {
		h := Recoverer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic(http.ErrAbortHandler) }))
		defer func() {
			if r := recover(); r != http.ErrAbortHandler {
				t.Errorf("recovered %v", r)
			}
		}()
		h.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/x", nil))
	})

	t.Run("no panic passes through", func(t *testing.T) {
		h := Recoverer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/x", nil))
		if rec.Code != http.StatusNoContent {
			t.Fatalf("status = %d", rec.Code)
		}
	})
}
