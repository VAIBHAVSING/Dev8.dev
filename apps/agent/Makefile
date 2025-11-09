# Makefile for Go Agent Development
.PHONY: build clean test lint format dev deps help install-tools config-dev-aca config-prod-aci config-show config-validate

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

# ============================================================================
# Azure Configuration Management
# ============================================================================

config-dev-aca: ## Configure .env for DEV with ACA (fetch from Azure)
	@./configure-env.sh dev-aca

config-prod-aci: ## Configure .env for PROD with ACI (fetch from Azure) - COMMENTED FOR NOW
	@./configure-env.sh prod-aci

config-show: ## Show current configuration
	@echo "Current Agent Configuration:"
	@echo "=============================="
	@if [ -f .env ]; then \
		echo "Deployment Mode: $$(grep "^AZURE_DEPLOYMENT_MODE=" .env | cut -d= -f2)"; \
		echo "Resource Group: $$(grep "^AZURE_RESOURCE_GROUP=" .env | head -1 | cut -d= -f2)"; \
		echo "Region: $$(grep "^AZURE_DEFAULT_REGION=" .env | head -1 | cut -d= -f2)"; \
		echo "Storage Account: $$(grep "^AZURE_STORAGE_ACCOUNT=" .env | head -1 | cut -d= -f2)"; \
		echo "Container Registry: $$(grep "^AZURE_CONTAINER_REGISTRY=" .env | head -1 | cut -d= -f2)"; \
		if grep -q "^AZURE_DEPLOYMENT_MODE=aca" .env; then \
			echo "ACA Environment: $$(az containerapp env list -g $$(grep "^AZURE_RESOURCE_GROUP=" .env | head -1 | cut -d= -f2) --query '[0].name' -o tsv 2>/dev/null || echo 'Not found')"; \
		fi; \
	else \
		echo "No .env file found. Run 'make config-dev-aca' to create it."; \
	fi

config-validate: ## Validate .env configuration
	@echo "Validating .env configuration..."
	@if [ ! -f .env ]; then \
		echo "✗ .env file not found"; \
		exit 1; \
	fi; \
	ERRORS=0; \
	if ! grep -q "^AZURE_SUBSCRIPTION_ID=" .env; then echo "✗ AZURE_SUBSCRIPTION_ID not set"; ERRORS=$$((ERRORS+1)); fi; \
	if ! grep -q "^AZURE_RESOURCE_GROUP=" .env; then echo "✗ AZURE_RESOURCE_GROUP not set"; ERRORS=$$((ERRORS+1)); fi; \
	if ! grep -q "^AZURE_STORAGE_ACCOUNT=" .env; then echo "✗ AZURE_STORAGE_ACCOUNT not set"; ERRORS=$$((ERRORS+1)); fi; \
	if ! grep -q "^AZURE_DEPLOYMENT_MODE=" .env; then echo "✗ AZURE_DEPLOYMENT_MODE not set"; ERRORS=$$((ERRORS+1)); fi; \
	MODE=$$(grep "^AZURE_DEPLOYMENT_MODE=" .env | cut -d= -f2); \
	if [ "$$MODE" = "aca" ]; then \
		if ! grep -q "^AZURE_ACA_ENVIRONMENT_ID=" .env || [ -z "$$(grep "^AZURE_ACA_ENVIRONMENT_ID=" .env | cut -d= -f2)" ]; then \
			echo "✗ AZURE_ACA_ENVIRONMENT_ID not set (required for ACA mode)"; \
			ERRORS=$$((ERRORS+1)); \
		fi; \
	fi; \
	if [ $$ERRORS -eq 0 ]; then \
		echo "✓ Configuration is valid"; \
	else \
		echo ""; \
		echo "Found $$ERRORS error(s). Run 'make config-dev-aca' to fix."; \
		exit 1; \
	fi

.DEFAULT_GOAL := help
