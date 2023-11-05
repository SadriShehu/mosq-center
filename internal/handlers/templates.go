package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

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
		paymentTemplate.MapTemplate(payment, f.ID, familyName, f.Members, n.Name)

		payments = append(payments, paymentTemplate)
	}

	paymentsParams := templates.PagesatParams{
		Payments: payments,
		Families: f,
	}
	templates.Pagesat(w, paymentsParams, partial(req))
}

func (h *handler) Publike(w http.ResponseWriter, req *http.Request) {
	p := templates.PublikeParams{}
	templates.Publike(w, p, partial(req))
}

func (h *handler) User(w http.ResponseWriter, req *http.Request) {
	store, err := h.SessionStore.Get(req, "auth-store")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var name, picture string
	if h.AuthConfig.Enable {
		profile := store.Values["profile"]
		name = profile.(map[string]interface{})["name"].(string)
		picture = profile.(map[string]interface{})["picture"].(string)
	}

	p := templates.PerdoruesiParams{
		Picture: picture,
		Name:    name,
	}
	templates.Perdoruesi(w, p, partial(req))
}

func (h *handler) PagesatPakryera(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	year := req.URL.Query().Get("year")
	if year == "" {
		year = fmt.Sprintf("%d", time.Now().Year())
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	f, err := h.PaymentsService.NoPayment(ctx, yearInt)
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

	paymentsParams := templates.PagesatPakryeraParams{
		Families: families,
	}
	templates.PagesatPakryera(w, paymentsParams, partial(req))
}

func partial(r *http.Request) string {
	return r.URL.Query().Get("partial")
}
