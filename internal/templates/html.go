package templates

import (
	"embed"
	"html/template"
	"io"

	"github.com/sadrishehu/mosq-center/internal/models"
)

//go:embed *
var Files embed.FS

var (
	lagjet   = parse("app/lagjet.html")
	familjet = parse("app/familjet.html")
)

type LagjetParams struct {
	Neighbourhoods []*models.NeighbourhoodResponse
}

func Lagjet(w io.Writer, p LagjetParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}
	return lagjet.ExecuteTemplate(w, partial, p)
}

type FamiljetParams struct {
	Families []*models.FamiliesTemplate
}

func Familjet(w io.Writer, p FamiljetParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}

	return familjet.ExecuteTemplate(w, partial, p)
}

func parse(file string) *template.Template {
	return template.Must(
		template.New("layout.html").ParseFS(Files, "layout.html", file))
}
