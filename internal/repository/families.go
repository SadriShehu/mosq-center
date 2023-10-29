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

type familiesRepository struct {
	CDB *mongo.Collection
}

func NewFamiliesRepository(CDB *mongo.Client) *familiesRepository {
	return &familiesRepository{
		CDB: CDB.Database("center-mosq").Collection("families"),
	}
}

func (r *familiesRepository) Create(ctx context.Context, n *models.Families) (string, error) {
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

func (r *familiesRepository) FindByID(ctx context.Context, id string) (*models.Families, error) {
	familie := &models.Families{}
	err := r.CDB.FindOne(ctx, bson.M{"id": id}).Decode(familie)
	if err != nil {
		log.Printf("failed to get familie: %v\n", err)
		return nil, errors.New("familie not found")
	}
	return familie, nil
}

func (r *familiesRepository) FindAll(ctx context.Context) ([]*models.Families, error) {
	cur, err := r.CDB.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	defer cur.Close(ctx)

	var families []*models.Families
	for cur.Next(ctx) {
		familie := &models.Families{}
		err := cur.Decode(familie)
		if err != nil {
			return nil, err
		}
		families = append(families, familie)
	}

	if cur.Err() != nil {
		log.Printf("failed to get families: %v\n", cur.Err())
		return nil, cur.Err()
	}

	return families, nil
}

func (r *familiesRepository) Update(ctx context.Context, id string, n *models.Families) error {
	rez, err := r.CDB.UpdateOne(ctx, bson.M{"id": id}, bson.M{"$set": n})
	if err != nil {
		log.Printf("failed to update familie: %v\n", err)
		return err
	}

	if rez.MatchedCount == 0 {
		log.Printf("failed to update familie: %v\n", err)
		return errors.New("familie not found")
	}

	if rez.ModifiedCount == 0 {
		log.Printf("failed to update familie: %v\n", err)
		return errors.New("familie not modified")
	}

	return nil
}
