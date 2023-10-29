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

type FamiliesService interface {
	Create(context.Context, *models.FamiliesRequest) (string, error)
	GetFamilies(context.Context, string) (*models.FamiliesResponse, error)
	GetAllFamilies(context.Context) ([]*models.FamiliesResponse, error)
	Update(context.Context, string, *models.FamiliesRequest) error
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

	familie, err := h.FamiliesService.GetFamilies(ctx, id)
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

	families, err := h.FamiliesService.GetAllFamilies(ctx)
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
