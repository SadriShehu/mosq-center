package services

import (
	"context"
	"fmt"
	"log"

	"github.com/sadrishehu/mosq-center/internal/integration/pdf"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type Invoices interface {
	NoPayment(context.Context, int, string) ([]*models.Families, error)
}

type Neighborhoods interface {
	FindByID(ctx context.Context, id string) (*models.Neighbourhood, error)
}

type invoicesService struct {
	InvoicesRepository      Invoices
	NeighborhoodsRepository Neighborhoods
}

func NewInvoicesService(invoicesRepository Invoices, neighbourhoodsRepository Neighborhoods) *invoicesService {
	return &invoicesService{
		InvoicesRepository:      invoicesRepository,
		NeighborhoodsRepository: neighbourhoodsRepository,
	}
}

func (s *invoicesService) GenerateInvoices(ctx context.Context, year int, neighbourhoodID string) ([]byte, error) {
	families, err := s.InvoicesRepository.NoPayment(ctx, year, neighbourhoodID)
	if err != nil {
		return nil, err
	}

	if len(families) == 0 {
		log.Printf("no unpaid bills for families found for year %d\n", year)
		return nil, nil
	}

	bytes, err := s.generatePDFInvoice(ctx, families, year)
	if err != nil {
		return nil, err
	}

	return bytes, nil
}

func (s *invoicesService) generatePDFInvoice(ctx context.Context, family []*models.Families, year int) ([]byte, error) {
	var invoices []*pdf.Invoice
	for _, f := range family {
		neighbourhood, err := s.NeighborhoodsRepository.FindByID(ctx, f.NeighbourhoodID)
		if err != nil {
			return nil, fmt.Errorf("failed to get neighbourhood: %w", err)
		}

		invoices = append(invoices, &pdf.Invoice{
			Neighborhood:  neighbourhood.Name,
			FamilyName:    fmt.Sprintf("%s %s %s", f.Name, f.Middlename, f.Surname),
			FamilyMembers: f.Members,
			Amount:        f.Members * 3,
			Year:          year,
		})
	}

	bytes, err := pdf.NewInvoice(invoices)
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF invoice for year %d: %w", year, err)
	}

	return bytes, nil
}
