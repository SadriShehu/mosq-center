package repository

import "go.mongodb.org/mongo-driver/mongo"

type familiesRepository struct {
	CDB *mongo.Client
}

func NewFamiliesRepository(CDB *mongo.Client) *familiesRepository {
	return &familiesRepository{
		CDB: CDB,
	}
}