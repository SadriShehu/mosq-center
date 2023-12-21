package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/render"
	"github.com/sadrishehu/mosq-center/internal/integration/prayers"
)

type PrayersService interface {
	GetPrayers(context.Context, int, int, int) (*prayers.Timings, error)
}

func (h *handler) GetPrayers(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	date := req.URL.Query().Get("date")
	dateInt, err := strconv.Atoi(date)
	if err != nil {
		log.Printf("failed to convert date to int: %v\n", err)
		dateInt = time.Now().Day()
	}

	month := req.URL.Query().Get("month")
	monthInt, err := strconv.Atoi(month)
	if err != nil {
		log.Printf("failed to convert month to int: %v\n", err)
		monthInt = int(time.Now().Month())
	}

	year := req.URL.Query().Get("year")
	yearInt, err := strconv.Atoi(year)
	if err != nil {
		log.Printf("failed to convert year to int: %v\n", err)
		yearInt = time.Now().Year()
	}

	prayers, err := h.PrayersService.GetPrayers(ctx, dateInt, monthInt, yearInt)
	if err != nil {
		log.Printf("failed to get prayers: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(fmt.Sprintf("failed to get prayers: %v\n", err)))
		return
	}

	log.Println("prayers retrieved successfully")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	render.JSON(w, req, prayers)
}
