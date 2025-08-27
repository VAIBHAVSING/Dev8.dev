# Makefile for Go Agent Development
.PHONY: build clean test lint format dev deps help install-tools

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
BINARY_NAME=agent
BINARY_PATH=bin/$(BINARY_NAME)

# Default target
help: ## Show this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Go application
	$(GOBUILD) -o $(BINARY_PATH) -v ./...

clean: ## Clean build artifacts
	$(GOCLEAN)
	rm -f $(BINARY_PATH)
	rm -rf tmp/

test: ## Run tests
	$(GOTEST) -v ./...

test-coverage: ## Run tests with coverage
	$(GOTEST) -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out

lint: ## Run linter
	golangci-lint run

lint-fix: ## Run linter with auto-fix
	golangci-lint run --fix

format: ## Format code
	gofmt -s -w .
	goimports -w .

format-check: ## Check if code is formatted
	@test -z "$$(gofmt -l .)" || (echo "Code is not formatted. Run 'make format'" && exit 1)

deps: ## Download dependencies
	$(GOGET) -d ./...
	$(GOCMD) mod tidy

dev: ## Run in development mode with hot reload
	air

install-tools: ## Install development tools
	./setup-go-tools.sh

run: build ## Build and run the application
	./$(BINARY_PATH)

docker-build: ## Build Docker image
	docker build -t $(BINARY_NAME) .

all: deps format lint test build ## Run all checks and build

check: format-check lint test ## Run all checks without building

.DEFAULT_GOAL := help
