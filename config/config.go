package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port              string
	MongoDBURI        string
	MongoUserCertPath string
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
	}
}
