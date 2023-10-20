package services

type PaymentsRepository interface {
}

type paymentsService struct {
	PaymentsRepository PaymentsRepository
}

func NewPaymentsService(PaymentsRepository PaymentsRepository) *paymentsService {
	return &paymentsService{
		PaymentsRepository: PaymentsRepository,
	}
}
