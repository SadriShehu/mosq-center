package middleware

import (
	"net/http"
	"strings"

	"github.com/gorilla/sessions"
	"github.com/sadrishehu/mosq-center/internal/models"
)

// deny rejects the request: API calls get a 401 JSON body, page routes are
// redirected to /logout.
func deny(w http.ResponseWriter, req *http.Request, reason string) {
	w.Header().Set("X-Reason", reason)
	if strings.HasPrefix(req.URL.Path, "/api/") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"unauthorized"}`))
		return
	}
	http.Redirect(w, req, "/logout", http.StatusSeeOther)
}

func AuthenticateUser(store *sessions.CookieStore) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			session, err := store.Get(req, "auth-store")
			if err != nil {
				deny(w, req, "Unable to get session")
				return
			}

			if session.Values["profile"] == nil {
				deny(w, req, "User is not authenticated")
				return
			}

			if session.Values["service"] == nil {
				deny(w, req, "User is not authenticated")
				return
			}

			profile := session.Values["profile"].(models.Profile)
			for _, access := range profile.MosqAccess {
				if access == session.Values["service"] {
					next.ServeHTTP(w, req)
					return
				}
			}

			deny(w, req, "User is not authorized")
		})
	}
}
