package middleware

import (
	"net/http"

	"github.com/gorilla/sessions"
)

func AuthenticateUser(store *sessions.CookieStore) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			session, err := store.Get(req, "auth-store")
			if err != nil {
				w.Header().Set("X-Reason", "Unable to get session")
				http.Redirect(w, req, "/", http.StatusSeeOther)
				return
			}

			if session.Values["profile"] == nil {
				w.Header().Set("X-Reason", "User is not authenticated")
				http.Redirect(w, req, "/", http.StatusSeeOther)
				return
			}

			next.ServeHTTP(w, req)
		})
	}
}
