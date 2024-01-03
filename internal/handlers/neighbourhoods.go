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

type NeighbourhoodsService interface {
	Create(context.Context, *models.NeighbourhoodRequest) (string, error)
	GetNeighbourhood(context.Context, string) (*models.NeighbourhoodResponse, error)
	GetAllNeighbourhoods(context.Context, int64, int64) ([]*models.NeighbourhoodResponse, error)
	Update(context.Context, string, *models.NeighbourhoodRequest) error
	Delete(context.Context, string) error
}

func (h *handler) CreateNeighbourhood(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	body := &models.NeighbourhoodRequest{}
	if err := render.Bind(req, body); err != nil {
		log.Printf("failed to bind request: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to bind request: %v\n", err)))
		return
	}

	id, err := h.NeighbourhoodsService.Create(ctx, body)
	if err != nil {
		log.Printf("failed to create neighbourhood: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to create neighbourhood: %v\n", err)))
		return
	}

	log.Println("neighbourhood created successfully")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(id))
}

func (h *handler) GetNeighbourhood(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	neighbourhood, err := h.NeighbourhoodsService.GetNeighbourhood(ctx, id)
	if err != nil {
		log.Printf("failed to get neighbourhood: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get neighbourhood: %v\n", err)))
		return
	}

	log.Println("neighbourhood retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, neighbourhood)
}

func (h *handler) GetAllNeighbourhoods(w http.ResponseWriter, req *http.Request) {
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

	neighbourhoods, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx, limit64, skip64)
	if err != nil {
		log.Printf("failed to get neighbourhood: %v\n", err)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(fmt.Sprintf("failed to get neighbourhood: %v\n", err)))
		return
	}

	log.Println("neighbourhood retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, neighbourhoods)
}

func (h *handler) UpdateNeighbourhood(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	body := &models.NeighbourhoodRequest{}
	if err := render.Bind(req, body); err != nil {
		log.Printf("failed to bind request: %v\n", err)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("failed to bind request: %v\n", err)))
		return
	}

	if err := h.NeighbourhoodsService.Update(ctx, id, body); err != nil {
		log.Printf("failed to update neighbourhood: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to update neighbourhood: %v\n", err)))
		return
	}

	log.Printf("neighbourhood with id %s updated successfully", id)
	w.WriteHeader(http.StatusOK)
}

func (h *handler) DeleteNeighbourhood(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	id := chi.URLParam(req, "id")

	if err := h.NeighbourhoodsService.Delete(ctx, id); err != nil {
		log.Printf("failed to delete neighbourhood: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to delete neighbourhood: %v\n", err)))
		return
	}

	log.Printf("neighbourhood with id %s deleted successfully", id)
	w.WriteHeader(http.StatusOK)
}
