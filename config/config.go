package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	Env         string
	Port        string
	ServiceName string
	// FeePerMember is the yearly fee per family member (FEE_PER_MEMBER, default 3).
	FeePerMember float64
	DBConfig     *DBConfig
	Auth         *Auth0Config
	TunePrayers  *TunePrayers
}

type DBConfig struct {
	MongoDBURI        string
	MongoUserCertPath string
	CollectionName    string
}

type Auth0Config struct {
	Enable         bool
	Env            string
	Domain         string
	ClientID       string
	ClientSecret   string
	CallbackURL    string
	SessionsSecret string
	ServiceName    string
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

// GetFloatOrDefault reads a positive float env var, falling back to the default.
func GetFloatOrDefault(key string, defaultValue float64) float64 {
	raw := GetOrDefault(key, "")
	if raw == "" {
		return defaultValue
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil || v <= 0 {
		log.Printf("invalid %s=%q, using default %v\n", key, raw, defaultValue)
		return defaultValue
	}
	return v
}

func New() *Config {
	return &Config{
		FeePerMember: GetFloatOrDefault("FEE_PER_MEMBER", 3),
		Env:          GetOrDefault("ENV", "dev"),
		ServiceName:  GetOrDefault("SERVICE_NAME", "mosq"),
		Port:         ":" + GetOrDefault("PORT", "8080"),
		DBConfig: &DBConfig{
			MongoDBURI:        GetOrDefault("MONGO_DB_URI", "mongodb://root:root@localhost:27017"),
			MongoUserCertPath: GetOrDefault("MONGO_USER_CERT_PATH", ""),
			CollectionName:    GetOrDefault("MONGO_COLLECTION_NAME", "mosq"),
		},
		Auth: &Auth0Config{
			Enable:         GetBoolOrFalse("AUTH0_ENABLE"),
			Env:            GetOrDefault("ENV", "dev"),
			Domain:         GetOrDefault("AUTH0_DOMAIN", "mosq-center.eu.auth0.com"),
			ClientID:       GetOrDefault("AUTH0_CLIENT_ID", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			ClientSecret:   GetOrDefault("AUTH0_CLIENT_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			CallbackURL:    GetOrDefault("AUTH0_CALLBACK_URL", "http://localhost:8080/callback"),
			SessionsSecret: GetOrDefault("SESSIONS_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			ServiceName:    GetOrDefault("SERVICE_NAME", "mosq"),
		},
		TunePrayers: &TunePrayers{
			Imsak:    GetIntOrDefault("TUNE_IMSAK", 5),
			Fajr:     GetIntOrDefault("TUNE_FAJR", 22),
			Sunrise:  GetIntOrDefault("TUNE_SUNRISE", -7),
			Dhuhr:    GetIntOrDefault("TUNE_DHUHR", 1),
			Asr:      GetIntOrDefault("TUNE_ASR", 6),
			Sunset:   GetIntOrDefault("TUNE_SUNSET", 5),
			Maghrib:  GetIntOrDefault("TUNE_MAGHRIB", 5),
			Isha:     GetIntOrDefault("TUNE_ISHA", 7),
			Midnight: GetIntOrDefault("TUNE_MIDNIGHT", 90),
		},
	}
}
