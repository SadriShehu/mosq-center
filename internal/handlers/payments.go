package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type PaymentsService interface {
	Create(context.Context, *models.PaymentsRequest) (string, error)
	GetPayments(context.Context, string) (*models.PaymentsResponse, error)
	GetAllPayments(context.Context) ([]*models.PaymentsResponse, error)
	Update(context.Context, string, *models.PaymentsRequest) error
	Delete(context.Context, string) error
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

	id, err := h.PaymentsService.Create(ctx, body)
	if err != nil {
		log.Printf("failed to create payment: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to create payment: %v\n", err)))
		return
	}

	log.Println("payment created successfully")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(id))
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

	payments, err := h.PaymentsService.GetAllPayments(ctx)
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
