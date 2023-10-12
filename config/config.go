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
		MongoDBURI:        GetOrDefault("MONGO_DB_URI", "mongodb://localhost:27017"),
		MongoUserCertPath: GetOrDefault("MONGO_USER_CERT_PATH", ""),
	}
}
