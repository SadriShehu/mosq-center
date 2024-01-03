package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/google/uuid"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type PaymentsService interface {
	Create(context.Context, *models.PaymentsRequest) ([]string, error)
	GetPayments(context.Context, string) (*models.PaymentsResponse, error)
	GetAllPayments(context.Context, int64, int64) ([]*models.PaymentsResponse, error)
	Update(context.Context, string, *models.PaymentsRequest) error
	Delete(context.Context, string) error
	NoPayment(context.Context, int, string, int64, int64) ([]*models.FamiliesResponse, error)
	GetPaymentsByFamily(context.Context, string, int64, int64) ([]*models.PaymentsResponse, error)
	GetPaymentsByYear(context.Context, int, int64, int64) ([]*models.PaymentsResponse, error)
}

func (h *handler) CreatePayment(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	body := &models.PaymentsRequest{}
	if err := render.Bind(req, body); err != nil {
		log.Printf("failed to bind request: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to bind request: %v\n", err)))
		return
	}

	ids, err := h.PaymentsService.Create(ctx, body)
	if err != nil {
		log.Printf("failed to create payment: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to create payment: %v\n", err)))
		return
	}

	log.Println("payment created successfully")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(fmt.Sprintf("%v\n", ids)))
}

func (h *handler) GetPayment(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	payment, err := h.PaymentsService.GetPayments(ctx, id)
	if err != nil {
		log.Printf("failed to get payment: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get payment: %v\n", err)))
		return
	}

	log.Println("payment retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, payment)
}

func (h *handler) GetAllPayments(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	limit := req.URL.Query().Get("limit")
	limit64, err := strconv.ParseInt(limit, 10, 64)
	if err != nil {
		log.Printf("failed to parse limit: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse limit: %v\n", err)))
		return
	}

	skip := req.URL.Query().Get("skip")
	skip64, err := strconv.ParseInt(skip, 10, 64)
	if err != nil {
		log.Printf("failed to parse skip: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse skip: %v\n", err)))
		return
	}

	payments, err := h.PaymentsService.GetAllPayments(ctx, limit64, skip64)
	if err != nil {
		log.Printf("failed to get payment: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get payment: %v\n", err)))
		return
	}

	log.Println("payment retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, payments)
}

func (h *handler) UpdatePayment(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	body := &models.PaymentsRequest{}
	if err := render.Bind(req, body); err != nil {
		log.Printf("failed to bind request: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to bind request: %v\n", err)))
		return
	}

	if err := h.PaymentsService.Update(ctx, id, body); err != nil {
		log.Printf("failed to update payment: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to update payment: %v\n", err)))
		return
	}

	log.Printf("payment with id %s updated successfully", id)
	w.WriteHeader(http.StatusOK)
}

func (h *handler) DeletePayment(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	if err := h.PaymentsService.Delete(ctx, id); err != nil {
		log.Printf("failed to delete payment: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to delete payment: %v\n", err)))
		return
	}

	log.Printf("payment with id %s deleted successfully", id)
	w.WriteHeader(http.StatusOK)
}

func (h *handler) NoPayment(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	year := req.URL.Query().Get("year")

	if year == "" || len(year) != 4 {
		log.Printf("failed to get no payments: %v\n", "year is required and must be 4 digits")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to get no payment: %v\n", "year is required")))
		return
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		log.Printf("failed to get no payments: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to get no payment: %v\n", err)))
		return
	}

	neighbourhoodID := req.URL.Query().Get("s_neighbourhood_id")
	if neighbourhoodID != "" {
		_, err := uuid.Parse(neighbourhoodID)
		if err != nil {
			log.Printf("failed to get no payments: %v\n", err)
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(fmt.Sprintf("failed to get no payment: %v\n", err)))
			return
		}
	}

	limit := req.URL.Query().Get("limit")
	limit64, err := strconv.ParseInt(limit, 10, 64)
	if err != nil {
		log.Printf("failed to parse limit: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse limit: %v\n", err)))
		return
	}

	skip := req.URL.Query().Get("skip")
	skip64, err := strconv.ParseInt(skip, 10, 64)
	if err != nil {
		log.Printf("failed to parse skip: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse skip: %v\n", err)))
		return
	}

	families, err := h.PaymentsService.NoPayment(ctx, yearInt, neighbourhoodID, limit64, skip64)
	if err != nil {
		log.Printf("failed to get no payments: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to get no payment: %v\n", err)))
		return
	}

	log.Println("no payments retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, families)
}

func (h *handler) GetPaymentsByFamily(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	limit := req.URL.Query().Get("limit")
	limit64, err := strconv.ParseInt(limit, 10, 64)
	if err != nil {
		log.Printf("failed to parse limit: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse limit: %v\n", err)))
		return
	}

	skip := req.URL.Query().Get("skip")
	skip64, err := strconv.ParseInt(skip, 10, 64)
	if err != nil {
		log.Printf("failed to parse skip: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse skip: %v\n", err)))
		return
	}

	payments, err := h.PaymentsService.GetPaymentsByFamily(ctx, id, limit64, skip64)
	if err != nil {
		log.Printf("failed to get payments: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get payments: %v\n", err)))
		return
	}

	log.Println("payments retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, payments)
}

func (h *handler) GetPaymentsByYear(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	year := chi.URLParam(req, "year")

	if year == "" {
		log.Printf("failed to get payments: %v\n", "year is required")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to get payments: %v\n", "year is required")))
		return
	}

	if len(year) != 4 {
		log.Printf("failed to get payments: %v\n", "year must be 4 digits")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to get payments: %v\n", "year must be 4 digits")))
		return
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		log.Printf("failed to get payments: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to get payments: %v\n", err)))
		return
	}

	limit := req.URL.Query().Get("limit")
	limit64, err := strconv.ParseInt(limit, 10, 64)
	if err != nil {
		log.Printf("failed to parse limit: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse limit: %v\n", err)))
		return
	}

	skip := req.URL.Query().Get("skip")
	skip64, err := strconv.ParseInt(skip, 10, 64)
	if err != nil {
		log.Printf("failed to parse skip: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to parse skip: %v\n", err)))
		return
	}

	payments, err := h.PaymentsService.GetPaymentsByYear(ctx, yearInt, limit64, skip64)
	if err != nil {
		log.Printf("failed to get payments: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get payments: %v\n", err)))
		return
	}

	log.Println("payments retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, payments)
}
