package middleware

import (
	"net/http"

	"github.com/gorilla/sessions"
	"github.com/sadrishehu/mosq-center/internal/models"
)

func AuthenticateUser(store *sessions.CookieStore) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			session, err := store.Get(req, "auth-store")
			if err != nil {
				w.Header().Set("X-Reason", "Unable to get session")
				http.Redirect(w, req, "/logout", http.StatusSeeOther)
				return
			}

			if session.Values["profile"] == nil {
				w.Header().Set("X-Reason", "User is not authenticated")
				http.Redirect(w, req, "/logout", http.StatusSeeOther)
				return
			}

			if session.Values["service"] == nil {
				w.Header().Set("X-Reason", "User is not authenticated")
				http.Redirect(w, req, "/logout", http.StatusSeeOther)
				return
			}

			profile := session.Values["profile"].(models.Profile)
			for _, access := range profile.MosqAccess {
				if access == session.Values["service"] {
					next.ServeHTTP(w, req)
					return
				}
			}

			w.Header().Set("X-Reason", "User is not authorized")
			http.Redirect(w, req, "/logout", http.StatusSeeOther)
		})
	}
}
