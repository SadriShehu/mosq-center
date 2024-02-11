package models

type Profile struct {
	Name       string   `json:"name"`
	Email      string   `json:"email"`
	Picture    string   `json:"picture"`
	MosqAccess []string `json:"mosq_access"`
}
