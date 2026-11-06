package handlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/google/uuid"
	"github.com/sadrishehu/mosq-center/internal/models"
	"github.com/sadrishehu/mosq-center/internal/services"
)

type ReportsService interface {
	Stats(context.Context, int) (*models.Stats, error)
	Collection(context.Context, int, string) ([]*models.CollectionItem, error)
	FamilyHistory(context.Context, string) (*models.FamilyHistory, error)
	BulkPay(context.Context, *models.BulkPaymentsRequest) (*models.BulkPaymentsResponse, error)
	Recent(context.Context, int) ([]*models.PaymentsTemplate, error)
}

// serviceError maps service errors to JSON error responses.
func serviceError(w http.ResponseWriter, req *http.Request, err error) {
	switch {
	case errors.Is(err, services.ErrNotFound):
		apiError(w, req, http.StatusNotFound, "not found")
	case errors.Is(err, services.ErrInvalid):
		apiError(w, req, http.StatusBadRequest, err.Error())
	default:
		internalError(w, req, err)
	}
}

// yearParam reads ?<name>=YYYY, defaulting to the current year.
func yearParam(req *http.Request, name string) (int, error) {
	v := req.URL.Query().Get(name)
	if v == "" {
		return time.Now().Year(), nil
	}
	y, err := strconv.Atoi(v)
	if err != nil || y < 1900 || y > 3000 {
		return 0, fmt.Errorf("invalid %s", name)
	}
	return y, nil
}

func (h *handler) GetStats(w http.ResponseWriter, req *http.Request) {
	year, err := yearParam(req, "year")
	if err != nil {
		apiError(w, req, http.StatusBadRequest, err.Error())
		return
	}
	stats, err := h.ReportsService.Stats(req.Context(), year)
	if err != nil {
		serviceError(w, req, err)
		return
	}
	render.JSON(w, req, stats)
}

func (h *handler) GetCollection(w http.ResponseWriter, req *http.Request) {
	year, err := yearParam(req, "year")
	if err != nil {
		apiError(w, req, http.StatusBadRequest, err.Error())
		return
	}
	neighbourhoodID := req.URL.Query().Get("neighbourhood_id")
	if neighbourhoodID != "" {
		if _, err := uuid.Parse(neighbourhoodID); err != nil {
			apiError(w, req, http.StatusBadRequest, "invalid neighbourhood_id")
			return
		}
	}
	items, err := h.ReportsService.Collection(req.Context(), year, neighbourhoodID)
	if err != nil {
		serviceError(w, req, err)
		return
	}
	render.JSON(w, req, items)
}

func (h *handler) GetFamilyHistory(w http.ResponseWriter, req *http.Request) {
	history, err := h.ReportsService.FamilyHistory(req.Context(), chi.URLParam(req, "id"))
	if err != nil {
		serviceError(w, req, err)
		return
	}
	render.JSON(w, req, history)
}

func (h *handler) BulkPayments(w http.ResponseWriter, req *http.Request) {
	body := &models.BulkPaymentsRequest{}
	if err := render.DecodeJSON(req.Body, body); err != nil {
		apiError(w, req, http.StatusBadRequest, "invalid body")
		return
	}
	res, err := h.ReportsService.BulkPay(req.Context(), body)
	if err != nil {
		serviceError(w, req, err)
		return
	}
	render.Status(req, http.StatusCreated)
	render.JSON(w, req, res)
}

func (h *handler) GetRecentPayments(w http.ResponseWriter, req *http.Request) {
	limit := 10
	if v := req.URL.Query().Get("limit"); v != "" {
		l, err := strconv.Atoi(v)
		if err != nil || l < 1 || l > 100 {
			apiError(w, req, http.StatusBadRequest, "invalid limit")
			return
		}
		limit = l
	}
	items, err := h.ReportsService.Recent(req.Context(), limit)
	if err != nil {
		serviceError(w, req, err)
		return
	}
	render.JSON(w, req, items)
}
