package handlers

import (
	"github.com/go-chi/chi"
)

type handler struct {
	RouterService         *chi.Mux
	PaymentsService       PaymentsService
	FamiliesService       FamiliesService
	NeighbourhoodsService NeighbourhoodsService
}

func New(router *chi.Mux,
	ps PaymentsService,
	fs FamiliesService,
	ns NeighbourhoodsService) *handler {
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
			r.Get("/{id}", h.GetNeighbourhood)
			r.Get("/", h.GetAllNeighbourhoods)
			r.Put("/{id}", h.UpdateNeighbourhood)
		})
	})
}
