package services

import (
	"context"
	"log"
	"time"

	"github.com/sadrishehu/mosq-center/internal/models"
)

type PaymentsRepository interface {
	Create(context.Context, *models.Payments) (string, error)
	FindByID(context.Context, string) (*models.Payments, error)
	FindAll(context.Context) ([]*models.Payments, error)
	Update(context.Context, string, *models.Payments) error
	Delete(context.Context, string) error
	NoPayment(context.Context, int) ([]*models.Families, error)
}

type paymentsService struct {
	PaymentsRepository PaymentsRepository
}

func NewPaymentsService(paymentsRepository PaymentsRepository) *paymentsService {
	return &paymentsService{
		PaymentsRepository: paymentsRepository,
	}
}

func (s *paymentsService) Create(ctx context.Context, body *models.PaymentsRequest) (string, error) {
	payment := &models.Payments{}
	payment.Hydrate(body)

	id, err := s.PaymentsRepository.Create(ctx, payment)
	if err != nil {
		log.Printf("failed to create payment: %v\n", err)
		return "", err
	}

	log.Printf("payment created successfully with interal id: %s\n", id)

	return payment.ID, nil
}

func (s *paymentsService) GetPayments(ctx context.Context, id string) (*models.PaymentsResponse, error) {
	payment, err := s.PaymentsRepository.FindByID(ctx, id)
	if err != nil {
		log.Printf("failed to get payment: %v\n", err)
		return nil, err
	}

	log.Printf("payment retrieved successfully with interal id: %s\n", id)
	paymentsResponse := &models.PaymentsResponse{}
	paymentsResponse.MapResponse(payment)

	return paymentsResponse, nil
}

func (s *paymentsService) GetAllPayments(ctx context.Context) ([]*models.PaymentsResponse, error) {
	payments, err := s.PaymentsRepository.FindAll(ctx)
	if err != nil {
		log.Printf("failed to get payments: %v\n", err)
		return nil, err
	}

	var n []*models.PaymentsResponse
	for _, payment := range payments {
		nm := &models.PaymentsResponse{}
		nm.MapResponse(payment)
		n = append(n, nm)
	}

	return n, nil
}

func (s *paymentsService) Update(ctx context.Context, id string, body *models.PaymentsRequest) error {
	payment, err := s.PaymentsRepository.FindByID(ctx, id)
	if err != nil {
		log.Printf("failed to get payment: %v\n", err)
		return err
	}

	payment.FamilyID = body.FamilyID
	payment.Amount = body.Amount
	payment.Year = body.Year
	payment.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	err = s.PaymentsRepository.Update(ctx, id, payment)
	if err != nil {
		log.Printf("failed to update payment: %v\n", err)
		return err
	}

	return nil
}

func (s *paymentsService) Delete(ctx context.Context, id string) error {
	err := s.PaymentsRepository.Delete(ctx, id)
	if err != nil {
		log.Printf("failed to delete payment: %v\n", err)
		return err
	}

	return nil
}

func (s *paymentsService) NoPayment(ctx context.Context, year int) ([]*models.FamiliesResponse, error) {
	families, err := s.PaymentsRepository.NoPayment(ctx, year)
	if err != nil {
		log.Printf("failed to get families: %v\n", err)
		return nil, err
	}

	var fr []*models.FamiliesResponse
	for _, family := range families {
		nm := &models.FamiliesResponse{}
		nm.MapResponse(family)
		fr = append(fr, nm)
	}

	return fr, nil
}
