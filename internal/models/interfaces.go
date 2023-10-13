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
}

type NeighbourhoodsService interface {
	Create(context.Context, *NeighbourhoodRequest) (string, error)
}
