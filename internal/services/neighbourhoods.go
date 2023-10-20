package services

import (
	"context"
	"log"
	"time"

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
	neighbourhood := &models.Neighbourhood{}
	neighbourhood.Hydrate(body)

	id, err := s.NeighbourhoodsRepository.Create(ctx, neighbourhood)
	if err != nil {
		log.Printf("failed to create neighbourhood: %v\n", err)
		return "", err
	}

	log.Printf("neighbourhood created successfully with interal id: %s\n", id)

	return neighbourhood.ID, nil
}

func (s *neighbourhoodsService) GetNeighbourhood(ctx context.Context, id string) (*models.NeighbourhoodResponse, error) {
	neighbourhood, err := s.NeighbourhoodsRepository.FindByID(ctx, id)
	if err != nil {
		log.Printf("failed to get neighbourhood: %v\n", err)
		return nil, err
	}

	log.Printf("neighbourhood retrieved successfully with interal id: %s\n", id)
	neighbourhoodResponse := &models.NeighbourhoodResponse{}
	neighbourhoodResponse.MapResponse(neighbourhood)

	return neighbourhoodResponse, nil
}

func (s *neighbourhoodsService) GetAllNeighbourhoods(ctx context.Context) ([]*models.NeighbourhoodResponse, error) {
	neighbourhoods, err := s.NeighbourhoodsRepository.FindAll(ctx)
	if err != nil {
		log.Printf("failed to get neighbourhoods: %v\n", err)
		return nil, err
	}

	var n []*models.NeighbourhoodResponse
	for _, neighbourhood := range neighbourhoods {
		nm := &models.NeighbourhoodResponse{}
		nm.MapResponse(neighbourhood)
		n = append(n, nm)
	}

	return n, nil
}

func (s *neighbourhoodsService) Update(ctx context.Context, id string, body *models.NeighbourhoodRequest) error {
	neighbourhood, err := s.NeighbourhoodsRepository.FindByID(ctx, id)
	if err != nil {
		log.Printf("failed to get neighbourhood: %v\n", err)
		return err
	}

	neighbourhood.Name = body.Name
	neighbourhood.Region = body.Region
	neighbourhood.Country = body.Country
	neighbourhood.PostalCode = body.PostalCode
	neighbourhood.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	err = s.NeighbourhoodsRepository.Update(ctx, id, neighbourhood)
	if err != nil {
		log.Printf("failed to update neighbourhood: %v\n", err)
		return err
	}

	return nil
}
