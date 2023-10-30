package models

import (
	"time"

	"github.com/google/uuid"
)

type Payments struct {
	ID              string  `json:"id"`
	FamilyID        string  `json:"family_id"`
	Amount          float64 `json:"amount"`
	NeighbourhoodID string  `json:"neighbourhood_id"`
	Year            int     `json:"year"`
	CreatedAt       string  `json:"created_at"`
	UpdatedAt       string  `json:"updated_at"`
	DeletedAt       string  `json:"deleted_at"`
}

func (p *Payments) Hydrate(req *PaymentsRequest) {
	p.FamilyID = req.FamilyID
	p.Amount = req.Amount
	p.NeighbourhoodID = req.NeighbourhoodID
	p.Year = req.Year

	p.ID = uuid.New().String()
	p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
}

type PaymentsRequest struct {
	FamilyID        string  `json:"family_id" validate:"required"`
	Amount          float64 `json:"amount" validate:"required"`
	Year            int     `json:"year" validate:"required"`
	NeighbourhoodID string  `json:"neighbourhood_id" validate:"required"`
}

type PaymentsResponse struct {
	ID              string  `json:"id"`
	FamilyID        string  `json:"family_id"`
	Amount          float64 `json:"amount"`
	Year            int     `json:"year"`
	NeighbourhoodID string  `json:"neighbourhood_id"`
	CreatedAt       string  `json:"created_at"`
	UpdatedAt       string  `json:"updated_at"`
}

func (p *PaymentsResponse) MapResponse(payment *Payments) {
	p.ID = payment.ID
	p.FamilyID = payment.FamilyID
	p.Amount = payment.Amount
	p.Year = payment.Year
	p.NeighbourhoodID = payment.NeighbourhoodID
	p.CreatedAt = payment.CreatedAt
	p.UpdatedAt = payment.UpdatedAt
}

type PaymentsTemplate struct {
	ID                string  `json:"id"`
	FamilyName        string  `json:"family_name"`
	Members           int     `json:"members"`
	Amount            float64 `json:"amount"`
	Year              int     `json:"year"`
	NeighbourhoodName string  `json:"neighbourhood_name"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

func (p *PaymentsTemplate) MapTemplate(payment *PaymentsResponse, familyName string, familyMembers int, neighbourhoodName string) {
	p.ID = payment.ID
	p.FamilyName = familyName
	p.Members = familyMembers
	p.Amount = payment.Amount
	p.Year = payment.Year
	p.NeighbourhoodName = neighbourhoodName
	p.CreatedAt = payment.CreatedAt
	p.UpdatedAt = payment.UpdatedAt
}
