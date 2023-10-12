package repository

import "go.mongodb.org/mongo-driver/mongo"

type paymentsRepository struct {
	CDB *mongo.Client
}

func NewPaymentsRepository(CDB *mongo.Client) *paymentsRepository {
	return &paymentsRepository{
		CDB: CDB,
	}
}
