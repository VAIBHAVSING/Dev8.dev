#!/bin/bash

# Setup script for Go development tools in the monorepo

echo "🔧 Setting up Go development tools..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go first."
    exit 1
fi

echo "✅ Go $(go version | cut -d' ' -f3) found"

# Install golangci-lint if not present
if ! command -v golangci-lint &> /dev/null; then
    echo "📦 Installing golangci-lint..."
<<<<<<< HEAD
    curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.55.2
=======
    curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin latest
>>>>>>> 6c208e89cfd9111d6f3217b9f725aebcc95d9627
    
    # Add to PATH if needed
    if [[ ":$PATH:" != *":$(go env GOPATH)/bin:"* ]]; then
        echo "export PATH=\$PATH:$(go env GOPATH)/bin" >> ~/.bashrc
        export PATH=$PATH:$(go env GOPATH)/bin
    fi
else
    echo "✅ golangci-lint found"
fi

# Install goimports if not present
if ! command -v goimports &> /dev/null; then
    echo "📦 Installing goimports..."
    go install golang.org/x/tools/cmd/goimports@latest
else
    echo "✅ goimports found"
fi

# Install gofumpt for better formatting
if ! command -v gofumpt &> /dev/null; then
    echo "📦 Installing gofumpt..."
    go install mvdan.cc/gofumpt@latest
else
    echo "✅ gofumpt found"
fi

# Install Air for hot reloading during development
if ! command -v air &> /dev/null; then
    echo "📦 Installing Air for hot reloading..."
    go install github.com/cosmtrek/air@latest
else
    echo "✅ air found"
fi

echo "🎉 Go development tools setup complete!"

# Create .air.toml for hot reloading
if [ ! -f ".air.toml" ]; then
    echo "📄 Creating .air.toml configuration..."
    cat > .air.toml << 'EOF'
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  args_bin = []
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ."
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  include_file = []
  kill_delay = "0s"
  log = "build-errors.log"
  poll = false
  poll_interval = 0
  rerun = false
  rerun_delay = 500
  send_interrupt = false
  stop_on_root = false

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  main_only = false
  time = false

[misc]
  clean_on_exit = false

[screen]
  clear_on_rebuild = false
  keep_scroll = true
EOF
fi

echo "🚀 You can now use:"
echo "  - pnpm format:go    # Format Go code"
echo "  - pnpm lint:go      # Lint Go code"
echo "  - pnpm test         # Run Go tests"
echo "  - air               # Hot reload during development"
