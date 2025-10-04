# Dev8 Agent Service

Go-based backend service for managing cloud development environments on Azure Container Instances (ACI).

## 🎯 Features

- ✅ **Azure ACI Integration**: Direct integration with Azure Container Instances
- ✅ **Multi-Region Support**: Deploy environments across multiple Azure regions
- ✅ **Persistent Storage**: Azure Files integration for workspace persistence
- ✅ **Environment Lifecycle**: Create, start, stop, delete cloud environments
- ✅ **RESTful API**: Complete HTTP API for environment management
- ✅ **Health Monitoring**: Built-in health check and readiness endpoints
- ✅ **Graceful Shutdown**: Proper shutdown handling for production

## 🚀 Quick Start

```bash
# Install dependencies
go mod download

# Copy environment template
cp .env.example .env

# Run the service
go run main.go
```

## 📡 API Endpoints

### Environment Management

- `POST /api/v1/environments` - Create new environment
- `GET /api/v1/environments` - List all environments
- `GET /api/v1/environments/{id}` - Get environment details
- `POST /api/v1/environments/{id}/start` - Start environment
- `POST /api/v1/environments/{id}/stop` - Stop environment
- `DELETE /api/v1/environments/{id}` - Delete environment

See full documentation in the main README.
