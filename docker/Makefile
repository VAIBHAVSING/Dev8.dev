.PHONY: help build-all build-base build-languages build-vscode build-workspace test clean up down

# Variables
REGISTRY := dev8registry.azurecr.io
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "latest")

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build-base:  ## Build base layer (00-base)
	docker compose build base

build-languages:  ## Build language layer (10-languages)
	docker compose build languages

build-vscode:  ## Build VS Code layer (20-vscode)
	docker compose build vscode

build-workspace:  ## Build workspace layer (30-ai-tools)
	docker compose build workspace

build-all:  ## Build all layers in order
	@echo "Building all layers in order..."
	@docker compose build base
	@docker compose build languages
	@docker compose build vscode
	@docker compose build workspace
	@echo "✅ All layers built successfully!"

up:  ## Start workspace container
	docker compose up -d workspace

down:  ## Stop workspace container
	docker compose down

logs:  ## Show workspace logs
	docker compose logs -f workspace

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

run-vscode:  ## Run VS Code Server locally (legacy - use 'make up' instead)
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

################################################################################
# Production Deployment Commands
################################################################################

.PHONY: prod-config prod-validate prod-build prod-push prod-deploy prod-logs prod-status prod-stop prod-destroy

prod-config:  ## Validate production environment configuration
	@echo "🔍 Validating production configuration..."
	@if [ ! -f .env.prod ]; then \
		echo "❌ .env.prod not found. Copy .env.prod.example and configure."; \
		exit 1; \
	fi
	@echo "✅ Configuration file found"
	@source .env.prod && \
		if [ -z "$$GITHUB_TOKEN" ]; then echo "❌ GITHUB_TOKEN not set"; exit 1; fi && \
		if [ -z "$$CODE_SERVER_PASSWORD" ]; then echo "❌ CODE_SERVER_PASSWORD not set"; exit 1; fi && \
		if [ -z "$$ENVIRONMENT_ID" ]; then echo "❌ ENVIRONMENT_ID not set"; exit 1; fi && \
		echo "✅ Required variables set"

prod-validate: prod-config  ## Run full production validation
	@echo "🔍 Running production validation..."
	@docker compose -f docker-compose.prod.yml --env-file .env.prod config > /dev/null
	@echo "✅ Docker Compose configuration valid"
	@echo "🔍 Checking Azure CLI..."
	@which az > /dev/null || (echo "❌ Azure CLI not installed"; exit 1)
	@az account show > /dev/null || (echo "❌ Not logged in to Azure. Run: az login"; exit 1)
	@echo "✅ Azure CLI configured"
	@echo "✅ All validation checks passed"

prod-build: prod-validate  ## Build images for production
	@echo "🔨 Building production images..."
	@make build-all
	@echo "✅ Production images built"

prod-push:  ## Push images to container registry
	@echo "📤 Pushing images to registry..."
	@source .env.prod && \
		if [ -z "$$ACR_NAME" ]; then echo "❌ ACR_NAME not set in .env.prod"; exit 1; fi && \
		ACR_LOGIN_SERVER=$$(az acr show --name $$ACR_NAME --query "loginServer" -o tsv) && \
		echo "📝 Tagging image for $$ACR_LOGIN_SERVER..." && \
		docker tag dev8-workspace:latest $$ACR_LOGIN_SERVER/dev8-workspace:latest && \
		docker tag dev8-workspace:latest $$ACR_LOGIN_SERVER/dev8-workspace:$(VERSION) && \
		echo "🔐 Logging in to ACR..." && \
		az acr login --name $$ACR_NAME && \
		echo "⬆️  Pushing images..." && \
		docker push $$ACR_LOGIN_SERVER/dev8-workspace:latest && \
		docker push $$ACR_LOGIN_SERVER/dev8-workspace:$(VERSION) && \
		echo "✅ Images pushed successfully"

prod-deploy:  ## Deploy to Azure Container Instances
	@echo "🚀 Deploying to Azure Container Instances..."
	@chmod +x deploy-to-aci.sh
	@./deploy-to-aci.sh

