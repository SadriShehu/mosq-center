package services

type FamiliesRepository interface {
}

type familiesService struct {
	FamiliesRepository FamiliesRepository
}

func NewFamiliesService(FamiliesRepository FamiliesRepository) *familiesService {
	return &familiesService{
		FamiliesRepository: FamiliesRepository,
	}
}
