package services

import (
	"github.com/sadrishehu/mosq-center/internal/models"
)

type familiesService struct {
	FamiliesRepository models.FamiliesRepository
}

func NewFamiliesService(FamiliesRepository models.FamiliesRepository) *familiesService {
	return &familiesService{
		FamiliesRepository: FamiliesRepository,
	}
}
