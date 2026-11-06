package handlers

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/gorilla/sessions"
	"github.com/sadrishehu/mosq-center/config"
	"github.com/sadrishehu/mosq-center/internal/middleware"
	"github.com/sadrishehu/mosq-center/web"
)

type handler struct {
	RouterService         *chi.Mux
	Auth0                 AuthService
	PaymentsService       PaymentsService
	FamiliesService       FamiliesService
	NeighbourhoodsService NeighbourhoodsService
	InvoicesService       InvoicesService
	PrayersService        PrayersService
	ReportsService        ReportsService
	SessionStore          *sessions.CookieStore
	AuthConfig            *config.Auth0Config
}

func New(router *chi.Mux,
	auth0 AuthService,
	ps PaymentsService,
	fs FamiliesService,
	ns NeighbourhoodsService,
	is InvoicesService,
	prs PrayersService,
	rs ReportsService,
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
		ReportsService:        rs,
		SessionStore:          ss,
		AuthConfig:            ac,
	}
}

// RegisterTemplates registers the auth routes and the embedded static
// frontend. Everything outside the public allowlist sits behind the auth middleware when auth is enabled.
func (h *handler) RegisterTemplates() {
	h.RouterService.Get("/login", h.Login)
	h.RouterService.Get("/callback", h.Callback)
	h.RouterService.Get("/logout", h.Logout)

	static := StaticHandler(web.Files)
	protected := static
	if h.AuthConfig.Enable {
		protected = middleware.AuthenticateUser(h.SessionStore)(static)
	}

	h.RouterService.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if isPublicPath(req.URL.Path) {
			static.ServeHTTP(w, req)
			return
		}
		protected.ServeHTTP(w, req)
	}))
}

func (h *handler) RegisterRoutesV1() {
	h.RouterService.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.HealthCheck)
		r.Get("/public/prayers", h.GetPrayers)

		r.Group(func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Get("/me", h.Me)
			r.Get("/regions", h.GetRegions)
			r.Get("/families/details", h.GetFamiliesDetails)
			r.Get("/payments/details", h.GetPaymentsDetails)
			r.Get("/payments/no-payment/details", h.GetNoPaymentDetails)
			r.Get("/payments/recent", h.GetRecentPayments)
			r.Post("/payments/bulk", h.BulkPayments)
			r.Get("/stats", h.GetStats)
			r.Get("/collection", h.GetCollection)
			r.Get("/families/{id}/history", h.GetFamilyHistory)
		})

		r.Route("/prayers", func(r chi.Router) {
			if h.AuthConfig.Enable {
				r.Use(middleware.AuthenticateUser(h.SessionStore))
			}
			r.Get("/", h.GetPrayers)
		})

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
