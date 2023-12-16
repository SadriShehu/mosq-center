package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"
)

type InvoicesService interface {
	GenerateInvoices(ctx context.Context, year int) ([]byte, error)
}

func (h *handler) GetInvoices(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	year := req.URL.Query().Get("year")
	if year == "" || len(year) != 4 {
		log.Printf("empty or invalid year: %s", year)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("year is required and must be 4 digits"))
		return
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		log.Printf("invalid year: %s", year)
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("year must be a number"))
		return
	}

	invoices, err := h.InvoicesService.GenerateInvoices(ctx, yearInt)
	if err != nil {
		log.Printf("failed to get invoices: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to get invoices"))
		return
	}

	if len(invoices) == 0 {
		log.Printf("no invoices found for year: %s", year)
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("no invoices found"))
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename=invoices-"+year+".pdf")
	w.Header().Set("Content-Type", "application/pdf")
	w.WriteHeader(http.StatusOK)
	_, err = w.Write(invoices)
	if err != nil {
		log.Printf("failed to write invoices: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to write invoices"))
		return
	}

	log.Printf("invoices successfully written for year: %s", year)
}
