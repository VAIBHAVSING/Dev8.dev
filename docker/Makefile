.PHONY: help build-all build-base build-languages build-vscode build-ai-tools test clean

# Variables
REGISTRY := dev8registry.azurecr.io
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "latest")

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build-base:  ## Build base layer (00-base)
	@./scripts/build.sh base

build-languages:  ## Build language layer (10-languages)
	@./scripts/build.sh languages

build-vscode:  ## Build VS Code layer (20-vscode)
	@./scripts/build.sh vscode

build-ai-tools:  ## Build AI tools layer (30-ai-tools)
	@./scripts/build.sh ai-tools

build-all: build-base build-languages build-vscode build-ai-tools  ## Build all layers

test-base:  ## Test base layer
	@echo "Testing base layer..."
	@docker run --rm dev8-base:latest bash -c "workspace-supervisor --version && gh --version"

test-languages:  ## Test language layer
	@echo "Testing language layer..."
	@docker run --rm dev8-languages:latest bash -c "node --version && python --version && go version && rustc --version"

test-vscode:  ## Test VS Code layer
	@echo "Testing VS Code layer..."
	@docker run --rm dev8-vscode:latest bash -c "code-server --version"

test: test-base test-languages test-vscode  ## Run all tests

clean:  ## Clean up Docker images
	docker image prune -f
	docker builder prune -f

run-vscode:  ## Run VS Code Server locally
	docker run -it --rm \
		-p 8080:8080 -p 2222:2222 -p 9000:9000 \
		-e GITHUB_TOKEN=${GITHUB_TOKEN} \
		-e ENVIRONMENT_ID=dev8-local-001 \
		-e CODE_SERVER_PASSWORD=dev8dev \
		-v $(PWD)/workspace:/workspace \
		-v dev8-home:/home/dev8 \
		dev8-workspace:latest

compose-up:  ## Start workspace with docker-compose
	docker-compose up -d

compose-down:  ## Stop workspace
	docker-compose down

compose-logs:  ## View workspace logs
	docker-compose logs -f workspace

compose-rebuild:  ## Rebuild and restart workspace
	docker-compose up -d --build workspace

.DEFAULT_GOAL := help
