package handlers

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/gorilla/sessions"
	"github.com/sadrishehu/mosq-center/config"
	"github.com/sadrishehu/mosq-center/internal/integration/auth0"
	"github.com/sadrishehu/mosq-center/internal/middleware"
	"github.com/sadrishehu/mosq-center/internal/templates"
)

type handler struct {
	RouterService         *chi.Mux
	Auth0                 *auth0.Authenticator
	PaymentsService       PaymentsService
	FamiliesService       FamiliesService
	NeighbourhoodsService NeighbourhoodsService
	InvoicesService       InvoicesService
	PrayersService        PrayersService
	SessionStore          *sessions.CookieStore
	AuthConfig            *config.Auth0Config
}

func New(router *chi.Mux,
	auth0 *auth0.Authenticator,
	ps PaymentsService,
	fs FamiliesService,
	ns NeighbourhoodsService,
	is InvoicesService,
	prs PrayersService,
	ss *sessions.CookieStore,
	ac *config.Auth0Config) *handler {
	return &handler{
		RouterService:         router,
		Auth0:                 auth0,
		PaymentsService:       ps,
		FamiliesService:       fs,
		NeighbourhoodsService: ns,
		InvoicesService:       is,
		PrayersService:        prs,
		SessionStore:          ss,
		AuthConfig:            ac,
	}
}

func (h *handler) RegisterTemplates() {
	fs := http.FileServer(http.FS(templates.Files))
	h.RouterService.Handle("/app/css/styles.css", fs)
	h.RouterService.Handle("/app/js/scripts.js", fs)
	h.RouterService.Handle("/app/assets/favicon.ico", fs)

	h.RouterService.Route("/", func(r chi.Router) {
		r.Get("/", h.Publike)
		r.Get("/login", h.Login)
		r.Get("/callback", h.Callback)
		r.Get("/logout", h.Logout)

		r.Group(func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Get("/lagjet", h.Lagjet)
			r.Get("/familjet", h.Familjet)
			r.Get("/pagesat", h.Pagesat)
			r.Get("/pagesat-pakryera", h.PagesatPakryera)
			r.Get("/user", h.User)
			h.RouterService.Handle("/app/js/*", fs)
		})
	})
}

func (h *handler) RegisterRoutesV1() {
	h.RouterService.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.HealthCheck)
		r.Get("/prayers", h.GetPrayers)

		r.Route("/payments", func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Post("/", h.CreatePayment)
			r.Get("/{id}", h.GetPayment)
			r.Get("/", h.GetAllPayments)
			r.Put("/{id}", h.UpdatePayment)
			r.Delete("/{id}", h.DeletePayment)
			r.Get("/no-payment", h.NoPayment)
			r.Get("/family/{id}", h.GetPaymentsByFamily)
			r.Get("/year/{year}", h.GetPaymentsByYear)
		})

		r.Route("/families", func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Post("/", h.CreateFamily)
			r.Get("/{id}", h.GetFamily)
			r.Get("/", h.GetAllFamilies)
			r.Put("/{id}", h.UpdateFamily)
			r.Delete("/{id}", h.DeleteFamily)
		})

		r.Route("/neighbourhoods", func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Post("/", h.CreateNeighbourhood)
			r.Get("/{id}", h.GetNeighbourhood)
			r.Get("/", h.GetAllNeighbourhoods)
			r.Put("/{id}", h.UpdateNeighbourhood)
			r.Delete("/{id}", h.DeleteNeighbourhood)
		})

		r.Route("/invoices", func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Get("/", h.GetInvoices)
		})
	})
}
