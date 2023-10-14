package models

import (
	"context"

	"github.com/go-playground/validator"
)

// Validator global var
var Validator = validator.New()

type PaymentsRepository interface {
}

type PaymentsService interface {
}

type FamiliesRepository interface {
}

type FamiliesService interface {
}

type NeighbourhoodsRepository interface {
	Create(context.Context, *Neighbourhood) (string, error)
	FindByID(context.Context, string) (*Neighbourhood, error)
}

type NeighbourhoodsService interface {
	Create(context.Context, *NeighbourhoodRequest) (string, error)
	GetNeighbourhood(context.Context, string) (*NeighbourhoodResponse, error)
}
