package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type neighbourhoodsService struct {
	NeighbourhoodsRepository models.NeighbourhoodsRepository
}

func NewNeighbourhoodsRepository(NeighbourhoodsRepository models.NeighbourhoodsRepository) *neighbourhoodsService {
	return &neighbourhoodsService{
		NeighbourhoodsRepository: NeighbourhoodsRepository,
	}
}

func (s *neighbourhoodsService) Create(ctx context.Context, body *models.NeighbourhoodRequest) (string, error) {
	// implement business logic here
	return uuid.NewString(), nil
}
