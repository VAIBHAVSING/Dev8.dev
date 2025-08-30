# Dev8.dev - Cloud Development Environment Platform

## About This File

README.md files are for humans: quick starts, project descriptions, and contribution guidelines.

AGENT.md complements this by containing the extra, sometimes detailed context coding agents need: build steps, tests, and conventions that might clutter a README or aren't relevant to human contributors.

We intentionally kept it separate to:

- Give agents a clear, predictable place for instructions.
- Keep READMEs concise and focused on human contributors.
- Provide precise, agent-focused guidance that complements existing README and docs.

Rather than introducing another proprietary file, we chose a name and format that could work for anyone. If you're building or using coding agents and find this helpful, feel free to adopt it.

## About the AGENTS.md Format

AGENTS.md emerged from collaborative efforts across the AI software development ecosystem, including OpenAI Codex, Amp, Jules from Google, Cursor, and Factory.

We're committed to helping maintain and evolve this as an open format that benefits the entire developer community, regardless of which coding agent you use.

## FAQ

**Are there required fields?**
No. AGENTS.md is just standard Markdown. Use any headings you like; the agent simply parses the text you provide.

**What if instructions conflict?**
The closest AGENTS.md to the edited file wins; explicit user chat prompts override everything.

**Will the agent run testing commands found in AGENTS.md automatically?**
Yes—if you list them. The agent will attempt to execute relevant programmatic checks and fix failures before finishing the task.

**Can I update it later?**
Absolutely. Treat AGENTS.md as living documentation.

**How do I migrate existing docs to AGENTS.md?**
Rename existing files to AGENTS.md and create symbolic links for backward compatibility:

```bash
mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md
```

**How do I configure Aider?**
Configure Aider to use AGENTS.md in `.aider.conf.yml`:

```yaml
read: AGENTS.md
```

**How do I configure Gemini CLI?**
Configure Gemini CLI to use AGENTS.md in `.gemini/settings.json`:

```json
{ "contextFileName": "AGENTS.md" }
```

## Project Overview

Dev8.dev is a cloud-based IDE hosting platform that provides fully-configured VS Code environments in the browser. It allows developers to launch customizable development environments instantly with persistent storage and transparent pricing.

**Key Features:**
- Instant launch of VS Code environments (30 seconds)
- Customizable machine specifications (t2.medium to m6g.xlarge)
- Persistent file storage with AWS S3
- Full VS Code experience in browser
- Enterprise security with SOC 2 compliance
- Transparent pay-per-use pricing

## Current Implementation Status

**Phase 1: MVP (Current Development)**
- ✅ **Authentication System**: Complete with NextAuth.js, OAuth (Google, GitHub), and credentials
- ✅ **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and protected routes
- ✅ **Backend**: Go HTTP server with health/hello endpoints and comprehensive testing
- ✅ **Database**: PostgreSQL with Prisma ORM and complete schema
- ✅ **UI Components**: Shared component library with Button, Card, Code components
- ✅ **Development Tools**: Turborepo monorepo, ESLint, Prettier, TypeScript strict mode
- ✅ **CI/CD**: GitHub Actions pipeline with parallel TypeScript/Go/Security jobs
- 🔄 **Instance Management**: AWS EC2 integration (planned)
- 🔄 **Code-server Integration**: VS Code deployment (planned)
- 🔄 **File Persistence**: S3 storage implementation (planned)

## Architecture

```
Browser → Next.js Frontend → Go/TypeScript Backend → Docker Containers → code-server VSCode
                                      ↓
                               AWS EC2 Instances + S3 Storage
```

## Technology Stack

### Frontend
- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS with PostCSS
- **Authentication:** NextAuth.js with OAuth providers (Google, GitHub) + Credentials
- **Database ORM:** Prisma with PostgreSQL
- **Validation:** Zod for schema validation
- **UI Components:** Custom React components with Tailwind CSS
- **Middleware:** Next.js middleware for route protection

### Backend
- **Language:** Go 1.24
- **Services:** REST API with JSON responses
- **Infrastructure:** AWS (EC2, S3, VPC)
- **Containerization:** Docker (planned Kubernetes orchestration)