prod-logs:  ## View production container logs
	@source .env.prod && \
		az container logs \
			--resource-group $$RESOURCE_GROUP \
			--name $${CONTAINER_NAME:-dev8-workspace-$$ENVIRONMENT_ID} \
			--follow

prod-status:  ## Check production deployment status
	@echo "📊 Production Deployment Status"
	@echo "================================"
	@source .env.prod && \
		CONTAINER_NAME=$${CONTAINER_NAME:-dev8-workspace-$$ENVIRONMENT_ID} && \
		az container show \
			--resource-group $$RESOURCE_GROUP \
			--name $$CONTAINER_NAME \
			--query "{Name:name,Status:instanceView.state,FQDN:ipAddress.fqdn,IP:ipAddress.ip,CPU:containers[0].resources.requests.cpu,Memory:containers[0].resources.requests.memoryInGb}" \
			--output table

prod-stop:  ## Stop production container
	@echo "🛑 Stopping production container..."
	@source .env.prod && \
		az container stop \
			--resource-group $$RESOURCE_GROUP \
			--name $${CONTAINER_NAME:-dev8-workspace-$$ENVIRONMENT_ID}
	@echo "✅ Container stopped"

prod-restart:  ## Restart production container
	@echo "🔄 Restarting production container..."
	@source .env.prod && \
		az container restart \
			--resource-group $$RESOURCE_GROUP \
			--name $${CONTAINER_NAME:-dev8-workspace-$$ENVIRONMENT_ID}
	@echo "✅ Container restarted"

prod-destroy:  ## Destroy production deployment (DANGER!)
	@echo "⚠️  WARNING: This will delete the container instance!"
	@echo "Data in Azure Files will be preserved."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		source .env.prod && \
		az container delete \
			--resource-group $$RESOURCE_GROUP \
			--name $${CONTAINER_NAME:-dev8-workspace-$$ENVIRONMENT_ID} \
			--yes && \
		echo "✅ Container deleted"; \
	else \
		echo "❌ Cancelled"; \
	fi

prod-backup:  ## Backup production volumes to Azure Blob Storage
	@echo "💾 Creating backup of production volumes..."
	@source .env.prod && \
		TIMESTAMP=$$(date +%Y%m%d-%H%M%S) && \
		echo "📦 Backing up to dev8-backups/backup-$$TIMESTAMP.tar.gz" && \
		az container exec \
			--resource-group $$RESOURCE_GROUP \
			--name $${CONTAINER_NAME:-dev8-workspace-$$ENVIRONMENT_ID} \
			--exec-command "/bin/bash -c 'tar czf /tmp/backup-$$TIMESTAMP.tar.gz -C /workspace . && az storage blob upload --account-name $$STORAGE_ACCOUNT --container-name dev8-backups --name backup-$$TIMESTAMP.tar.gz --file /tmp/backup-$$TIMESTAMP.tar.gz'" && \
		echo "✅ Backup complete"

prod-help:  ## Show production deployment help
	@echo "Production Deployment Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup:"
	@echo "  1. Copy .env.prod.example to .env.prod"
	@echo "  2. Configure all required variables"
	@echo "  3. Run: make prod-validate"
	@echo ""
	@echo "Deploy:"
	@echo "  make prod-build    - Build images locally"
	@echo "  make prod-push     - Push to Azure Container Registry"
	@echo "  make prod-deploy   - Deploy to Azure Container Instances"
	@echo ""
	@echo "Manage:"
	@echo "  make prod-status   - Check deployment status"
	@echo "  make prod-logs     - View container logs"
	@echo "  make prod-stop     - Stop container"
	@echo "  make prod-restart  - Restart container"
	@echo ""
	@echo "Cleanup:"
	@echo "  make prod-destroy  - Delete container (keeps volumes)"
	@echo ""
	@echo "See PRODUCTION_CHECKLIST.md for detailed deployment guide"

.DEFAULT_GOAL := help
