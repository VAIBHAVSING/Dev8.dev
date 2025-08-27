# Contributing to Dev8.dev

Thank you for your interest in contributing to Dev8.dev! 🎉 We're building the future of cloud development environments together.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Dev8.dev.git
   cd Dev8.dev
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   # For Go development tools
   make setup-go
   ```
4. **Set up environment variables**:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your configuration
   ```
5. **Start development**:
   ```bash
   pnpm dev
   # Or use the Makefile
   make dev
   ```

## 🔧 Development Workflow

### Prerequisites

- **Node.js** 18+
- **pnpm** 9.0.0+
- **Go** 1.24+
- **PostgreSQL** 15+

### Local Development Commands

We provide both `pnpm` scripts and a `Makefile` for convenience:

```bash
# Install dependencies
make install          # or pnpm install

# Start development servers
make dev              # or pnpm dev

# Run all checks (recommended before committing)
make check-all        # runs lint, format, type-check, test, build

# Individual checks
make lint             # or pnpm lint
make format           # or pnpm format
make test             # or pnpm test
make build            # or pnpm build
make check-types      # or pnpm check-types

# Simulate CI pipeline locally
make ci

# Clean build artifacts
make clean            # or pnpm clean
```

### Before Committing

Always run the full check suite:

```bash
make check-all
```

This ensures your changes will pass our CI pipeline.

## 🤖 CI/CD Pipeline

Our GitHub Actions CI pipeline automatically runs on every pull request and push to main:

### Consolidated Pipeline Structure

We use a single CI workflow with two main language-specific pipelines:

#### **🟦 TypeScript Pipeline**

- **🧹 Linting**: ESLint with strict rules
- **🎨 Formatting**: Prettier validation
- **🔒 Type Checking**: TypeScript compiler strict checks
- **🧪 Testing**: Unit and integration tests
- **🏗️ Building**: Next.js application builds
- **📦 Security**: npm audit + CodeQL analysis

#### **🟩 Go Pipeline**

- **🧹 Linting**: go vet + staticcheck
- **🎨 Formatting**: gofmt + goimports validation
- **🧪 Testing**: Unit tests with race detection + coverage
- **🏗️ Building**: Binary compilation
- **🔐 Security**: gosec + CodeQL analysis

#### **�️ General Security & Testing**

- **🔍 Vulnerability Scanning**: Trivy for all dependencies
- **�️ Database**: PostgreSQL migration testing

### Performance Optimizations

- **📦 Smart Caching**: Go modules, pnpm store, and build artifacts
- **🎯 Change Detection**: Only runs relevant pipelines based on changed files
- **⚡ Parallel Execution**: Language pipelines run concurrently

### Local CI Simulation

Test your changes against the same pipeline locally:

```bash
# Run the full CI suite
make ci

# Or step by step
make lint
make format
make check-types
make test
make build
```

### Status Checks

All PRs must pass these consolidated checks:

- ✅ TypeScript Pipeline (lint + format + type-check + test + build + security)
- ✅ Go Pipeline (lint + format + test + build + security)
- ✅ General Security Scanning (Trivy)
- ✅ Database Migrations (PostgreSQL)

## 🎯 Ways to Contribute

### 🐛 Bug Reports

Found a bug? Please check our [existing issues](https://github.com/VAIBHAVSING/Dev8.dev/issues) first, then create a new one with:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment details

### ✨ Feature Requests

Have an idea? We'd love to hear it! Open an issue with:

- Problem description
- Proposed solution
- Use cases and benefits
- Implementation ideas (optional)

### 🔧 Code Contributions

1. **Find an issue** to work on or create one
2. **Comment** on the issue to let us know you're working on it
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Make your changes** following our coding standards
5. **Test thoroughly** - ensure all tests pass
6. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push** and create a Pull Request

## 📋 Development Guidelines

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Write **clear, descriptive** variable and function names
- Add **JSDoc comments** for public APIs

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### Testing

- Write **unit tests** for new functions
- Add **integration tests** for API endpoints
- Ensure **E2E tests** pass for critical user flows
- Run `pnpm test` before submitting

## 🏗️ Project Structure

```
Dev8.dev/
├── apps/
│   ├── web/          # Next.js frontend dashboard
│   ├── docs/         # Documentation site
│   └── agent/        # Go backend service
├── packages/
│   ├── ui/           # Shared React components
│   ├── eslint-config/
│   └── typescript-config/
└── infrastructure/   # Cloud infrastructure code
```

## 🎨 Design Guidelines

- Follow our **design system** in `packages/ui`
- Use **Tailwind CSS** for styling
- Ensure **responsive design** for all screen sizes
- Maintain **accessibility** standards (WCAG 2.1)
- Test on multiple browsers

## 🔒 Security

- **Never commit** secrets or API keys
- Use **environment variables** for configuration
- Follow **security best practices**
- Report security issues privately to security@dev8.dev

## 📞 Getting Help

- **Discord**: Join our [community](https://discord.gg/xE2u4b8S8g)
- **Issues**: Check [GitHub Issues](https://github.com/VAIBHAVSING/Dev8.dev/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/VAIBHAVSING/Dev8.dev/discussions)

## 🎉 Recognition

Contributors get:

- 🏆 **GitHub profile** credit
- 🎯 **Discord contributor** role
- 📢 **Twitter shoutouts** for major contributions
- 💌 **Early access** to new features
- 🎁 **Dev8.dev swag** (coming soon!)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Ready to contribute?** Check out our [good first issues](https://github.com/VAIBHAVSING/Dev8.dev/labels/good%20first%20issue) and join our [Discord](https://discord.gg/xE2u4b8S8g)!

Thank you for helping make Dev8.dev amazing! 🚀