### Development Tools
- **Monorepo:** Turborepo for task orchestration
- **Package Manager:** pnpm with workspace support
- **Linting:** ESLint with custom configs
- **Type Checking:** TypeScript strict mode
- **Code Formatting:** Prettier + gofmt/goimports
- **Testing:** Go testing framework + Jest (planned)
- **CI/CD:** GitHub Actions with parallel pipelines

## Project Structure

```
Dev8.dev/
├── apps/
│   ├── web/                 # Main Next.js frontend application
│   │   ├── app/            # Next.js 13+ app router
│   │   │   ├── (auth)/     # Authentication pages
│   │   │   │   ├── signin/ # Sign in page with credentials + OAuth
│   │   │   │   └── signup/ # Sign up page with validation
│   │   │   ├── api/        # API routes
│   │   │   │   └── auth/   # Authentication API routes
│   │   │   ├── dashboard/  # User dashboard (protected)
│   │   │   ├── profile/    # User profile management (protected)
│   │   │   ├── settings/   # Application settings (protected)
│   │   │   ├── layout.tsx  # Root layout with auth provider
│   │   │   └── page.tsx    # Landing page with auth links
│   │   ├── components/     # React components
│   │   │   └── auth-provider.tsx # NextAuth session provider
│   │   ├── lib/           # Utility libraries
│   │   │   ├── auth.ts     # NextAuth configuration
│   │   │   ├── auth-config.ts # Auth configuration factory
│   │   │   ├── prisma.ts   # Database client setup
│   │   │   └── zod.ts      # Validation schemas
│   │   ├── prisma/        # Database schema and migrations
│   │   │   └── schema.prisma # Prisma schema with User, Account, Session models
│   │   ├── types/         # TypeScript type definitions
│   │   │   └── next-auth.d.ts # NextAuth type extensions
│   │   ├── middleware.ts  # Route protection middleware
│   │   └── public/        # Static assets
│   ├── docs/              # Documentation site (Next.js)
│   │   └── app/           # Documentation pages
│   └── agent/             # Go backend service
│       ├── main.go        # HTTP server with health/hello endpoints
│       ├── main_test.go   # Unit tests for Go handlers
│       ├── go.mod         # Go module dependencies
│       ├── Makefile       # Go-specific build tasks
│       └── bin/           # Compiled binaries
├── packages/
│   ├── ui/                # Shared React UI components
│   │   └── src/          # Component library
│   │       ├── button.tsx # Button component with appName prop
│   │       ├── card.tsx   # Card component with link functionality
│   │       └── code.tsx   # Code snippet component
│   ├── eslint-config/     # Shared ESLint configuration
│   │   ├── base.js        # Base ESLint rules
│   │   ├── next.js        # Next.js specific rules
│   │   └── react-internal.js # React internal rules
│   └── typescript-config/ # Shared TypeScript configuration
│       ├── base.json      # Base TypeScript config
│       ├── nextjs.json    # Next.js specific config
│       └── react-library.json # React library config
├── node_modules/          # Dependencies (pnpm workspace)
└── infrastructure/        # Cloud infrastructure code (planned)
```

## File Structure Deep Dive

### Critical Files for AI Context

#### Root Configuration Files
- `package.json` - Monorepo scripts, dependencies, and workspace configuration
- `turbo.json` - Turborepo pipeline configuration with caching and environment variables
- `pnpm-workspace.yaml` - Workspace package management and filtering
- `Makefile` - Development shortcuts and CI simulation commands
- `.gitignore` - Excludes node_modules, .env files, build artifacts
- `context.md` - This file - comprehensive project context for AI agents

