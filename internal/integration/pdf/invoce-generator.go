package pdf

import (
	"fmt"

	"github.com/johnfercher/maroto/pkg/consts"
	"github.com/johnfercher/maroto/pkg/pdf"
	"github.com/johnfercher/maroto/pkg/props"
)

type Invoice struct {
	Neighborhood  string
	FamilyName    string
	FamilyMembers int
	Amount        int
	Year          int
}

func NewInvoice(i []*Invoice) ([]byte, error) {
	// Create a new PDF document
	m := pdf.NewMaroto(consts.Portrait, consts.A4)

	// Set page margins
	m.SetPageMargins(20, 10, 20)

	for index, invoice := range i {
		invoiceData(m, invoice, index+1)
	}

	// Get PDF document bytes
	pdfBytes, err := m.Output()
	if err != nil {
		return nil, err
	}

	return pdfBytes.Bytes(), nil
}

func headerProps(margin float64) props.Text {
	return props.Text{
		Top:   margin,
		Size:  11,
		Align: consts.Left,
		Style: consts.Bold,
	}
}

func textProps(margin float64) props.Text {
	return props.Text{
		Top:   margin,
		Size:  11,
		Align: consts.Left,
		Style: consts.Normal,
	}
}

func invoiceData(m pdf.Maroto, i *Invoice, number int) {
	m.Row(10, func() {
		m.Text(fmt.Sprintf("Fatura #%d", number), props.Text{
			Top:         2,
			Size:        14,
			Extrapolate: true,
			Align:       consts.Left,
			Style:       consts.Bold,
		})
	})

	// Set page content
	m.Row(30, func() {
		m.Col(2, func() {
			m.Text("Viti: ", headerProps(5))
			m.Text("Lagje: ", headerProps(10))
			m.Text("Familja: ", headerProps(15))
			m.Text("Anëtarë: ", headerProps(20))
			m.Text("Nënshkrimi: ", headerProps(25))
			m.Text("Shuma: ", headerProps(40))
		})
		m.Col(4, func() {
			m.Text(fmt.Sprintf("%d", i.Year), textProps(5))
			m.Text(i.Neighborhood, textProps(10))
			m.Text(i.FamilyName, textProps(15))
			m.Text(fmt.Sprintf("%d Persona", i.FamilyMembers), textProps(20))
			m.Text("", textProps(25))
			m.Text(fmt.Sprintf("%d €", i.Amount), headerProps(40))
		})

		m.Col(2, func() {
			m.Text("Viti: ", headerProps(5))
			m.Text("Lagje: ", headerProps(10))
			m.Text("Familja: ", headerProps(15))
			m.Text("Anëtarë: ", headerProps(20))
			m.Text("Nënshkrimi: ", headerProps(25))
			m.Text("Shuma: ", headerProps(40))
		})
		m.Col(4, func() {
			m.Text(fmt.Sprintf("%d", i.Year), textProps(5))
			m.Text(i.Neighborhood, textProps(10))
			m.Text(i.FamilyName, textProps(15))
			m.Text(fmt.Sprintf("%d Persona", i.FamilyMembers), textProps(20))
			m.Text("", textProps(25))
			m.Text(fmt.Sprintf("%d €", i.Amount), headerProps(40))
		})
	})

	m.Row(5, func() {
		m.Line(1)
		m.Text("", props.Text{
			Top: 1,
		})
	})

	m.Row(5, func() {
	})

	m.Row(5, func() {
		m.Line(1)
	})
}
