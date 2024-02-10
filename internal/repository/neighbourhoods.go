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

func NewNeighbourhoodsRepository(CDB *mongo.Client, collection string) *neighbourhoodsRepository {
	return &neighbourhoodsRepository{
		CDB: CDB.Database(collection).Collection("neighbourhoods"),
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

	defer cur.Close(ctx)

	var neighbourhoods []*models.Neighbourhood
	if err := cur.All(ctx, &neighbourhoods); err != nil {
		return nil, err
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

func (r *neighbourhoodsRepository) Delete(ctx context.Context, id string) error {
	// find all families in neighbourhood
	families, err := r.CDB.Database().Collection("families").Find(ctx, bson.M{"neighbourhoodid": id})
	if err != nil {
		log.Printf("failed to delete neighbourhood: %v\n", err)
		return err
	}
	defer families.Close(ctx)

	// delete all families and payments in neighbourhood
	for families.Next(ctx) {
		family := &models.Families{}
		if err := families.Decode(family); err != nil {
			log.Printf("failed to delete neighbourhood: %v\n", err)
			return err
		}

		log.Printf("found family to be deleted with neighbourhood %s\n", family.ID)

		// delete all payments in family
		_, err := r.CDB.Database().Collection("payments").DeleteMany(ctx, bson.M{"familyid": family.ID})
		if err != nil {
			log.Printf("failed to delete neighbourhood: %v\n", err)
			return err
		}

		log.Printf("deleted payments for family %s\n", family.ID)

		// delete family
		_, err = r.CDB.Database().Collection("families").DeleteOne(ctx, bson.M{"id": family.ID})
		if err != nil {
			log.Printf("failed to delete neighbourhood: %v\n", err)
			return err
		}

		log.Printf("deleted family %s\n", family.ID)
	}

	rez, err := r.CDB.DeleteOne(ctx, bson.M{"id": id})
	if err != nil {
		log.Printf("failed to delete neighbourhood: %v\n", err)
		return err
	}

	if rez.DeletedCount == 0 {
		log.Printf("failed to delete neighbourhood: %v\n", err)
		return errors.New("neighbourhood not found")
	}

	return nil
}