#### Web Application Architecture (`apps/web/`)
```
apps/web/
├── app/                    # Next.js 13+ App Router
│   ├── layout.tsx          # Root layout with AuthProvider and fonts
│   ├── page.tsx            # Landing page with auth navigation
│   ├── globals.css         # Tailwind CSS base styles with dark mode
│   ├── (auth)/             # Auth route group
│   │   ├── signin/page.tsx # Sign in with credentials + OAuth
│   │   └── signup/page.tsx # Registration with validation
│   ├── api/                # API routes
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts  # NextAuth handlers
│   │       └── register/route.ts       # User registration API
│   ├── dashboard/page.tsx  # Protected dashboard with navigation
│   ├── profile/page.tsx    # User profile management
│   └── settings/page.tsx   # Account settings with OAuth connections
├── components/
│   └── auth-provider.tsx   # NextAuth SessionProvider wrapper
├── lib/                    # Utility libraries
│   ├── auth.ts            # NextAuth configuration export
│   ├── auth-config.ts     # Shared auth configuration factory
│   ├── prisma.ts          # Database client singleton
│   └── zod.ts             # Form validation schemas
├── prisma/
│   └── schema.prisma      # Database schema with User/Account/Session models
├── types/
│   └── next-auth.d.ts     # NextAuth type extensions
├── middleware.ts          # Route protection and auth redirects
├── next.config.js         # Next.js configuration (minimal)
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS with Tailwind and Autoprefixer
├── eslint.config.js       # ESLint configuration using shared config
├── setup.sh               # Environment setup script
└── README.md              # Detailed setup instructions
```

#### Go Backend Service (`apps/agent/`)
```
apps/agent/
├── main.go                # HTTP server with health/hello endpoints
├── main_test.go           # Unit tests for HTTP handlers
├── go.mod                 # Go module with Go 1.24
├── setup-go-tools.sh      # Development tools installer
├── .air.toml              # Hot reload configuration
├── Makefile               # Go-specific build tasks
└── bin/                   # Compiled binaries (ignored by git)
```

#### Shared Packages
```
packages/
├── ui/src/                # Shared React components
│   ├── button.tsx         # Button with appName prop and alert
│   ├── card.tsx           # Link card with title and children
│   └── code.tsx           # Code snippet wrapper
├── eslint-config/         # ESLint configurations
│   ├── base.js            # Base rules with Turbo plugin
│   ├── next.js            # Next.js specific rules
│   └── react-internal.js  # React library rules
└── typescript-config/     # TypeScript configurations
    ├── base.json          # Base TypeScript config
    ├── nextjs.json        # Next.js specific config
    └── react-library.json # React library config
```

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials authentication
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Authentication Models
- **Account:** OAuth provider connections (Google, GitHub)
- **Session:** User sessions with token management
- **VerificationToken:** Email verification tokens
- **Authenticator:** WebAuthn support (optional)

## Validation Schemas

### Sign In Schema
```typescript
export const signInSchema = object({
  email: string().min(1, "Email is required").email("Invalid email"),
  password: string()
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});
```

### Sign Up Schema
```typescript
export const signUpSchema = object({
  name: string()
    .min(1, "Name is required")
    .min(2, "Name must be more than 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: string().min(1, "Email is required").email("Invalid email"),
  password: string()
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
  confirmPassword: string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## Development Commands Reference

### Quick Start Commands
```bash
# Setup project
git clone https://github.com/VAIBHAVSING/Dev8.dev.git
cd Dev8.dev
pnpm install
make setup-go  # Setup Go development tools

# Environment setup
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your configuration

# Database setup
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Prisma Studio (optional)

# Start development
pnpm dev  # Start all services
# OR
make dev  # Alternative using Makefile
```

### Development Workflow Commands
```bash
# Individual service development
pnpm dev --filter=web    # Next.js frontend only
pnpm dev --filter=agent  # Go backend only
pnpm dev --filter=docs   # Documentation site only

# Code quality checks
pnpm lint           # Lint all code (TypeScript + Go)
pnpm format         # Format all code
pnpm check-types    # TypeScript type checking
pnpm test           # Run all tests
pnpm build          # Build all applications

