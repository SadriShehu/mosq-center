package handlers

import (
	"net/http"

	"github.com/sadrishehu/mosq-center/internal/models"
	"github.com/sadrishehu/mosq-center/internal/templates"
)

func (h *handler) Lagjet(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	n, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	p := templates.LagjetParams{
		Neighbourhoods: n,
	}
	templates.Lagjet(w, p, partial(req))
}

func (h *handler) Familjet(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	f, err := h.FamiliesService.GetAllFamilies(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var families []*models.FamiliesTemplate
	for _, family := range f {
		familyTemplate := &models.FamiliesTemplate{}
		familyTemplate.Family = family

		n, err := h.NeighbourhoodsService.GetNeighbourhood(ctx, family.NeighbourhoodID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		familyTemplate.Neighbourhood = n.Name

		families = append(families, familyTemplate)
	}

	p := templates.FamiljetParams{
		Families: families,
	}
	templates.Familjet(w, p, partial(req))
}

func partial(r *http.Request) string {
	return r.URL.Query().Get("partial")
}
