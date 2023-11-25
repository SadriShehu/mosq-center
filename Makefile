# Project details
PROJECT_NAME := mosq-center
APP_CMD := cmd/main.go
DOCKER_IMG_BASE = xhamia-qender.com/$(PROJECT_NAME):local

# Go
GO  = GOFLAGS=-mod=readonly go
GO_CMD          ?= go
GO_VERSION := 1.21.1
VENDOR_CMD	= $(GO_CMD) mod vendor

all: docker-db-start docker-db-stop

help: ## Display this help
	@echo "Usage: make [target] [VAR1=value] [VAR2=value]"
	@echo
	@echo "Targets:"
	@echo
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-30s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

docker-db-start: ## Start docker db
	@echo "Starting docker db"
	@docker-compose -f docker-compose.yml up -d

docker-db-stop: ## Stop docker db
	@echo "Stopping docker db"
	@docker-compose -f docker-compose.yml down
