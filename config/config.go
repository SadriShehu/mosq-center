package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port              string
	MongoDBURI        string
	MongoUserCertPath string
	Auth              *Auth0Config
}

type Auth0Config struct {
	Enable         bool
	Domain         string
	ClientID       string
	ClientSecret   string
	CallbackURL    string
	SessionsSecret string
}

func GetOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		value = defaultValue
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
		Port:              ":8080",
		MongoDBURI:        GetOrDefault("MONGO_DB_URI", "mongodb+srv://center-store.mmuwma4.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&tlsCertificateKeyFile="),
		MongoUserCertPath: GetOrDefault("MONGO_USER_CERT_PATH", "db-user-cert.pem"),
		Auth: &Auth0Config{
			Enable:         GetBoolOrFalse("AUTH0_ENABLE"),
			Domain:         GetOrDefault("AUTH0_DOMAIN", "mosq-center.eu.auth0.com"),
			ClientID:       GetOrDefault("AUTH0_CLIENT_ID", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			ClientSecret:   GetOrDefault("AUTH0_CLIENT_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
			CallbackURL:    GetOrDefault("AUTH0_CALLBACK_URL", "http://localhost:8080/callback"),
			SessionsSecret: GetOrDefault("SESSIONS_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
		},
	}
}
