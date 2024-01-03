package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/go-chi/render"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type FamiliesService interface {
	Create(context.Context, *models.FamiliesRequest) (string, error)
	GetFamily(context.Context, string) (*models.FamiliesResponse, error)
	GetAllFamilies(context.Context, int64, int64) ([]*models.FamiliesResponse, error)
	Update(context.Context, string, *models.FamiliesRequest) error
	Delete(context.Context, string) error
}

func (h *handler) CreateFamily(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	body := &models.FamiliesRequest{}
	if err := render.Bind(req, body); err != nil {
		log.Printf("failed to bind request: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to bind request: %v\n", err)))
		return
	}

	id, err := h.FamiliesService.Create(ctx, body)
	if err != nil {
		log.Printf("failed to create familie: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to create familie: %v\n", err)))
		return
	}

	log.Println("familie created successfully")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(id))
}

func (h *handler) GetFamily(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	familie, err := h.FamiliesService.GetFamily(ctx, id)
	if err != nil {
		log.Printf("failed to get familie: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get familie: %v\n", err)))
		return
	}

	log.Println("familie retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, familie)
}

func (h *handler) GetAllFamilies(w http.ResponseWriter, req *http.Request) {
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

	families, err := h.FamiliesService.GetAllFamilies(ctx, limit64, skip64)
	if err != nil {
		log.Printf("failed to get familie: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get familie: %v\n", err)))
		return
	}

	log.Println("familie retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, families)
}

func (h *handler) UpdateFamily(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	body := &models.FamiliesRequest{}
	if err := render.Bind(req, body); err != nil {
		log.Printf("failed to bind request: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to bind request: %v\n", err)))
		return
	}

	if err := h.FamiliesService.Update(ctx, id, body); err != nil {
		log.Printf("failed to update familie: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to update familie: %v\n", err)))
		return
	}

	log.Printf("familie with id %s updated successfully", id)
	w.WriteHeader(http.StatusOK)
}

func (h *handler) DeleteFamily(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	if err := h.FamiliesService.Delete(ctx, id); err != nil {
		log.Printf("failed to delete familie: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to delete familie: %v\n", err)))
		return
	}

	log.Printf("familie with id %s deleted successfully", id)
	w.WriteHeader(http.StatusOK)
}
