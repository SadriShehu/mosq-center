package services

import (
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
