package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/render"
	"github.com/sadrishehu/mosq-center/internal/models"
)

func (h *handler) Create(w http.ResponseWriter, req *http.Request) {
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
