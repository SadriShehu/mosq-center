package handlers

import (
	"context"
	"net/http"
	"strconv"
)

type InvoicesService interface {
	GenerateInvoices(ctx context.Context, year int) ([]byte, error)
}

func (h *handler) GetInvoices(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()

	year := req.URL.Query().Get("year")
	if year == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("year is required"))
		return
	}

	if year == "" {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("year is required"))
		return
	}

	if len(year) != 4 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("year must be 4 digits"))
		return
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("year must be a number"))
		return
	}

	invoices, err := h.InvoicesService.GenerateInvoices(ctx, yearInt)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to get invoices"))
		return
	}

	if len(invoices) == 0 {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("no invoices found"))
		return
	}

	w.Header().Set("Content-Disposition", "attachment; filename=invoices-"+year+".pdf")
	w.Header().Set("Content-Type", "application/pdf")
	w.WriteHeader(http.StatusOK)
	_, err = w.Write(invoices)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("failed to write invoices"))
		return
	}
}
