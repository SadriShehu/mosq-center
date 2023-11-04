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
	for cur.Next(ctx) {
		payment := &models.Payments{}
		err := cur.Decode(payment)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	if cur.Err() != nil {
		log.Printf("failed to get payments: %v\n", cur.Err())
		return nil, cur.Err()
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
	cur, err := r.CDB.Aggregate(ctx, mongo.Pipeline{
		bson.D{
			{Key: "$lookup", Value: bson.D{
				{Key: "from", Value: "payments"},
				{Key: "localField", Value: "id"},
				{Key: "foreignField", Value: "familyid"},
				{Key: "as", Value: "payments"},
			}},
		},
		bson.D{
			{Key: "$match", Value: bson.D{
				{Key: "payments.year", Value: bson.D{
					{Key: "$ne", Value: year},
				}},
			}},
		},
	})
	if err != nil {
		return nil, err
	}

	defer cur.Close(ctx)

	var families []*models.Families
	for cur.Next(ctx) {
		family := &models.Families{}
		err := cur.Decode(family)
		if err != nil {
			return nil, err
		}
		families = append(families, family)
	}

	if cur.Err() != nil {
		log.Printf("failed to get families: %v\n", cur.Err())
		return nil, cur.Err()
	}

	return families, nil
}
