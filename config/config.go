package config

import (
	"os"
	"strconv"
)

type Config struct {
	Env               string
	Port              string
	MongoDBURI        string
	MongoUserCertPath string
	Auth              *Auth0Config
	TunePrayers       *TunePrayers
}

type Auth0Config struct {
	Enable         bool
	Env            string
	Domain         string
	ClientID       string
	ClientSecret   string
	CallbackURL    string
	SessionsSecret string
}

type TunePrayers struct {
	Imsak    int
	Fajr     int
	Sunrise  int
	Dhuhr    int
	Asr      int
	Sunset   int
	Maghrib  int
	Isha     int
	Midnight int
}

func GetOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		value = defaultValue
	}
	return value
}

func GetIntOrDefault(key string, defaultValue int) int {
	value, err := strconv.Atoi(GetOrDefault(key, strconv.Itoa(defaultValue)))
	if err != nil {
		return defaultValue
	}
	return value
}

// GetBoolOrFalse env vars
func GetBoolOrFalse(key string) bool {
	ok, err := strconv.ParseBool(GetOrDefault(key, "false"))
	if err != nil {
		return false
	}
	return ok
}

func New() *Config {
	return &Config{
		Env:               GetOrDefault("ENV", "dev"),
		Port:              ":8080",
		MongoDBURI:        GetOrDefault("MONGO_DB_URI", "mongodb://root:root@localhost:27017"),
		MongoUserCertPath: GetOrDefault("MONGO_USER_CERT_PATH", ""),
		Auth: &Auth0Config{
			Enable:         GetBoolOrFalse("AUTH0_ENABLE"),
			Env:            GetOrDefault("ENV", "dev"),
			Domain:         GetOrDefault("AUTH0_DOMAIN", "mosq-center.eu.auth0.com"),
			ClientID:       GetOrDefault("AUTH0_CLIENT_ID", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			ClientSecret:   GetOrDefault("AUTH0_CLIENT_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			CallbackURL:    GetOrDefault("AUTH0_CALLBACK_URL", "http://localhost:8080/callback"),
			SessionsSecret: GetOrDefault("SESSIONS_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
		},
		TunePrayers: &TunePrayers{
			Imsak:    GetIntOrDefault("TUNE_IMSAK", 5),
			Fajr:     GetIntOrDefault("TUNE_FAJR", 25),
			Sunrise:  GetIntOrDefault("TUNE_SUNRISE", -5),
			Dhuhr:    GetIntOrDefault("TUNE_DHUHR", 3),
			Asr:      GetIntOrDefault("TUNE_ASR", 9),
			Sunset:   GetIntOrDefault("TUNE_SUNSET", 5),
			Maghrib:  GetIntOrDefault("TUNE_MAGHRIB", 5),
			Isha:     GetIntOrDefault("TUNE_ISHA", 8),
			Midnight: GetIntOrDefault("TUNE_MIDNIGHT", 90),
		},
	}
}
