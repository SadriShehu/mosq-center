package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sadrishehu/mosq-center/internal/integration/prayers"
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
		Regions:        models.Regions,
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

	year := req.URL.Query().Get("s_year")
	if year == "" {
		year = fmt.Sprintf("%d", time.Now().Year())
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	familyID := req.URL.Query().Get("s_family_id")
	if familyID != "" {
		_, err := uuid.Parse(familyID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	p, err := h.PaymentsService.GetPaymentsByYear(ctx, yearInt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if familyID != "" {
		p, err = h.PaymentsService.GetPaymentsByFamily(ctx, familyID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
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
	ctx := req.Context()

	prayers, err := h.prayerTimes(ctx)
	if err != nil {
		log.Printf("failed to get prayers: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to get prayers: %v\n", err)))
		return
	}

	p := templates.PublikeParams{
		Prayers: prayers,
	}
	templates.Publike(w, p, partial(req))
}

func (h *handler) User(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

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

	prayers, err := h.prayerTimes(ctx)
	if err != nil {
		log.Printf("failed to get prayers: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to get prayers: %v\n", err)))
		return
	}

	p := templates.PerdoruesiParams{
		Picture: picture,
		Name:    name,
		Prayers: prayers,
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

	neighbourhoodID := req.URL.Query().Get("s_neighbourhood_id")
	if neighbourhoodID != "" {
		_, err := uuid.Parse(neighbourhoodID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	f, err := h.PaymentsService.NoPayment(ctx, yearInt, neighbourhoodID)
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

	neighbourhoods, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	paymentsParams := templates.PagesatPakryeraParams{
		Families:       families,
		Neighbourhoods: neighbourhoods,
	}
	templates.PagesatPakryera(w, paymentsParams, partial(req))
}

func partial(r *http.Request) string {
	return r.URL.Query().Get("partial")
}

func (h *handler) prayerTimes(ctx context.Context) (*prayers.Timings, error) {
	dateInt := time.Now().Day()
	monthInt := int(time.Now().Month())
	yearInt := time.Now().Year()

	prayers, err := h.PrayersService.GetPrayers(ctx, dateInt, monthInt, yearInt)
	if err != nil {
		return nil, err
	}

	return prayers, nil
}
