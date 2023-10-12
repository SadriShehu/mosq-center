package services

import (
	"github.com/sadrishehu/mosq-center/internal/models"
)

type paymentsService struct {
	PaymentsRepository models.PaymentsRepository
}

func NewPaymentsService(PaymentsRepository models.PaymentsRepository) *paymentsService {
	return &paymentsService{
		PaymentsRepository: PaymentsRepository,
	}
}
