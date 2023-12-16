package services

import (
	"context"
	"fmt"
	"log"

	"github.com/sadrishehu/mosq-center/internal/integration/pdf"
	"github.com/sadrishehu/mosq-center/internal/models"
)

type InvoicesRepository interface {
	NoPayment(context.Context, int) ([]*models.Families, error)
}

type invoicesService struct {
	InvoicesRepository InvoicesRepository
}

func NewInvoicesService(invoicesRepository InvoicesRepository) *invoicesService {
	return &invoicesService{
		InvoicesRepository: invoicesRepository,
	}
}

func (s *invoicesService) GenerateInvoices(ctx context.Context, year int) ([]byte, error) {
	families, err := s.InvoicesRepository.NoPayment(ctx, year)
	if err != nil {
		return nil, err
	}

	if len(families) == 0 {
		log.Printf("no unpaid bills for families found for year %d\n", year)
		return nil, nil
	}

	bytes, err := generatePDFInvoice(families, year)
	if err != nil {
		return nil, err
	}

	return bytes, nil
}

func generatePDFInvoice(family []*models.Families, year int) ([]byte, error) {
	var invoices []*pdf.Invoice
	for _, f := range family {
		invoices = append(invoices, &pdf.Invoice{
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
