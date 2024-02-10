package main

import (
	"context"
	"encoding/gob"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sadrishehu/mosq-center/config"
	"github.com/sadrishehu/mosq-center/internal/models"
	"github.com/sadrishehu/mosq-center/internal/server"
)

type Engine interface {
	Bootstrap()
	Run()
	Shutdown(context.Context)
	CloseDBConn(context.Context)
}

func init() {
	gob.Register(models.Profile{})
}

func main() {
	c := config.New()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var engine Engine = server.NewEngine(ctx, c)
	engine.Bootstrap()
	defer engine.CloseDBConn(ctx)

	log.Printf("server is starting at %s...", c.Port)
	go engine.Run()

	// Receive signal to shutdown the server.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	log.Printf("signal %d received, shutting down gracefully...", <-quit)
	engine.Shutdown(ctx)

	log.Println("finished graceful shutdown")
}
