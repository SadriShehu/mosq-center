package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
)

func (h *handler) Login(w http.ResponseWriter, r *http.Request) {
	state, err := generateRandomState()
	if err != nil {
		log.Printf("failed to generate random state: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	session := sessions.NewSession(h.SessionStore, "auth-store")
	session.Values["state"] = state
	if err = session.Save(r, w); err != nil {
		log.Printf("failed to save session: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, h.Auth0.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (h *handler) Callback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	session, err := h.SessionStore.Get(r, "auth-store")
	if err != nil {
		log.Printf("failed to get session: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if state != session.Values["state"] {
		log.Printf("invalid state: %s\n", state)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	token, err := h.Auth0.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		log.Printf("failed to exchange token: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	idToken, err := h.Auth0.VerifyIDToken(r.Context(), token)
	if err != nil {
		log.Printf("failed to verify token: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var profile map[string]interface{}
	if err = idToken.Claims(&profile); err != nil {
		log.Printf("failed to parse claims: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	session.Values["profile"] = profile
	session.Values["access_token"] = token.AccessToken
	if err = session.Save(r, w); err != nil {
		log.Printf("failed to save session: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/user", http.StatusTemporaryRedirect)
}

func (h *handler) Logout(w http.ResponseWriter, r *http.Request) {
	logoutUrl, err := url.Parse("https://" + h.AuthConfig.Domain + "/v2/logout")
	if err != nil {
		log.Printf("failed to logout: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}

	returnTo, err := url.Parse(scheme + "://" + r.Host)
	if err != nil {
		log.Printf("failed to logout: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	parameters := url.Values{}
	parameters.Add("returnTo", returnTo.String())
	parameters.Add("client_id", h.AuthConfig.ClientID)
	logoutUrl.RawQuery = parameters.Encode()

	http.Redirect(w, r, logoutUrl.String(), http.StatusTemporaryRedirect)
}

func generateRandomState() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	state := base64.StdEncoding.EncodeToString(b)

	return state, nil
}
