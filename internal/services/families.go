package services

import (
	"context"
	"log"
	"time"

	"github.com/sadrishehu/mosq-center/internal/models"
)

type FamiliesRepository interface {
	Create(context.Context, *models.Families) (string, error)
	FindByID(context.Context, string) (*models.Families, error)
	FindAll(context.Context, int64, int64) ([]*models.Families, error)
	Update(context.Context, string, *models.Families) error
	Delete(context.Context, string) error
}

type familiesService struct {
	FamiliesRepository FamiliesRepository
}

func NewFamiliesService(familiesRepository FamiliesRepository) *familiesService {
	return &familiesService{
		FamiliesRepository: familiesRepository,
	}
}

func (s *familiesService) Create(ctx context.Context, body *models.FamiliesRequest) (string, error) {
	familie := &models.Families{}
	familie.Hydrate(body)

	id, err := s.FamiliesRepository.Create(ctx, familie)
	if err != nil {
		log.Printf("failed to create familie: %v\n", err)
		return "", err
	}

	log.Printf("familie created successfully with interal id: %s\n", id)

	return familie.ID, nil
}

func (s *familiesService) GetFamily(ctx context.Context, id string) (*models.FamiliesResponse, error) {
	familie, err := s.FamiliesRepository.FindByID(ctx, id)
	if err != nil {
		log.Printf("failed to get familie: %v\n", err)
		return nil, err
	}

	log.Printf("familie retrieved successfully with interal id: %s\n", id)
	familiesResponse := &models.FamiliesResponse{}
	familiesResponse.MapResponse(familie)

	return familiesResponse, nil
}

func (s *familiesService) GetAllFamilies(ctx context.Context, limit, skip int64) ([]*models.FamiliesResponse, error) {
	families, err := s.FamiliesRepository.FindAll(ctx, limit, skip)
	if err != nil {
		log.Printf("failed to get families: %v\n", err)
		return nil, err
	}

	var n []*models.FamiliesResponse
	for _, familie := range families {
		nm := &models.FamiliesResponse{}
		nm.MapResponse(familie)
		n = append(n, nm)
	}

	return n, nil
}

func (s *familiesService) Update(ctx context.Context, id string, body *models.FamiliesRequest) error {
	familie, err := s.FamiliesRepository.FindByID(ctx, id)
	if err != nil {
		log.Printf("failed to get familie: %v\n", err)
		return err
	}

	familie.Name = body.Name
	familie.Middlename = body.Middlename
	familie.Surname = body.Surname
	familie.Members = body.Members
	familie.NeighbourhoodID = body.NeighbourhoodID
	familie.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	err = s.FamiliesRepository.Update(ctx, id, familie)
	if err != nil {
		log.Printf("failed to update familie: %v\n", err)
		return err
	}

	return nil
}

func (s *familiesService) Delete(ctx context.Context, id string) error {
	err := s.FamiliesRepository.Delete(ctx, id)
	if err != nil {
		log.Printf("failed to delete familie: %v\n", err)
		return err
	}

	return nil
}
