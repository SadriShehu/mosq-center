package repository

import "go.mongodb.org/mongo-driver/mongo"

type neighbourhoodsRepository struct {
	CDB *mongo.Client
}

func NewNeighbourhoodsRepository(CDB *mongo.Client) *neighbourhoodsRepository {
	return &neighbourhoodsRepository{
		CDB: CDB,
	}
}
