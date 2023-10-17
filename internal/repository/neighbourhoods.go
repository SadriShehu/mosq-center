package repository

import (
	"context"
	"errors"
	"log"

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
	neighbourhood := &models.Neighbourhood{}
	err := r.CDB.FindOne(ctx, bson.M{"id": id}).Decode(neighbourhood)
	if err != nil {
		log.Printf("failed to get neighbourhood: %v\n", err)
		return nil, errors.New("neighbourhood not found")
	}
	return neighbourhood, nil
}

func (r *neighbourhoodsRepository) FindAll(ctx context.Context) ([]*models.Neighbourhood, error) {
	cur, err := r.CDB.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	var neighbourhoods []*models.Neighbourhood
	for cur.Next(ctx) {
		neighbourhood := &models.Neighbourhood{}
		err := cur.Decode(neighbourhood)
		if err != nil {
			return nil, err
		}
		neighbourhoods = append(neighbourhoods, neighbourhood)
	}

	return neighbourhoods, nil
}

func (r *neighbourhoodsRepository) Update(ctx context.Context, id string, n *models.Neighbourhood) error {
	rez, err := r.CDB.UpdateOne(ctx, bson.M{"id": id}, bson.M{"$set": n})
	if err != nil {
		log.Printf("failed to update neighbourhood: %v\n", err)
		return err
	}

	if rez.MatchedCount == 0 {
		log.Printf("failed to update neighbourhood: %v\n", err)
		return errors.New("neighbourhood not found")
	}

	if rez.ModifiedCount == 0 {
		log.Printf("failed to update neighbourhood: %v\n", err)
		return errors.New("neighbourhood not modified")
	}

	return nil
}
