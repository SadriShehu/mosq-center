package services

import (
	"strings"

	"github.com/sadrishehu/mosq-center/internal/models"
)

// JoinPayments enriches payments with family and neighbourhood data.
// A payment whose family or neighbourhood is missing gets empty names.
func JoinPayments(
	payments []*models.PaymentsResponse,
	families []*models.FamiliesResponse,
	neighbourhoods []*models.NeighbourhoodResponse,
) []*models.PaymentsTemplate {
	familyByID := make(map[string]*models.FamiliesResponse, len(families))
	for _, f := range families {
		familyByID[f.ID] = f
	}
	neighByID := make(map[string]*models.NeighbourhoodResponse, len(neighbourhoods))
	for _, n := range neighbourhoods {
		neighByID[n.ID] = n
	}

	out := make([]*models.PaymentsTemplate, 0, len(payments))
	for _, p := range payments {
		var familyName, neighName string
		var members int

		if fam, ok := familyByID[p.FamilyID]; ok && fam != nil {
			familyName = fullName(fam.Name, fam.Middlename, fam.Surname)
			members = fam.Members
			if n, ok := neighByID[fam.NeighbourhoodID]; ok && n != nil {
				neighName = n.Name
			}
		}

		t := &models.PaymentsTemplate{}
		t.MapTemplate(p, p.FamilyID, familyName, members, neighName)
		out = append(out, t)
	}

	return out
}

// JoinFamilies adds the neighbourhood name to every family.
func JoinFamilies(
	families []*models.FamiliesResponse,
	neighbourhoods []*models.NeighbourhoodResponse,
) []*models.FamiliesDetails {
	neighByID := make(map[string]*models.NeighbourhoodResponse, len(neighbourhoods))
	for _, n := range neighbourhoods {
		neighByID[n.ID] = n
	}

	out := make([]*models.FamiliesDetails, 0, len(families))
	for _, f := range families {
		d := &models.FamiliesDetails{FamiliesResponse: *f}
		if n, ok := neighByID[f.NeighbourhoodID]; ok && n != nil {
			d.NeighbourhoodName = n.Name
		}
		out = append(out, d)
	}

	return out
}

// fullName joins the non-empty parts with single spaces.
func fullName(parts ...string) string {
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return strings.Join(out, " ")
}