# Makefile shortcuts
make lint           # Lint all code
make format         # Format all code
make test           # Run tests
make build          # Build applications
make check-all      # Run all quality checks
make ci             # Simulate full CI pipeline locally
make clean          # Clean build artifacts
```

### Database Operations
```bash
# Prisma commands
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Create and apply migrations
pnpm db:reset       # Reset database (development only)
pnpm db:studio      # Open Prisma Studio UI
pnpm db:deploy      # Deploy migrations (production)
```

### Go Development (Agent Service)
```bash
# Go-specific commands
cd apps/agent
go run .                    # Run development server
go build -o bin/agent .     # Build binary
go test ./...               # Run tests
go vet ./...                # Lint Go code
gofmt -w .                  # Format Go code
goimports -w .              # Organize imports

# Or use pnpm scripts from root
pnpm lint:go        # Lint Go code
pnpm format:go      # Format Go code

# Hot reloading with Air
air                 # Start with hot reload (requires setup-go-tools.sh)
```

## Environment Variables

### Required Environment Variables

#### Web Application (`apps/web/.env.local`)
```bash
# Authentication
AUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"  # Alternative to AUTH_SECRET

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dev8_web?schema=public"

# OAuth Providers (Optional - Only add if using)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

#### Agent Service (`apps/agent/`)
```bash
# Server Configuration
AGENT_PORT="8080"  # Default: 8080
```

### Environment Setup
1. Copy template: `cp apps/web/.env.example apps/web/.env.local`
2. Edit `.env.local` with your actual values
3. OAuth setup instructions available in `apps/web/README.md`

## API Endpoints

### Agent Service
- `GET /` - Service status information
- `GET /health` - Health check endpoint
- `GET /hello` - Test endpoint with client IP logging

### Web Application
- `/api/auth/[...nextauth]` - NextAuth.js authentication routes
- `/api/auth/register` - User registration endpoint (POST)
- Authentication pages: `/signin`, `/signup`
- Protected pages: `/dashboard`, `/profile`, `/settings`

## Authentication Flow

### Supported Providers
1. **Credentials** - Email/password authentication with bcrypt hashing
2. **Google OAuth** - Google account integration
3. **GitHub OAuth** - GitHub account integration

### Route Protection
- **Public Routes:** `/`, `/signin`, `/signup`
- **Protected Routes:** All other routes require authentication
- **Middleware:** Automatic redirection based on auth status

### Session Management
- JWT tokens for session management
- Secure cookie-based sessions
- Automatic session refresh and validation

## UI Components

### Shared Components (`packages/ui/`)
- **Button** - Customizable button with appName prop and alert functionality
- **Card** - Link card component with title and children
- **Code** - Simple code snippet wrapper

### Authentication Pages
- **Sign In** - Form with email/password + OAuth buttons
- **Sign Up** - Registration form with validation
- **Dashboard** - Protected dashboard with navigation
- **Profile** - User profile management
- **Settings** - Application settings page

## Testing Strategy

### Go Backend
- Unit tests for HTTP handlers (`main_test.go`)
- Health check and hello endpoint testing
- HTTP status code and response validation

### Frontend (Planned)
- Component testing with React Testing Library
- Integration tests for authentication flows
- E2E tests with Playwright

## Build and Deployment

### Build Pipeline
1. **TypeScript Pipeline:** Lint → Type Check → Test → Build
2. **Go Pipeline:** Lint → Format Check → Test → Build
3. **Security Pipeline:** Vulnerability scanning

### Output Locations
- Web app: `.next/` directory
- Agent: `bin/agent` binary
- Docs: `.next/` directory

## Roadmap

### Phase 1: MVP (Current)
- ✅ User authentication & dashboard
- ✅ AWS EC2 integration
- ✅ Basic code-server deployment
- ✅ File persistence with S3
- 🔄 Instance management (start/stop/delete)
- 🔄 Basic monitoring & logs

### Phase 2: Scale
- 🔄 Kubernetes orchestration
- 🔄 Auto-scaling instances
- 🔄 Team collaboration features
- 🔄 Custom Docker images
- 🔄 SSH/terminal access
- 🔄 Billing & usage tracking

