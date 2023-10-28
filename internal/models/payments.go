package models

import (
	"time"

	"github.com/google/uuid"
)

type Payments struct {
	ID              string `json:"id"`
	FamilyID        string `json:"family_id"`
	Amount          int    `json:"amount"`
	NeighbourhoodID string `json:"neighbourhood_id"`
	Year            int    `json:"year"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
	DeletedAt       string `json:"deleted_at"`
}

func (p *Payments) Hydrate(req *PaymentsRequest) {
	p.FamilyID = req.FamilyID
	p.Amount = req.Amount
	p.NeighbourhoodID = req.NeighbourhoodID

	p.ID = uuid.New().String()
	p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
}

type PaymentsRequest struct {
	FamilyID        string `json:"family_id" validate:"required"`
	Amount          int    `json:"amount" validate:"required"`
	NeighbourhoodID string `json:"neighbourhood_id" validate:"required"`
}

type PaymentsResponse struct {
	ID              string `json:"id"`
	FamilyID        string `json:"family_id"`
	Amount          int    `json:"amount"`
	NeighbourhoodID string `json:"neighbourhood_id"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

func (p *PaymentsResponse) MapResponse(payment *Payments) {
	p.ID = payment.ID
	p.FamilyID = payment.FamilyID
	p.Amount = payment.Amount
	p.NeighbourhoodID = payment.NeighbourhoodID
	p.CreatedAt = payment.CreatedAt
	p.UpdatedAt = payment.UpdatedAt
}
