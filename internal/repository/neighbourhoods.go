package repository

import (
	"context"

	"github.com/sadrishehu/mosq-center/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type neighbourhoodsRepository struct {
	CDB *mongo.Collection
}

func NewNeighbourhoodsRepository(CDB *mongo.Client) *neighbourhoodsRepository {
	return &neighbourhoodsRepository{
		CDB: CDB.Database("center-mosq").Collection("neighbourhoods"),
	}
}

func (r *neighbourhoodsRepository) Create(ctx context.Context, n *models.Neighbourhood) (string, error) {
	doc, err := bson.Marshal(n)
	if err != nil {
		return "", err
	}

	rez, err := r.CDB.InsertOne(ctx, doc)
	if err != nil {
		return "", err
	}

	return rez.InsertedID.(primitive.ObjectID).Hex(), nil
}

func (r *neighbourhoodsRepository) FindByID(ctx context.Context, id string) (*models.Neighbourhood, error) {
	// TODO: implement this method
	return nil, nil
}
