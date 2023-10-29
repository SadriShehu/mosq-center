package models

import (
	"time"

	"github.com/google/uuid"
)

type Families struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Middlename      string `json:"middle_name"`
	Surname         string `json:"surname"`
	Members         int    `json:"members"`
	NeighbourhoodID string `json:"neighbourhood_id"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
	DeletedAt       string `json:"deleted_at"`
}

func (f *Families) Hydrate(req *FamiliesRequest) {
	f.Name = req.Name
	f.Middlename = req.Middlename
	f.Surname = req.Surname
	f.Members = req.Members
	f.NeighbourhoodID = req.NeighbourhoodID

	f.ID = uuid.New().String()
	f.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	f.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
}

type FamiliesRequest struct {
	Name            string `json:"name" validate:"required"`
	Middlename      string `json:"middle_name"`
	Surname         string `json:"surname" validate:"required"`
	Members         int    `json:"members" validate:"required"`
	NeighbourhoodID string `json:"neighbourhood_id" validate:"required"`
}

type FamiliesResponse struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Middlename      string `json:"middle_name"`
	Surname         string `json:"surname"`
	Members         int    `json:"members"`
	NeighbourhoodID string `json:"neighbourhood_id"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

func (f *FamiliesResponse) MapResponse(family *Families) {
	f.ID = family.ID
	f.Name = family.Name
	f.Middlename = family.Middlename
	f.Surname = family.Surname
	f.Members = family.Members
	f.NeighbourhoodID = family.NeighbourhoodID
	f.CreatedAt = family.CreatedAt
	f.UpdatedAt = family.UpdatedAt
}

type FamiliesTemplate struct {
	Family        *FamiliesResponse
	Neighbourhood string
}
