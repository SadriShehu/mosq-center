package server

import (
	"context"
	"log"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/gorilla/sessions"
	"github.com/rs/cors"
	"github.com/sadrishehu/mosq-center/config"
	"github.com/sadrishehu/mosq-center/internal/db"
	"github.com/sadrishehu/mosq-center/internal/handlers"
	"github.com/sadrishehu/mosq-center/internal/integration/auth0"
	"github.com/sadrishehu/mosq-center/internal/integration/prayers"
	"github.com/sadrishehu/mosq-center/internal/repository"
	"github.com/sadrishehu/mosq-center/internal/services"
	"go.mongodb.org/mongo-driver/mongo"
)

type engine struct {
	config     *config.Config
	router     *chi.Mux
	nosql      *mongo.Client
	auth0      *auth0.Authenticator
	prayersAPI *prayers.PrayersClient
	server     *http.Server
}

func NewEngine(
	ctx context.Context,
	c *config.Config,
) *engine {
	r := router()
	return &engine{
		config:     c,
		router:     r,
		nosql:      dbc(ctx, c),
		auth0:      auth(c.Auth),
		prayersAPI: prayersClient(c.TunePrayers),
		server: &http.Server{
			Addr:    c.Port,
			Handler: r,
		},
	}
}

func dbc(ctx context.Context, c *config.Config) *mongo.Client {
	dbc, err := db.New(ctx, c.DBConfig.MongoDBURI+c.DBConfig.MongoUserCertPath)
	if err != nil {
		log.Fatalf("failed to connect to the database: %v\n", err)
	}

	return dbc
}

func auth(c *config.Auth0Config) *auth0.Authenticator {
	var (
		auth *auth0.Authenticator
		err  error
	)

	if c.Enable {
		auth, err = auth0.New(c)
		if err != nil {
			log.Fatalf("Failed to initialize the authenticator: %v", err)
		}
	}

	return auth
}

func router() *chi.Mux {
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

	return r
}

func prayersClient(c *config.TunePrayers) *prayers.PrayersClient {
	prayersClient := prayers.NewPrayersClient(http.DefaultClient)
	prayersClient.SetTune(&prayers.Tune{
		Imsak:    c.Imsak,
		Fajr:     c.Fajr,
		Sunrise:  c.Sunrise,
		Dhuhr:    c.Dhuhr,
		Asr:      c.Asr,
		Sunset:   c.Sunset,
		Maghrib:  c.Maghrib,
		Isha:     c.Isha,
		Midnight: c.Midnight,
	})

	return prayersClient
}

func (s *engine) Bootstrap() {
	// Repository injection
	pr := repository.NewPaymentsRepository(s.nosql, s.config.DBConfig.CollectionName)
	fr := repository.NewFamiliesRepository(s.nosql, s.config.DBConfig.CollectionName)
	nr := repository.NewNeighbourhoodsRepository(s.nosql, s.config.DBConfig.CollectionName)

	// Service injection
	ps := services.NewPaymentsService(pr)
	fs := services.NewFamiliesService(fr)
	ns := services.NewNeighbourhoodsRepository(nr)
	is := services.NewInvoicesService(pr, nr)
	prs := services.NewPrayersService(s.prayersAPI)

	// Store injection
	ss := sessions.NewCookieStore([]byte(s.config.Auth.SessionsSecret))

	// Handler injection
	h := handlers.New(s.router, s.auth0, ps, fs, ns, is, prs, ss, s.config.Auth)

	h.RegisterRoutesV1()
	h.RegisterTemplates()
}

func (s *engine) Run() {
	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("failed to serve: %v\n", err)
	}
}

func (s *engine) Shutdown(ctx context.Context) {
	if err := s.server.Shutdown(ctx); err != nil {
		log.Fatalf("could not gracefully shutdown the server: %v\n", err)
	}
}

func (s *engine) CloseDBConn(ctx context.Context) {
	if err := s.nosql.Disconnect(ctx); err != nil {
		log.Fatalf("could not close the database connection: %v\n", err)
	}
}
