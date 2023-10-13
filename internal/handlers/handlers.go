package handlers

import (
	"github.com/go-chi/chi"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type handler struct {
	RouterService         *chi.Mux
	PaymentsService       models.PaymentsService
	FamiliesService       models.FamiliesService
	NeighbourhoodsService models.NeighbourhoodsService
}

func New(router *chi.Mux,
	ps models.PaymentsService,
	fs models.FamiliesService,
	ns models.NeighbourhoodsService) *handler {
	return &handler{
		RouterService:         router,
		PaymentsService:       ps,
		FamiliesService:       fs,
		NeighbourhoodsService: ns,
	}
}

func (h *handler) RegisterRoutesV1() {
	h.RouterService.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.HealthCheck)

		r.Route("/payments", func(r chi.Router) {
		})

		r.Route("/families", func(r chi.Router) {
		})

		r.Route("/neighbourhoods", func(r chi.Router) {
			r.Post("/", h.Create)
		})
	})
}
