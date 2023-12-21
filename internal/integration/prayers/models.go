package prayers

type Tune struct {
	Imsak    int `json:"Imsak"`
	Fajr     int `json:"Fajr"`
	Sunrise  int `json:"Sunrise"`
	Dhuhr    int `json:"Dhuhr"`
	Asr      int `json:"Asr"`
	Sunset   int `json:"Sunset"`
	Maghrib  int `json:"Maghrib"`
	Isha     int `json:"Isha"`
	Midnight int `json:"Midnight"`
}
