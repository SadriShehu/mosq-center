package config

import "testing"

func TestBrandName(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		t.Setenv("BRAND_NAME", "")
		if got := New().BrandName; got != "Xhamia Qendër" {
			t.Errorf("got %q", got)
		}
	})
	t.Run("override keeps UTF-8", func(t *testing.T) {
		t.Setenv("BRAND_NAME", "Xhamia Qokut ë")
		if got := New().BrandName; got != "Xhamia Qokut ë" {
			t.Errorf("got %q", got)
		}
	})
}
