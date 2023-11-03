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
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if session.Values["profile"] == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
				return
			}

			next.ServeHTTP(w, req)
		})
	}
}
