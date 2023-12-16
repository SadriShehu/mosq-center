package pdf

import (
	"fmt"

	"github.com/johnfercher/maroto/pkg/consts"
	"github.com/johnfercher/maroto/pkg/pdf"
	"github.com/johnfercher/maroto/pkg/props"
)

type Invoice struct {
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
			Top:         1,
			Size:        14,
			Extrapolate: true,
			Align:       consts.Left,
			Style:       consts.Bold,
		})
	})

	// Set page content
	m.Row(30, func() {
		m.Col(2, func() {
			m.Text("Familja: ", headerProps(5))
			m.Text("Anëtarë: ", headerProps(10))
			m.Text("Shuma: ", headerProps(15))
			m.Text("Viti: ", headerProps(20))
		})
		m.Col(4, func() {
			m.Text(i.FamilyName, textProps(5))
			m.Text(fmt.Sprintf("%d", i.FamilyMembers), textProps(10))
			m.Text(fmt.Sprintf("%d €", i.Amount), textProps(15))
			m.Text(fmt.Sprintf("%d", i.Year), textProps(20))
		})

		m.Col(2, func() {
			m.Text("Familja: ", headerProps(5))
			m.Text("Anëtarë: ", headerProps(10))
			m.Text("Shuma: ", headerProps(15))
			m.Text("Viti: ", headerProps(20))
		})
		m.Col(4, func() {
			m.Text(i.FamilyName, textProps(5))
			m.Text(fmt.Sprintf("%d", i.FamilyMembers), textProps(10))
			m.Text(fmt.Sprintf("%d €", i.Amount), textProps(15))
			m.Text(fmt.Sprintf("%d", i.Year), textProps(20))
		})
	})

	m.Row(10, func() {
		m.Line(1)
	})
}
