package handlers

import (
	"github.com/go-chi/chi"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type handler struct {
	RouterService   *chi.Mux
	PaymentsService models.PaymentsService
}

func New(router *chi.Mux, ps models.PaymentsService) *handler {
	return &handler{
		RouterService:   router,
		PaymentsService: ps,
	}
}

func (h *handler) RegisterRoutesV1() {
	h.RouterService.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.HealthCheck)
	})
}
