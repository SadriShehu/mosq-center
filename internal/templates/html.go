package templates

import (
	"embed"
	"html/template"
	"io"

	"github.com/sadrishehu/mosq-center/internal/integration/prayers"
	"github.com/sadrishehu/mosq-center/internal/models"
)

//go:embed *
var Files embed.FS

var (
	lagjet          = parse("app/lagjet.html")
	familjet        = parse("app/familjet.html")
	pagesat         = parse("app/pagesat.html")
	pagesatPakryera = parse("app/pagesat-pakryera.html")
	publike         = parseNoAuth("app/publike.html")
	perdoruesi      = parse("app/perdoruesi.html")
)

type LagjetParams struct {
	Regions        []*models.Region
	Neighbourhoods []*models.NeighbourhoodResponse
}

func Lagjet(w io.Writer, p LagjetParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}
	return lagjet.ExecuteTemplate(w, partial, p)
}

type FamiljetParams struct {
	Families       []*models.FamiliesTemplate
	Neighbourhoods []*models.NeighbourhoodResponse
}

func Familjet(w io.Writer, p FamiljetParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}

	return familjet.ExecuteTemplate(w, partial, p)
}

type PagesatParams struct {
	Payments []*models.PaymentsTemplate
	Families []*models.FamiliesResponse
}

func Pagesat(w io.Writer, p PagesatParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}

	return pagesat.ExecuteTemplate(w, partial, p)
}

type PagesatPakryeraParams struct {
	Families []*models.FamiliesTemplate
}

func PagesatPakryera(w io.Writer, p PagesatPakryeraParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}

	return pagesatPakryera.ExecuteTemplate(w, partial, p)
}

type PublikeParams struct {
	Prayers *prayers.Timings
}

func Publike(w io.Writer, p PublikeParams, partial string) error {
	if partial == "" {
		partial = "layout-noauth.html"
	}

	return publike.ExecuteTemplate(w, partial, p)
}

type PerdoruesiParams struct {
	Picture string
	Name    string
	Prayers *prayers.Timings
}

func Perdoruesi(w io.Writer, p PerdoruesiParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}

	return perdoruesi.ExecuteTemplate(w, partial, p)
}

func parse(file string) *template.Template {
	return template.Must(
		template.New("layout.html").ParseFS(Files, "layout.html", file))
}

func parseNoAuth(file string) *template.Template {
	return template.Must(
		template.New("layout-noauth.html").ParseFS(Files, "layout-noauth.html", file))
}
