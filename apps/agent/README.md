# Go Agent

A high-performance Go microservice for the Dev8.dev monorepo.

## 🚀 Features

- RESTful API with JSON responses
- Health check endpoint
- Hot reloading during development
- Comprehensive linting and formatting
- Test coverage reporting
- Docker support

## 📋 Prerequisites

- Go 1.24 or later
- Make (optional, for convenience commands)

## 🛠️ Setup

### Quick Setup

Run the setup script to install all Go development tools:

```bash
./setup-go-tools.sh
```

This will install:

- `golangci-lint` - Comprehensive linter
- `goimports` - Import formatting
- `gofumpt` - Enhanced Go formatter
- `air` - Hot reloading

### Manual Setup

```bash
# Install dependencies
go mod tidy

# Install development tools
go install golang.org/x/tools/cmd/goimports@latest
go install mvdan.cc/gofumpt@latest
go install github.com/cosmtrek/air@latest

# Install golangci-lint
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.55.2
```

## 🏃 Development

### Using pnpm (from monorepo root)

```bash
# Start development server with hot reload
pnpm dev

# Build the application
pnpm build

# Run linter
pnpm lint:go

# Format code
pnpm format:go

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

### Using Make (from agent directory)

```bash
# Show all available commands
make help

# Development with hot reload
make dev

# Build
make build

# Run tests with coverage
make test-coverage

# Lint code
make lint

# Format code
make format

# Install tools
make install-tools

# Run all checks
make check
```

### Using Go directly

```bash
# Run in development
go run .

# Build
go build -o bin/agent .

# Test
go test ./...

# Format
go fmt ./...
goimports -w .

# Lint
golangci-lint run
```

## 🔧 Configuration

### Environment Variables

- `AGENT_PORT` - Port to run the server on (default: 8080)

### Hot Reloading

The project includes `.air.toml` configuration for hot reloading during development. Simply run:

```bash
air
```

Or from the monorepo root:

```bash
pnpm dev
```

## 📡 API Endpoints

### `GET /`

Root endpoint with basic information.

**Response:**

```json
{
  "message": "Go Agent API",
  "status": "running"
}
```

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "message": "Agent is healthy",
  "status": "ok"
}
```

### `GET /hello`

Hello world endpoint.

**Response:**

```json
{
  "message": "Hello from Go Agent",
  "status": "success"
}
```

## 🧪 Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Using make
make test-coverage
```

## 📦 Building

```bash
# Build binary
go build -o bin/agent .

# Build with make
make build

# Cross-compile for different platforms
GOOS=linux GOARCH=amd64 go build -o bin/agent-linux-amd64 .
GOOS=windows GOARCH=amd64 go build -o bin/agent-windows-amd64.exe .
GOOS=darwin GOARCH=amd64 go build -o bin/agent-darwin-amd64 .
```

## 🐳 Docker

```bash
# Build Docker image
make docker-build

# Or manually
docker build -t agent .
```

## 🔍 Code Quality

This project enforces high code quality standards:

- **Linting**: `golangci-lint` with comprehensive rules
- **Formatting**: `gofmt` and `goimports` for consistent code style
- **Testing**: Comprehensive test coverage
- **Type Safety**: Strict Go type checking

### Pre-commit Checks

Before committing, run:

```bash
make check
```

This will:

1. Check code formatting
2. Run the linter
3. Execute all tests

## 🗂️ Project Structure

```
apps/agent/
├── main.go              # Main application entry point
├── go.mod              # Go module definition
├── go.sum              # Go module checksums
├── Makefile            # Development commands
├── .golangci.yaml      # Linter configuration
├── .air.toml           # Hot reload configuration
├── setup-go-tools.sh   # Development tools setup
├── bin/                # Built binaries (gitignored)
├── tmp/                # Temporary files for hot reload
└── README.md          # This file
```

## 🤝 Contributing

1. Follow the existing code style
2. Run `make check` before committing
3. Add tests for new features
4. Update documentation as needed

## 📄 License

This project is part of the Dev8.dev monorepo and follows the same license terms.
