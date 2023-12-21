package models

type Region struct {
	Name string `json:"name"`
	Zip  string `json:"zip"`
}

var Regions = []*Region{
	{Name: "Junik", Zip: "51050"},
	{Name: "Gjakove", Zip: "50000"},
}
