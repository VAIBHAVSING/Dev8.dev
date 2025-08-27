# Development Makefile for Dev8.dev

.PHONY: help install dev build test lint format clean setup-go check-all

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "Installing dependencies..."
	pnpm install
	@echo "Setting up Go tools..."
	cd apps/agent && ./setup-go-tools.sh

dev: ## Start development servers
	@echo "Starting development servers..."
	pnpm dev

build: ## Build all applications
	@echo "Building all applications..."
	pnpm build

test: ## Run all tests
	@echo "Running tests..."
	pnpm test

lint: ## Run linting for all languages
	@echo "Running TypeScript linting..."
	pnpm lint
	@echo "Running Go linting..."
	pnpm lint:go

format: ## Format code for all languages
	@echo "Formatting TypeScript code..."
	pnpm format
	@echo "Formatting Go code..."
	pnpm format:go

check-types: ## Type check TypeScript code
	@echo "Type checking..."
	pnpm check-types

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	pnpm clean

setup-go: ## Setup Go development tools
	@echo "Setting up Go tools..."
	cd apps/agent && ./setup-go-tools.sh

check-all: ## Run all checks (lint, format, type-check, test, build)
	@echo "Running all checks..."
	@echo "1. Linting..."
	make lint
	@echo "2. Format checking..."
	make format
	@echo "3. Type checking..."
	make check-types
	@echo "4. Testing..."
	make test
	@echo "5. Building..."
	make build
	@echo "✅ All checks passed!"

# CI simulation
ci: ## Simulate CI pipeline locally
	@echo "🚀 Simulating CI pipeline..."
	@echo "This will run the same checks as our GitHub Actions"
	make check-all

# Quick development setup
quick-start: install ## Quick setup and start development
	@echo "🚀 Quick start complete! Starting development servers..."
	make dev
