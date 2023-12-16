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

type paymentsRepository struct {
	CDB *mongo.Collection
}

func NewPaymentsRepository(CDB *mongo.Client) *paymentsRepository {
	return &paymentsRepository{
		CDB: CDB.Database("center-mosq").Collection("payments"),
	}
}

func (r *paymentsRepository) Create(ctx context.Context, n *models.Payments) (string, error) {
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

func (r *paymentsRepository) FindByID(ctx context.Context, id string) (*models.Payments, error) {
	payment := &models.Payments{}
	err := r.CDB.FindOne(ctx, bson.M{"id": id}).Decode(payment)
	if err != nil {
		log.Printf("failed to get payment: %v\n", err)
		return nil, errors.New("payment not found")
	}
	return payment, nil
}

func (r *paymentsRepository) FindAll(ctx context.Context) ([]*models.Payments, error) {
	cur, err := r.CDB.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	defer cur.Close(ctx)

	var payments []*models.Payments
	if err := cur.All(ctx, &payments); err != nil {
		return nil, err
	}

	return payments, nil
}

func (r *paymentsRepository) Update(ctx context.Context, id string, n *models.Payments) error {
	rez, err := r.CDB.UpdateOne(ctx, bson.M{"id": id}, bson.M{"$set": n})
	if err != nil {
		log.Printf("failed to update payment: %v\n", err)
		return err
	}

	if rez.MatchedCount == 0 {
		log.Printf("failed to update payment: %v\n", err)
		return errors.New("payment not found")
	}

	if rez.ModifiedCount == 0 {
		log.Printf("failed to update payment: %v\n", err)
		return errors.New("payment not modified")
	}

	return nil
}

func (r *paymentsRepository) Delete(ctx context.Context, id string) error {
	// Delete the family
	rez, err := r.CDB.DeleteOne(ctx, bson.M{"id": id})
	if err != nil {
		log.Printf("failed to delete payment: %v\n", err)
		return err
	}

	if rez.DeletedCount == 0 {
		log.Printf("failed to delete payment: %v\n", err)
		return errors.New("payment not found")
	}

	return nil
}

func (r *paymentsRepository) NoPayment(ctx context.Context, year int) ([]*models.Families, error) {
	pipeline := []bson.M{
		{
			"$lookup": bson.M{
				"from":         "payments",
				"localField":   "id",
				"foreignField": "familyid",
				"as":           "payments",
			},
		},
		{
			"$match": bson.M{
				"payments": bson.M{
					"$not": bson.M{
						"$elemMatch": bson.M{
							"year": year,
						},
					},
				},
			},
		},
	}

	// Create an aggregation cursor
	cur, err := r.CDB.Database().Collection("families").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var families []*models.Families
	if err := cur.All(ctx, &families); err != nil {
		return nil, err
	}

	return families, nil
}

func (r *paymentsRepository) FindByFamilyID(ctx context.Context, familyID string) ([]*models.Payments, error) {
	cur, err := r.CDB.Find(ctx, bson.M{"familyid": familyID})
	if err != nil {
		return nil, err
	}

	defer cur.Close(ctx)

	var payments []*models.Payments
	if err := cur.All(ctx, &payments); err != nil {
		return nil, err
	}

	return payments, nil
}

func (r *paymentsRepository) FindByYear(ctx context.Context, year int) ([]*models.Payments, error) {
	cur, err := r.CDB.Find(ctx, bson.M{"year": year})
	if err != nil {
		return nil, err
	}

	defer cur.Close(ctx)

	var payments []*models.Payments
	if err := cur.All(ctx, &payments); err != nil {
		return nil, err
	}

	return payments, nil
}
