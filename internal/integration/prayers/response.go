package prayers

type Timings struct {
	Fajr       string `json:"Fajr"`
	Sunrise    string `json:"Sunrise"`
	Dhuhr      string `json:"Dhuhr"`
	Asr        string `json:"Asr"`
	Sunset     string `json:"Sunset"`
	Maghrib    string `json:"Maghrib"`
	Isha       string `json:"Isha"`
	Imsak      string `json:"Imsak"`
	Midnight   string `json:"Midnight"`
	Firstthird string `json:"Firstthird"`
	Lastthird  string `json:"Lastthird"`
}

type Gregorian struct {
	Date    string `json:"date"`
	Format  string `json:"format"`
	Day     string `json:"day"`
	Weekday struct {
		En string `json:"en"`
	} `json:"weekday"`
	Month struct {
		Number int    `json:"number"`
		En     string `json:"en"`
	} `json:"month"`
	Year        string `json:"year"`
	Designation struct {
		Abbreviated string `json:"abbreviated"`
		Expanded    string `json:"expanded"`
	} `json:"designation"`
}

type Hijri struct {
	Date    string `json:"date"`
	Format  string `json:"format"`
	Day     int    `json:"day"`
	Weekday struct {
		En string `json:"en"`
		Ar string `json:"ar"`
	} `json:"weekday"`
	Month struct {
		Number int    `json:"number"`
		En     string `json:"en"`
		Ar     string `json:"ar"`
	} `json:"month"`
	Year        int `json:"year"`
	Designation struct {
		Abbreviated string `json:"abbreviated"`
		Expanded    string `json:"expanded"`
	} `json:"designation"`
	Holidays []interface{} `json:"holidays"`
}

type MethodParams struct {
	Fajr int `json:"Fajr"`
	Isha int `json:"Isha"`
}

type MethodLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type Method struct {
	ID       int            `json:"id"`
	Name     string         `json:"name"`
	Params   MethodParams   `json:"params"`
	Location MethodLocation `json:"location"`
}

type Offset struct {
	Imsak    int `json:"Imsak"`
	Fajr     int `json:"Fajr"`
	Sunrise  int `json:"Sunrise"`
	Dhuhr    int `json:"Dhuhr"`
	Asr      int `json:"Asr"`
	Maghrib  int `json:"Maghrib"`
	Sunset   int `json:"Sunset"`
	Isha     int `json:"Isha"`
	Midnight int `json:"Midnight"`
}

type Date struct {
	Timestamp string    `json:"timestamp"`
	Gregorian Gregorian `json:"gregorian"`
	Hijri     Hijri     `json:"hijri"`
}

type Data struct {
	Timings `json:"timings"`
	Date    `json:"date"`
}

type Prayers struct {
	Code   int    `json:"code"`
	Status string `json:"status"`
	Data   []Data `json:"data"`
}