### Phase 3: Expand
- 🔄 Multi-cloud support (GCP, Azure)
- 🔄 Multiple IDE support (IntelliJ, Vim)
- 🔄 Marketplace for extensions/templates
- 🔄 API for third-party integrations
- 🔄 Enterprise SSO & audit logs

## Development Guidelines

### Code Style
- **TypeScript:** Strict mode enabled
- **Go:** Standard Go formatting with goimports
- **React:** Functional components with hooks
- **CSS:** Tailwind utility classes

### Commit Convention
- Follow conventional commits
- Use descriptive commit messages
- Reference issues when applicable

### Testing Strategy
- Unit tests for utilities and components
- Integration tests for API endpoints
- E2E tests for critical user flows

## Security Considerations

- SOC 2 compliance requirements
- Encrypted data storage
- Secure authentication flows
- Regular security audits
- Dependency vulnerability scanning
- Password hashing with bcrypt
- JWT token security
- Route protection middleware

## Performance Optimizations

- Turborepo remote caching
- Next.js optimization features
- Database query optimization
- CDN for static assets
- Lazy loading for components
- Middleware for efficient routing

## Common Development Patterns

### Authentication Implementation Patterns
```typescript
// Protected page pattern (apps/web/app/dashboard/page.tsx)
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/signin");
  }, [session, status, router]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;
  
  return <div>Protected content</div>;
}
```

### API Route Pattern
```typescript
// API route pattern (apps/web/app/api/auth/register/route.ts)
import { NextRequest, NextResponse } from "next/server";
import { signUpSchema } from "../../../../lib/zod";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = await signUpSchema.parseAsync(body);
    // Process request...
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
}
```

### Go HTTP Handler Pattern
```go
// HTTP handler pattern (apps/agent/main.go)
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    response := Response{
        Message: "Agent is healthy",
        Status:  "ok",
    }
    
    if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, "Failed to encode response", http.StatusInternalServerError)
        return
    }
}
```

### Component Export Pattern
```typescript
// Shared component pattern (packages/ui/src/button.tsx)
"use client";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <button
      className={className}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
```

## Common Issues and Solutions

### Database Connection Issues
- Ensure PostgreSQL is running and accessible
- Check `DATABASE_URL` format in `.env.local`
- Run `pnpm db:generate` after schema changes
- Use `pnpm db:reset` for development database reset

### Authentication Configuration
- OAuth providers are optional - only configured if env vars present
- `AUTH_SECRET` is required in production environments
- Session management uses JWT strategy for better performance
- Middleware automatically redirects unauthenticated users

### Build and Deployment
- Turborepo caches build outputs for faster subsequent builds
- Environment variables are defined in `turbo.json` for proper caching
- Go binaries output to `apps/agent/bin/` directory
- Next.js builds to `.next/` directories

### Development Workflow Issues
- Use `make check-all` before committing to simulate CI
- Go tools setup requires running `./setup-go-tools.sh` in `apps/agent/`
- Hot reloading available with `air` for Go development
- ESLint configurations are shared across packages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Ensure all checks pass
5. Submit a pull request

## Support

- **Documentation:** https://docs.dev8.dev
- **Discord:** https://discord.gg/xE2u4b8S8g
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

## AI Agent Guidelines

### For Code Generation
- Use TypeScript strict mode for all new code
- Follow existing authentication patterns for protected routes
- Implement proper error handling with try/catch blocks
- Use Zod for input validation in API routes
- Follow the established file structure and naming conventions

### For Debugging
- Check environment variables first for configuration issues
- Verify database connection and Prisma client generation
- Review middleware logs for authentication/routing issues
- Use `make check-all` to reproduce CI pipeline locally
- Check both TypeScript and Go build outputs for errors

### For Feature Development
- Start with database schema changes in `prisma/schema.prisma`
- Implement API routes before frontend components
- Add proper TypeScript types and Zod validation
- Include unit tests for new Go handlers
- Update this context file for significant architectural changes

---

*This context file provides comprehensive project understanding for AI assistants like Cursor, Gemini CLI, Claude, and GitHub Copilot. It includes current implementation status, development patterns, and troubleshooting guidance for effective code assistance.*
