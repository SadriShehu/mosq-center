package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port              string
	MongoDBURI        string
	MongoUserCertPath string
	Auth0Domain       string
	Auth0ClientID     string
	Auth0ClientSecret string
	Auth0CallbackURL  string
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
		Auth0Domain:       GetOrDefault("AUTH0_DOMAIN", "mosq-center.eu.auth0.com"),
		Auth0ClientID:     GetOrDefault("AUTH0_CLIENT_ID", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
		Auth0ClientSecret: GetOrDefault("AUTH0_CLIENT_SECRET", "0Q4Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q1Q"),
		Auth0CallbackURL:  GetOrDefault("AUTH0_CALLBACK_URL", "http://localhost:8080/callback"),
	}
}
