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
	FindAll(context.Context) ([]*models.Families, error)
	Update(context.Context, string, *models.Families) error
}

type FamiliesService struct {
	FamiliesRepository FamiliesRepository
}

func NewFamiliesService(FamiliesRepository FamiliesRepository) *FamiliesService {
	return &FamiliesService{
		FamiliesRepository: FamiliesRepository,
	}
}

func (s *FamiliesService) Create(ctx context.Context, body *models.FamiliesRequest) (string, error) {
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

func (s *FamiliesService) GetFamilies(ctx context.Context, id string) (*models.FamiliesResponse, error) {
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

func (s *FamiliesService) GetAllFamilies(ctx context.Context) ([]*models.FamiliesResponse, error) {
	families, err := s.FamiliesRepository.FindAll(ctx)
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

func (s *FamiliesService) Update(ctx context.Context, id string, body *models.FamiliesRequest) error {
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
