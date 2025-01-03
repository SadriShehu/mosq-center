package prayers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type PrayersClient struct {
	client *http.Client
	tune   *Tune
}

func NewPrayersClient(client *http.Client) *PrayersClient {
	return &PrayersClient{client: client}
}

func (c *PrayersClient) SetTune(tune *Tune) {
	c.tune = tune
}

func (c *PrayersClient) GetPrayers(month, year int) (*Prayers, error) {
	req := http.Request{
		Method: http.MethodGet,
		URL: &url.URL{
			Scheme: "https",
			Host:   "api.aladhan.com",
			Path:   fmt.Sprintf("/v1/calendar/%d/%d", year, month),
			RawQuery: url.Values{
				"latitude":  []string{"42.476"},
				"longitude": []string{"20.277"},
				"method":    []string{"3"},
				"tune": []string{
					fmt.Sprintf(
						"%d,%d,%d,%d,%d,%d,%d,%d,%d",
						c.tune.Imsak,
						c.tune.Fajr,
						c.tune.Sunrise,
						c.tune.Dhuhr,
						c.tune.Asr,
						c.tune.Sunset,
						c.tune.Maghrib,
						c.tune.Isha,
						c.tune.Midnight,
					),
				},
			}.Encode(),
		},
	}

	fmt.Println(req.URL.String())

	resp, err := c.client.Do(&req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	if len(body) == 0 {
		return nil, fmt.Errorf("empty response body")
	}

	var data *Prayers
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	return data, nil
}
