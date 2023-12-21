package services

import (
	"context"
	"errors"

	"github.com/sadrishehu/mosq-center/internal/integration/prayers"
)

type PrayersClient interface {
	GetPrayers(int, int) (*prayers.Prayers, error)
	SetTune(*prayers.Tune)
}

type prayersService struct {
	PrayersClient PrayersClient
}

func NewPrayersService(prayersClient PrayersClient) *prayersService {
	return &prayersService{
		PrayersClient: prayersClient,
	}
}

func (s *prayersService) GetPrayers(ctx context.Context, date, month, year int) (*prayers.Timings, error) {
	prayers, err := s.PrayersClient.GetPrayers(month, year)
	if err != nil {
		return nil, err
	}

	if prayers.Code != 200 {
		return nil, err
	}

	if prayers.Data[date-1].Date.Gregorian.Day != "" {
		timings := prayers.Data[date-1].Timings
		return &timings, nil
	}

	return nil, errors.New("no prayers found for the given date")
}
