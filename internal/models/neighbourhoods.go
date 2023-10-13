package models

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type Neighbourhood struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Region     string    `json:"region"`
	Country    string    `json:"country"`
	PostalCode string    `json:"postal_code"`
	CreatedAt  string    `json:"created_at"`
	UpdatedAt  string    `json:"updated_at"`
	DeletedAt  string    `json:"deleted_at"`
}

type NeighbourhoodRequest struct {
	Name       string `json:"name" validate:"required"`
	Region     string `json:"region" validate:"required"`
	Country    string `json:"country"`
	PostalCode string `json:"postal_code"`
}

func (nReq *NeighbourhoodRequest) Bind(*http.Request) error {
	if err := Validator.Struct(nReq); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}
	return nil
}

type NeighbourhoodResponse struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Region     string    `json:"region"`
	Country    string    `json:"country"`
	PostalCode string    `json:"postal_code"`
	CreatedAt  string    `json:"created_at"`
	UpdatedAt  string    `json:"updated_at"`
}
