package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	chimw "github.com/go-chi/chi/middleware"
)

// Recoverer turns handler panics into a 500 response. It replaces chi's
// Recoverer, whose pretty stack printer itself panics on newer Go stack traces
// and then drops the connection.
func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		ww := chimw.NewWrapResponseWriter(w, req.ProtoMajor)

		defer func() {
			rec := recover()
			if rec == nil {
				return
			}
			if rec == http.ErrAbortHandler {
				panic(rec)
			}

			log.Printf("panic serving %s %s: %v\n%s", req.Method, req.URL.Path, rec, debug.Stack())

			// Only write a 500 if the handler hasn't started the response.
			if ww.Status() == 0 && ww.BytesWritten() == 0 {
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(ww, req)
	})
}
