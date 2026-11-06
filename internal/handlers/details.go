package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/render"
	"github.com/google/uuid"
	"github.com/sadrishehu/mosq-center/internal/models"
	"github.com/sadrishehu/mosq-center/internal/services"
)

func apiError(w http.ResponseWriter, req *http.Request, status int, msg string) {
	render.Status(req, status)
	render.JSON(w, req, map[string]string{"error": msg})
}

// Me returns the profile of the signed-in user.
func (h *handler) Me(w http.ResponseWriter, req *http.Request) {
	profile := models.Profile{Name: "Dev"}

	if h.AuthConfig.Enable {
		store, err := h.SessionStore.Get(req, "auth-store")
		if err != nil {
			apiError(w, req, http.StatusUnauthorized, "unauthorized")
			return
		}
		p, ok := store.Values["profile"].(models.Profile)
		if !ok {
			apiError(w, req, http.StatusUnauthorized, "unauthorized")
			return
		}
		profile = p
	}

	render.JSON(w, req, map[string]string{
		"name":    profile.Name,
		"email":   profile.Email,
		"picture": profile.Picture,
	})
}

func (h *handler) GetRegions(w http.ResponseWriter, req *http.Request) {
	render.JSON(w, req, models.Regions)
}

func (h *handler) GetFamiliesDetails(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	f, err := h.FamiliesService.GetAllFamilies(ctx)
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}
	n, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx)
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}

	render.JSON(w, req, services.JoinFamilies(f, n))
}

func (h *handler) GetPaymentsDetails(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	yearInt := time.Now().Year()
	if year := req.URL.Query().Get("year"); year != "" {
		y, err := strconv.Atoi(year)
		if err != nil {
			apiError(w, req, http.StatusBadRequest, fmt.Sprintf("invalid year: %v", err))
			return
		}
		yearInt = y
	}

	familyID := req.URL.Query().Get("family_id")
	if familyID != "" {
		if _, err := uuid.Parse(familyID); err != nil {
			apiError(w, req, http.StatusBadRequest, fmt.Sprintf("invalid family_id: %v", err))
			return
		}
	}

	var (
		p   []*models.PaymentsResponse
		err error
	)
	if familyID != "" {
		p, err = h.PaymentsService.GetPaymentsByFamily(ctx, familyID)
	} else {
		p, err = h.PaymentsService.GetPaymentsByYear(ctx, yearInt)
	}
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}

	f, err := h.FamiliesService.GetAllFamilies(ctx)
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}
	n, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx)
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}

	render.JSON(w, req, services.JoinPayments(p, f, n))
}

func (h *handler) GetNoPaymentDetails(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	yearInt := time.Now().Year()
	if year := req.URL.Query().Get("year"); year != "" {
		y, err := strconv.Atoi(year)
		if err != nil {
			apiError(w, req, http.StatusBadRequest, fmt.Sprintf("invalid year: %v", err))
			return
		}
		yearInt = y
	}

	neighbourhoodID := req.URL.Query().Get("s_neighbourhood_id")
	if neighbourhoodID != "" {
		if _, err := uuid.Parse(neighbourhoodID); err != nil {
			apiError(w, req, http.StatusBadRequest, fmt.Sprintf("invalid s_neighbourhood_id: %v", err))
			return
		}
	}

	f, err := h.PaymentsService.NoPayment(ctx, yearInt, neighbourhoodID)
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}
	n, err := h.NeighbourhoodsService.GetAllNeighbourhoods(ctx)
	if err != nil {
		apiError(w, req, http.StatusInternalServerError, err.Error())
		return
	}

	render.JSON(w, req, services.JoinFamilies(f, n))
}
