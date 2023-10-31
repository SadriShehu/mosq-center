package handlers

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/sadrishehu/mosq-center/internal/integration/auth0"
	"github.com/sadrishehu/mosq-center/internal/templates"
)

type handler struct {
	RouterService         *chi.Mux
	Auth0                 *auth0.Authenticator
	PaymentsService       PaymentsService
	FamiliesService       FamiliesService
	NeighbourhoodsService NeighbourhoodsService
}

func New(router *chi.Mux,
	auth0 *auth0.Authenticator,
	ps PaymentsService,
	fs FamiliesService,
	ns NeighbourhoodsService) *handler {
	return &handler{
		RouterService:         router,
		Auth0:                 auth0,
		PaymentsService:       ps,
		FamiliesService:       fs,
		NeighbourhoodsService: ns,
	}
}

func (h *handler) RegisterTemplates() {
	fs := http.FileServer(http.FS(templates.Files))
	h.RouterService.Handle("/app/css/styles.css", fs)
	h.RouterService.Handle("/app/js/scripts.js", fs)
	h.RouterService.Handle("/app/js/krijoLagje.js", fs)
	h.RouterService.Handle("/app/js/krijoFamilje.js", fs)
	h.RouterService.Handle("/app/js/krijoPagese.js", fs)
	h.RouterService.Handle("/app/assets/favicon.ico", fs)

	h.RouterService.Route("/", func(r chi.Router) {
		r.Get("/lagjet", h.Lagjet)
		r.Get("/familjet", h.Familjet)
		r.Get("/pagesat", h.Pagesat)
	})
}

func (h *handler) RegisterRoutesV1() {
	h.RouterService.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.HealthCheck)

		r.Route("/payments", func(r chi.Router) {
			r.Post("/", h.CreatePayment)
			r.Get("/{id}", h.GetPayment)
			r.Get("/", h.GetAllPayments)
			r.Put("/{id}", h.UpdatePayment)
		})

		r.Route("/families", func(r chi.Router) {
			r.Post("/", h.CreateFamily)
			r.Get("/{id}", h.GetFamily)
			r.Get("/", h.GetAllFamilies)
			r.Put("/{id}", h.UpdateFamily)
		})

		r.Route("/neighbourhoods", func(r chi.Router) {
			r.Post("/", h.CreateNeighbourhood)
			r.Get("/{id}", h.GetNeighbourhood)
			r.Get("/", h.GetAllNeighbourhoods)
			r.Put("/{id}", h.UpdateNeighbourhood)
		})

		r.Route("/auth", func(r chi.Router) {
			r.Get("/login", h.Login)
			r.Get("/callback", h.Callback)
			r.Get("/logout", h.Logout)
			r.Get("/user", h.User)
		})
	})
}
