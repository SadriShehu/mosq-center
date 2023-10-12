package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/rs/cors"
	"github.com/sadrishehu/mosq-center/config"
	"github.com/sadrishehu/mosq-center/internal/db"
	"github.com/sadrishehu/mosq-center/internal/handlers"
	"github.com/sadrishehu/mosq-center/internal/repository"
	"github.com/sadrishehu/mosq-center/internal/services"
	"go.mongodb.org/mongo-driver/mongo"
)

func main() {
	c := config.New()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer func() {
		cancel()
	}()

	dbc, err := db.New(ctx, c.MongoDBURI+c.MongoUserCertPath)
	if err != nil {
		panic(err)
	}
	defer dbc.Disconnect(ctx)

	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	ch := cors.New(cors.Options{
		AllowedOrigins:     []string{"*"},
		AllowedHeaders:     []string{"*"},
		AllowedMethods:     []string{"GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"},
		AllowCredentials:   true,
		Debug:              true,
		OptionsPassthrough: false,
	})
	r.Use(ch.Handler)

	newService(c, r, dbc)
	srv := &http.Server{
		Addr:    c.Port,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("failed to serve: %v\n", err)
		}
	}()

	log.Printf("server is starting at %s...", srv.Addr)

	// Receive signal to shutdown the server.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	log.Printf("signal %d received, shutting down gracefully...", <-quit)

	// Gracefully shutdown the server
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("could not gracefully shutdown the server: %v\n", err)
	}

	log.Println("finished graceful shutdown")
}

type service struct {
	config *config.Config
	router *chi.Mux
	nosql  *mongo.Client
}

func newService(c *config.Config, r *chi.Mux, nosql *mongo.Client) {
	s := &service{
		config: c,
		router: r,
		nosql:  nosql,
	}

	s.bootstrap()
}

func (s *service) bootstrap() {
	// Repository injection
	pr := repository.NewPaymentsRepository(s.nosql)

	// Service injection
	ps := services.NewPaymentsService(pr)

	// Handler injection
	h := handlers.New(s.router, ps)
	
	fr := repository.NewFamiliesRepository(s.nosql)

	fs := services.NewFamiliesService(fr)
	
	h := handlers.New(s.router, fs)
	
	nr := repository.NewNeighbourhoodsRepository(s.nosql)

	ns := services.NewNeighbourhoodsRepository(nr)
	
	h := handlers.New(s.router, ns)
	h.RegisterRoutesV1()
}
