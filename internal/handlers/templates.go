package handlers

import (
	"fmt"
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

	n, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx)
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
		Families:       families,
		Neighbourhoods: n,
	}
	templates.Familjet(w, p, partial(req))
}

func (h *handler) Pagesat(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	p, err := h.PaymentsService.GetAllPayments(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	f, err := h.FamiliesService.GetAllFamilies(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var payments []*models.PaymentsTemplate
	for _, payment := range p {
		paymentTemplate := &models.PaymentsTemplate{}

		f, err := h.FamiliesService.GetFamily(ctx, payment.FamilyID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		n, err := h.NeighbourhoodsService.GetNeighbourhood(ctx, f.NeighbourhoodID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		familyName := fmt.Sprintf("%s %s %s", f.Name, f.Middlename, f.Surname)
		paymentTemplate.MapTemplate(payment, familyName, f.Members, n.Name)

		payments = append(payments, paymentTemplate)
	}

	paymentsParams := templates.PagesatParams{
		Payments: payments,
		Families: f,
	}
	templates.Pagesat(w, paymentsParams, partial(req))
}

func partial(r *http.Request) string {
	return r.URL.Query().Get("partial")
}
