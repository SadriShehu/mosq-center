package services

import (
	"testing"

	"github.com/sadrishehu/mosq-center/internal/models"
)

var (
	testNeighs = []*models.NeighbourhoodResponse{{ID: "n1", Name: "Lagja 1"}}
	testFams   = []*models.FamiliesResponse{
		{ID: "f1", Name: "A", Middlename: "B", Surname: "C", Members: 4, NeighbourhoodID: "n1"},
		{ID: "f2", Name: "D", Surname: "E", Members: 2, NeighbourhoodID: "missing"},
	}
)

func TestJoinPayments(t *testing.T) {
	tests := []struct {
		name                  string
		payment               *models.PaymentsResponse
		wantFamily, wantNeigh string
		wantMembers           int
	}{
		{"full", &models.PaymentsResponse{ID: "p", FamilyID: "f1"}, "A B C", "Lagja 1", 4},
		{"missing neighbourhood", &models.PaymentsResponse{ID: "p", FamilyID: "f2"}, "D  E", "", 2},
		{"missing family", &models.PaymentsResponse{ID: "p", FamilyID: "nope"}, "", "", 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := JoinPayments([]*models.PaymentsResponse{tt.payment}, testFams, testNeighs)
			if len(got) != 1 {
				t.Fatalf("len = %d", len(got))
			}
			g := got[0]
			if g.FamilyName != tt.wantFamily || g.NeighbourhoodName != tt.wantNeigh || g.Members != tt.wantMembers {
				t.Errorf("got %+v", g)
			}
			if g.FamilyID != tt.payment.FamilyID {
				t.Errorf("family id lost")
			}
		})
	}
	if got := JoinPayments(nil, nil, nil); got == nil || len(got) != 0 {
		t.Errorf("want empty non-nil slice, got %v", got)
	}
}

func TestJoinFamilies(t *testing.T) {
	got := JoinFamilies(testFams, testNeighs)
	if len(got) != 2 || got[0].NeighbourhoodName != "Lagja 1" || got[1].NeighbourhoodName != "" || got[0].ID != "f1" {
		t.Errorf("got %+v %+v", got[0], got[1])
	}
	if got := JoinFamilies(nil, nil); got == nil || len(got) != 0 {
		t.Errorf("want empty non-nil slice")
	}
}
