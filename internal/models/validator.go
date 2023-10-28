package models

import (
	"fmt"
	"net/http"

	"github.com/go-playground/validator"
)

// Validator global var
var Validator = validator.New()

func (nReq *NeighbourhoodRequest) Bind(*http.Request) error {
	if err := Validator.Struct(nReq); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}
	return nil
}

func (fReq *FamiliesRequest) Bind(*http.Request) error {
	if err := Validator.Struct(fReq); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}
	return nil
}

func (pReq *PaymentsRequest) Bind(*http.Request) error {
	if err := Validator.Struct(pReq); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}
	return nil
}
