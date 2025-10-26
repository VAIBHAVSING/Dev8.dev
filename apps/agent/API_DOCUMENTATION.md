# Dev8 Agent API Documentation

## Overview

The Dev8 Agent is a RESTful API service that manages cloud development environments. It provides endpoints for creating, managing, and monitoring containerized development environments across cloud providers (primarily Azure).

**Base URL:** `http://<host>:<port>`  
**Default Port:** `8080`  
**API Version:** `v1`

## Table of Contents

- [Authentication](#authentication)
- [Health Check Endpoints](#health-check-endpoints)
- [Environment Management](#environment-management)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

---

## Authentication

Currently, the agent uses a placeholder authentication system. Future versions will implement proper JWT-based authentication.

**Current Behavior:**
- UserID defaults to `"default-user"` if not provided
- No authentication headers required (development only)

---

## Health Check Endpoints

### GET /health

Returns the overall health status of the agent service.

**Response:**
```json
{
  "status": "healthy",
  "uptime": "2h15m30s",
  "service": "dev8-agent",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

### GET /ready

Returns the readiness status of the agent service.

**Response:**
```json
{
  "status": "ready"
}
```

**Status Codes:**
- `200 OK` - Service is ready to accept requests

---

### GET /live

Returns the liveness status of the agent service.

**Response:**
```json
{
  "status": "alive"
}
```

**Status Codes:**
- `200 OK` - Service is alive

---

### GET /

Returns basic service information.

**Response:**
```json
{
  "service": "dev8-agent",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "api": "/api/v1"
  }
}
```

**Status Codes:**
- `200 OK` - Always

---

## Environment Management

### POST /api/v1/environments

Creates a new development environment with the Docker Hub workspace image.

**Request Body:**
```json
{
  "userId": "user-123",
  "name": "my-dev-environment",
  "cloudProvider": "AZURE",
  "cloudRegion": "eastus",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  "baseImage": "node",
  
  // Optional: Dynamic per-workspace configuration
  "githubToken": "ghp_xxxxxxxxxxxx",
  "gitUserName": "John Doe",
  "gitUserEmail": "john@example.com",
  "sshPublicKey": "ssh-rsa AAAAB3...",
  "codeServerPassword": "secure-password-123",
  "anthropicApiKey": "sk-ant-xxx",
  "openaiApiKey": "sk-proj-xxx",
  "geminiApiKey": "AIza..."
}
```

**Request Fields:**

**Required:**
- `userId` (string, optional): User identifier. Defaults to "default-user" if not provided
- `name` (string, required): Human-readable name for the environment
- `cloudProvider` (string, required): Cloud provider. Must be one of: `AZURE`, `AWS`, or `GCP`
- `cloudRegion` (string, required): Cloud region for deployment (e.g., "eastus", "westus2")
- `cpuCores` (integer, required): Number of CPU cores (1-4)
- `memoryGB` (integer, required): Memory in GB (1-16)
- `storageGB` (integer, required): Storage size in GB (10-100)
- `baseImage` (string, required): Base image type (currently unused, all workspaces use `vaibhavsing/dev8-workspace:latest`)

**Optional - Dynamic Workspace Configuration:**
- `githubToken` (string): GitHub personal access token for private repo access
- `gitUserName` (string): Git user name for commits
- `gitUserEmail` (string): Git user email for commits
- `sshPublicKey` (string): SSH public key for remote access
- `codeServerPassword` (string): Password for VS Code Server web interface
- `anthropicApiKey` (string): Anthropic API key for Claude
- `openaiApiKey` (string): OpenAI API key for GPT models
- `geminiApiKey` (string): Google Gemini API key

**Notes:**
- All optional fields are passed as **secure environment variables** to the workspace container
- Secrets are stored using Azure Container Instances SecureValue (not visible in logs)
- The Agent uses the Docker Hub image `vaibhavsing/dev8-workspace:latest` for all workspaces
- `baseImage` parameter is currently ignored (kept for backward compatibility)

**Response:**
```json
{
  "environment": {
    "id": "env-abc123",
    "userId": "user-123",
    "name": "my-dev-environment",
    "status": "CREATING",
    "cloudProvider": "AZURE",
    "cloudRegion": "eastus",
    "aciContainerGroupId": "/subscriptions/.../containerGroups/env-abc123",
    "aciPublicIp": "20.185.123.45",
    "azureFileShareName": "workspace-env-abc123",
    "vsCodeUrl": "https://20.185.123.45:8443",
    "cpuCores": 2,
    "memoryGB": 4,
    "storageGB": 20,
    "baseImage": "mcr.microsoft.com/devcontainers/base:ubuntu",
    "createdAt": "2025-10-24T10:30:00Z",
    "updatedAt": "2025-10-24T10:30:00Z",
    "lastAccessedAt": "2025-10-24T10:30:00Z"
  },
  "message": "Environment created successfully"
}
```

**Status Codes:**
- `201 Created` - Environment created successfully
- `400 Bad Request` - Invalid request body or parameters
- `500 Internal Server Error` - Server error during creation

---

### GET /api/v1/environments/{id}

Retrieves details of a specific environment.

**Path Parameters:**
- `id` (string, required): Environment ID

**Response:**
```json
{
  "environment": {
    "id": "env-abc123",
    "userId": "user-123",
    "name": "my-dev-environment",
    "status": "RUNNING",
    "cloudProvider": "AZURE",
    "cloudRegion": "eastus",
    "aciContainerGroupId": "/subscriptions/.../containerGroups/env-abc123",
    "aciPublicIp": "20.185.123.45",
    "azureFileShareName": "workspace-env-abc123",
    "vsCodeUrl": "https://20.185.123.45:8443",
    "cpuCores": 2,
    "memoryGB": 4,
    "storageGB": 20,
    "baseImage": "mcr.microsoft.com/devcontainers/base:ubuntu",
    "createdAt": "2025-10-24T10:30:00Z",
    "updatedAt": "2025-10-24T10:30:00Z",
    "lastAccessedAt": "2025-10-24T11:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Environment found
- `404 Not Found` - Environment not found
- `401 Unauthorized` - User not authorized to access this environment

---

### GET /api/v1/environments

Lists all environments for the current user.

**Query Parameters:**
- `page` (integer, optional): Page number for pagination (default: 1)
- `pageSize` (integer, optional): Number of items per page (default: 20)

**Response:**
```json
{
  "environments": [
    {
      "id": "env-abc123",
      "userId": "user-123",
      "name": "my-dev-environment",
      "status": "RUNNING",
      "cloudProvider": "AZURE",
      "cloudRegion": "eastus",
      "cpuCores": 2,
      "memoryGB": 4,
      "storageGB": 20,
      "baseImage": "mcr.microsoft.com/devcontainers/base:ubuntu",
      "createdAt": "2025-10-24T10:30:00Z",
      "updatedAt": "2025-10-24T10:30:00Z",
      "lastAccessedAt": "2025-10-24T11:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

**Status Codes:**
- `200 OK` - List retrieved successfully

---

### POST /api/v1/environments/{id}/start

Starts a stopped environment.

**Path Parameters:**
- `id` (string, required): Environment ID

**Response:**
```json
{
  "message": "Environment started successfully",
  "id": "env-abc123"
}
```

**Status Codes:**
- `200 OK` - Environment started successfully
- `404 Not Found` - Environment not found
- `400 Bad Request` - Environment cannot be started (already running or invalid state)

---

### POST /api/v1/environments/{id}/stop

Stops a running environment.

**Path Parameters:**
- `id` (string, required): Environment ID

**Response:**
```json
{
  "message": "Environment stopped successfully",
  "id": "env-abc123"
}
```

**Status Codes:**
- `200 OK` - Environment stopped successfully
- `404 Not Found` - Environment not found
- `400 Bad Request` - Environment cannot be stopped (already stopped or invalid state)

---

### POST /api/v1/environments/{id}/activity

Reports activity for an environment (used by the workspace supervisor).

**Path Parameters:**
- `id` (string, required): Environment ID

**Request Body:**
```json
{
  "snapshot": {
    "lastIDEActivity": "2025-10-24T11:00:00Z",
    "lastSSHActivity": "2025-10-24T10:55:00Z",
    "activeIDEConnections": 1,
    "activeSSHConnections": 0
  },
  "timestamp": "2025-10-24T11:00:00Z"
}
```

**Request Fields:**
- `snapshot` (object, required): Activity snapshot data
  - `lastIDEActivity` (timestamp): Last IDE activity timestamp
  - `lastSSHActivity` (timestamp): Last SSH activity timestamp
  - `activeIDEConnections` (integer): Number of active IDE connections
  - `activeSSHConnections` (integer): Number of active SSH connections
- `timestamp` (timestamp, required): Report timestamp

**Note:** The environment ID is taken from the path parameter `{id}` and does not need to be included in the request body.

**Response:**
```json
{
  "message": "Activity recorded",
  "environmentId": "env-abc123",
  "snapshot": {
    "lastIDEActivity": "2025-10-24T11:00:00Z",
    "lastSSHActivity": "2025-10-24T10:55:00Z",
    "activeIDEConnections": 1,
    "activeSSHConnections": 0
  },
  "timestamp": "2025-10-24T11:00:00Z"
}
```

**Status Codes:**
- `200 OK` - Activity recorded successfully
- `400 Bad Request` - Invalid activity data
- `404 Not Found` - Environment not found

---

### DELETE /api/v1/environments/{id}

Deletes an environment and all associated resources.

**Path Parameters:**
- `id` (string, required): Environment ID

**Response:**
```json
{
  "message": "Environment deleted successfully",
  "id": "env-abc123"
}
```

**Status Codes:**
- `200 OK` - Environment deleted successfully
- `404 Not Found` - Environment not found
- `401 Unauthorized` - User not authorized to delete this environment

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "message": "Detailed error description"
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Authentication required or failed |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server-side error |

### Application Error Codes

In addition to HTTP status codes, the API returns specific application error codes in the response body to provide more granular error identification:

| Error Code | HTTP Status | Description | Common Causes |
|------------|-------------|-------------|---------------|
| `INVALID_REQUEST` | 400 | Request validation failed | Missing required fields, invalid data types, values out of range |
| `NOT_FOUND` | 404 | Resource not found | Invalid environment ID, resource deleted |
| `UNAUTHORIZED` | 401 | User not authorized | Missing authentication, invalid permissions |
| `ENVIRONMENT_ERROR` | 500 | Environment operation failed | Azure API errors, resource creation failures |
| `SERVICE_ERROR` | 500 | Internal service error | Database errors, unexpected exceptions |

**Example Error Response with Code:**
```json
{
  "error": "INVALID_REQUEST",
  "message": "cpuCores must be between 1 and 4"
}
```

### Error Response Examples

**400 Bad Request:**
```json
{
  "error": "Invalid request",
  "message": "cpuCores must be between 1 and 4"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found",
  "message": "environment with ID 'env-xyz' not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "failed to create Azure Container Instance"
}
```

---

## Data Models

### Environment Status

Possible environment status values:

- `CREATING` - Environment is being created
- `STARTING` - Environment is starting up
- `RUNNING` - Environment is running and accessible
- `STOPPING` - Environment is shutting down
- `STOPPED` - Environment is stopped
- `ERROR` - Environment encountered an error
- `DELETING` - Environment is being deleted

### Cloud Providers

Supported cloud providers:

- `AZURE` - Microsoft Azure
- `AWS` - Amazon Web Services
- `GCP` - Google Cloud Platform

### Resource Limits

| Resource | Minimum | Maximum | Default |
|----------|---------|---------|---------|
| CPU Cores | 1 | 4 | 2 |
| Memory (GB) | 1 | 16 | 4 |
| Storage (GB) | 10 | 100 | 20 |

---

## Configuration

### Environment Variables

The agent can be configured using the following environment variables:

- `PORT` - Server port (default: 8080)
- `HOST` - Server host (default: 0.0.0.0)
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_CLIENT_ID` - Azure client ID
- `AZURE_CLIENT_SECRET` - Azure client secret
- `AZURE_RESOURCE_GROUP` - Azure resource group name
- `AZURE_STORAGE_ACCOUNT` - Azure storage account name
- `AZURE_STORAGE_KEY` - Azure storage account key
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

### Example Configuration

```bash
PORT=8080
HOST=0.0.0.0
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_RESOURCE_GROUP=dev8-resources
AZURE_STORAGE_ACCOUNT=dev8storage
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://dev8.dev
```

---

## Examples

### Creating an Environment

```bash
curl -X POST http://localhost:8080/api/v1/environments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Dev Environment",
    "cloudProvider": "AZURE",
    "cloudRegion": "eastus",
    "cpuCores": 2,
    "memoryGB": 4,
    "storageGB": 20,
    "baseImage": "mcr.microsoft.com/devcontainers/base:ubuntu"
  }'
```

### Getting Environment Details

```bash
curl http://localhost:8080/api/v1/environments/env-abc123
```

### Starting an Environment

```bash
curl -X POST http://localhost:8080/api/v1/environments/env-abc123/start
```

### Stopping an Environment

```bash
curl -X POST http://localhost:8080/api/v1/environments/env-abc123/stop
```

### Deleting an Environment

```bash
curl -X DELETE http://localhost:8080/api/v1/environments/env-abc123
```

### Reporting Activity

```bash
curl -X POST http://localhost:8080/api/v1/environments/env-abc123/activity \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot": {
      "lastIDEActivity": "2025-10-24T11:00:00Z",
      "lastSSHActivity": "2025-10-24T10:55:00Z",
      "activeIDEConnections": 1,
      "activeSSHConnections": 0
    },
    "timestamp": "2025-10-24T11:00:00Z"
  }'
```

---

## Middleware

The agent includes the following middleware:

### CORS Middleware

Handles Cross-Origin Resource Sharing (CORS) requests. Configured via `CORS_ALLOWED_ORIGINS` environment variable.

### Logging Middleware

Logs all incoming HTTP requests with:
- Request method
- Request path
- Response status code
- Request duration
- Client IP address

---

## Notes

- All timestamps are in ISO 8601 format (RFC3339)
- All responses are in JSON format with `Content-Type: application/json`
- The service uses graceful shutdown with a 30-second timeout
- Container instances are configured with persistent storage via Azure File Shares
- VS Code Server is automatically configured with HTTPS support
