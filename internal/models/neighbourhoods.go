package models

import (
	"time"

	"github.com/google/uuid"
)

type Neighbourhood struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Region     string `json:"region"`
	Country    string `json:"country"`
	PostalCode string `json:"postal_code"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

func (n *Neighbourhood) Hydrate(req *NeighbourhoodRequest) {
	n.Name = req.Name
	n.Region = req.Region
	n.Country = req.Country
	n.PostalCode = req.PostalCode

	n.ID = uuid.New().String()
	n.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	n.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
}

type NeighbourhoodRequest struct {
	Name       string `json:"name" validate:"required"`
	Region     string `json:"region" validate:"required"`
	Country    string `json:"country"`
	PostalCode string `json:"postal_code"`
}

type NeighbourhoodResponse struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Region     string `json:"region"`
	Country    string `json:"country"`
	PostalCode string `json:"postal_code"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

func (n *NeighbourhoodResponse) MapResponse(neighbourhood *Neighbourhood) {
	n.ID = neighbourhood.ID
	n.Name = neighbourhood.Name
	n.Region = neighbourhood.Region
	n.Country = neighbourhood.Country
	n.PostalCode = neighbourhood.PostalCode
	n.CreatedAt = neighbourhood.CreatedAt
	n.UpdatedAt = neighbourhood.UpdatedAt
}
