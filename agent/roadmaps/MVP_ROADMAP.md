# 🚀 Dev8.dev MVP Implementation Roadmap

## 📋 Executive Summary

**Objective:** Launch functional cloud IDE platform in 4 weeks  
**Approach:** Azure ACI + Direct Azure SDK + Iterative development  
**Success Criteria:** Users can create, access, and code in browser-based VS Code environments

**Key Metrics:**
- Environment creation: < 2 minutes
- VS Code load time: < 30 seconds
- File persistence: 100% reliable
- Uptime target: 99% (MVP)

---

## 🎯 MVP Scope

### ✅ In Scope
- User authentication (OAuth + Credentials)
- Environment creation (Node.js, Python, Go)
- Browser-based VS Code access
- File persistence across sessions
- Basic environment management (start/stop/delete)
- Simple hardware configuration (3 presets)
- Azure ACI infrastructure
- Basic monitoring and logs

### ❌ Out of Scope (Phase 2)
- SSH access
- Browser terminal
- Custom hardware configs
- Multiple regions
- Team collaboration
- Advanced monitoring
- Billing integration
- GitHub Copilot integration

---

## 📅 4-Week Timeline

```
Week 1: Foundation        Week 2: Backend         Week 3: Frontend        Week 4: Launch
─────────────────────────────────────────────────────────────────────────────────
Azure Setup              Go Backend              API Routes              Testing
Database Schema          ACI Integration         UI Components           Bug Fixes
Type Definitions         Docker Images           Dashboard Pages         Documentation
Environment Setup        Testing                 Integration             Deployment

Milestone: Infra Ready   Milestone: Env Mgmt     Milestone: Full Flow    Milestone: MVP Live
```

---

## 📆 Week 1: Foundation (March 29 - April 4)

### Goals
- ✅ Infrastructure provisioned
- ✅ Database schema ready
- ✅ Shared types defined
- ✅ Development environment set up

### Day 1-2: Azure Infrastructure Setup

**Issue:** [#27 - Azure Infrastructure Setup](https://github.com/VAIBHAVSING/Dev8.dev/issues/27)

**Tasks:**
```bash
□ Create Azure Resource Group
  az group create --name dev8-mvp-rg --location eastus

□ Provision Storage Account
  az storage account create \
    --name dev8mvpstorage \
    --resource-group dev8-mvp-rg \
    --location eastus \
    --sku Standard_LRS

□ Create Container Registry
  az acr create \
    --resource-group dev8-mvp-rg \
    --name dev8mvpregistry \
    --sku Basic \
    --admin-enabled true

□ Set up Service Principal
  az ad sp create-for-rbac \
    --name dev8-mvp-sp \
    --role contributor \
    --scopes /subscriptions/{sub-id}/resourceGroups/dev8-mvp-rg

□ Document credentials in .env files
  - AZURE_SUBSCRIPTION_ID
  - AZURE_TENANT_ID
  - AZURE_CLIENT_ID
  - AZURE_CLIENT_SECRET
  - AZURE_RESOURCE_GROUP
  - AZURE_STORAGE_ACCOUNT
  - AZURE_CONTAINER_REGISTRY

□ Test Azure CLI access
□ Configure cost alerts
□ Set up resource tagging
```

**Deliverables:**
- Azure resources created
- Service principal configured
- Credentials documented
- Cost monitoring enabled

**Time:** 4-6 hours  
**Owner:** DevOps/Infrastructure team

---

### Day 3: Database Schema Extension

**Issue:** [#14 - Database Schema Setup](https://github.com/VAIBHAVSING/Dev8.dev/issues/14)

**Tasks:**
```typescript
// apps/web/prisma/schema.prisma

□ Add Environment model
model Environment {
  id                  String   @id @default(cuid())
  userId              String
  name                String
  status              EnvironmentStatus @default(CREATING)
  
  // Cloud Configuration
  cloudProvider       String   @default("azure")
  cloudRegion         String   @default("eastus")
  aciContainerGroupId String?
  aciPublicIp         String?
  
  // Storage
  azureFileShareName  String?
  vsCodeUrl           String?
  
  // Resources
  cpuCores            Int      @default(2)
  memoryGB            Int      @default(4)
  storageGB           Int      @default(20)
  
  // Template
  baseImage           String   @default("node")
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  lastAccessedAt      DateTime @default(now())
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@map("environments")
}

□ Add EnvironmentStatus enum
enum EnvironmentStatus {
  CREATING
  STARTING
  RUNNING
  STOPPING
  STOPPED
  ERROR
  DELETING
}

□ Add Template model
model Template {
  id           String @id @default(cuid())
  name         String @unique
  displayName  String
  description  String
  baseImage    String
  defaultCPU   Int    @default(2)
  defaultMemory Int   @default(4)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("templates")
}

□ Add ResourceUsage model (future)
model ResourceUsage {
  id             String   @id @default(cuid())
  environmentId  String
  timestamp      DateTime @default(now())
  cpuUsagePercent Float?
  memoryUsageMB  Int?
  
  @@index([environmentId, timestamp])
  @@map("resource_usage")
}

□ Update User model to include environments relation
model User {
  // ... existing fields
  environments Environment[]
}

□ Create migration
  pnpm --filter web prisma migrate dev --name add_environments

□ Generate Prisma client
  pnpm --filter web prisma generate

□ Create seed data for templates
  // prisma/seed.ts
  const templates = [
    { name: 'nodejs', displayName: 'Node.js', baseImage: 'node:lts' },
    { name: 'python', displayName: 'Python', baseImage: 'python:3.11' },
    { name: 'golang', displayName: 'Go', baseImage: 'golang:1.21' },
  ];

□ Test database operations
□ Verify indexes created
□ Document schema changes
```

**Deliverables:**
- Database schema extended
- Migrations created and tested
- Seed data populated
- Documentation updated

**Time:** 4-6 hours  
**Owner:** Backend team

---

### Day 4: Environment Types Package

**Issue:** [#13 - Environment Types Package](https://github.com/VAIBHAVSING/Dev8.dev/issues/13)

**Tasks:**
```typescript
□ Create package structure
  mkdir -p packages/environment-types/src
  cd packages/environment-types

□ Set up package.json
{
  "name": "@repo/environment-types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^4.1.1"
  }
}

□ Define core types (src/types.ts)
export type CloudProvider = 'azure' | 'aws' | 'gcp';

export type EnvironmentStatus = 
  | 'creating' 
  | 'starting' 
  | 'running' 
  | 'stopping'
  | 'stopped' 
  | 'error' 
  | 'deleting';

export interface Environment {
  id: string;
  userId: string;
  name: string;
  status: EnvironmentStatus;
  cloudProvider: CloudProvider;
  baseImage: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  vsCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HardwareConfig {
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
}

□ Define validation schemas (src/schemas.ts)
import { z } from 'zod';

export const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(50),
  baseImage: z.enum(['node', 'python', 'golang']),
  cpuCores: z.number().min(1).max(8),
  memoryGB: z.number().min(2).max(16),
  storageGB: z.number().min(20).max(200),
});

export const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  cpuCores: z.number().min(1).max(8).optional(),
  memoryGB: z.number().min(2).max(16).optional(),
});

□ Define constants (src/constants.ts)
export const HARDWARE_PRESETS = {
  small: { cpuCores: 1, memoryGB: 2, storageGB: 20 },
  medium: { cpuCores: 2, memoryGB: 4, storageGB: 50 },
  large: { cpuCores: 4, memoryGB: 8, storageGB: 100 },
} as const;

export const BASE_IMAGES = {
  node: 'dev8registry.azurecr.io/vscode-node:latest',
  python: 'dev8registry.azurecr.io/vscode-python:latest',
  golang: 'dev8registry.azurecr.io/vscode-go:latest',
} as const;

□ Create index exports (src/index.ts)
export * from './types';
export * from './schemas';
export * from './constants';

□ Add to workspace
  # Add to pnpm-workspace.yaml
  packages:
    - 'packages/*'

□ Build and test
  pnpm --filter @repo/environment-types build

□ Use in web app
  # apps/web/package.json
  "dependencies": {
    "@repo/environment-types": "workspace:*"
  }

□ Document usage
```

**Deliverables:**
- Shared types package created
- Validation schemas defined
- Used in web and agent
- Documentation complete

**Time:** 2-3 hours  
**Owner:** Full-stack team

---

### Day 5: Development Environment Setup

**Tasks:**
```bash
□ Configure VSCode workspace settings
□ Set up debugging configurations
□ Document development workflow
□ Create .env.example templates
□ Test full development setup
  - pnpm install works
  - pnpm dev starts all services
  - Database migrations work
  - Type checking passes

□ Create development documentation
□ Set up pre-commit hooks (optional)
```

**Deliverables:**
- Team can start development
- Clear setup documentation
- All services running locally

**Time:** 2-3 hours

---

**Week 1 Completion Criteria:**
- [ ] Azure resources provisioned and accessible
- [ ] Database schema includes Environment models
- [ ] Shared types package building and used
- [ ] Development environment working for all team
- [ ] Documentation updated in agent/ directory

**Week 1 Review:** Friday, April 4, 2PM
- Demo: Show Azure portal resources
- Demo: Show database schema in Prisma Studio
- Demo: Show types being used in code
- Retrospective: What went well, what to improve
- Planning: Finalize Week 2 tasks

---

## 📆 Week 2: Backend Core (April 5-11)

### Goals
- ✅ Go agent can create ACI containers
- ✅ Azure Files integration working
- ✅ VS Code images built and tested
- ✅ Environment lifecycle implemented

### Day 1-3: Go Backend with Azure SDK

**Issue:** [#15 - Go Backend Environment Manager](https://github.com/VAIBHAVSING/Dev8.dev/issues/15)

**Architecture:**
```
apps/agent/
├── cmd/server/main.go           # Entry point
├── internal/
│   ├── server/
│   │   ├── server.go            # HTTP server
│   │   ├── routes.go            # Route handlers
│   │   └── middleware.go        # Middleware
│   ├── environment/
│   │   ├── service.go           # Business logic
│   │   ├── handler.go           # HTTP handlers
│   │   └── models.go            # Domain models
│   ├── azure/
│   │   ├── aci.go               # ACI operations
│   │   ├── storage.go           # Files operations
│   │   └── config.go            # Azure config
│   └── config/
│       └── config.go            # App configuration
└── go.mod                        # Dependencies
```

**Tasks:**

**Day 1: Project Structure & Azure Client**
```go
□ Add Azure SDK dependencies
require (
    github.com/Azure/azure-sdk-for-go/sdk/azcore v1.9.0
    github.com/Azure/azure-sdk-for-go/sdk/azidentity v1.4.0
    github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerinstance/armcontainerinstance v1.0.0
    github.com/Azure/azure-sdk-for-go/sdk/storage/azfile v1.0.0
    github.com/gorilla/mux v1.8.1
    github.com/rs/cors v1.10.1
)

□ Create Azure authentication (internal/azure/config.go)
type AzureConfig struct {
    SubscriptionID    string
    TenantID         string
    ClientID         string
    ClientSecret     string
    ResourceGroup    string
    StorageAccount   string
    ContainerRegistry string
    Region           string
}

func NewAzureClients(cfg *AzureConfig) (*Clients, error) {
    cred, err := azidentity.NewClientSecretCredential(
        cfg.TenantID,
        cfg.ClientID,
        cfg.ClientSecret,
        nil,
    )
    // Create ACI and Storage clients
}

□ Create ACI client wrapper (internal/azure/aci.go)
type ACIClient struct {
    client         *armcontainerinstance.ContainerGroupsClient
    config         *AzureConfig
}

func (c *ACIClient) CreateVSCodeContainer(ctx context.Context, req CreateContainerRequest) error {
    // Implementation
}

□ Create Storage client wrapper (internal/azure/storage.go)
type StorageClient struct {
    client      *azfile.ServiceClient
    accountName string
}

func (s *StorageClient) CreateFileShare(ctx context.Context, name string) error {
    // Implementation
}

□ Test Azure clients
  - Authenticate successfully
  - List existing resources
  - Create test file share
  - Delete test file share
```

**Day 2: Environment Service**
```go
□ Create environment service (internal/environment/service.go)
type Service struct {
    aciClient     *azure.ACIClient
    storageClient *azure.StorageClient
    config        *config.Config
}

func (s *Service) CreateEnvironment(ctx context.Context, req CreateEnvironmentRequest) (*Environment, error) {
    // 1. Validate request
    // 2. Create Azure File share
    // 3. Create ACI container group
    // 4. Return environment details
}

func (s *Service) GetEnvironment(ctx context.Context, id string) (*Environment, error)
func (s *Service) StopEnvironment(ctx context.Context, id string) error
func (s *Service) StartEnvironment(ctx context.Context, id string) error
func (s *Service) DeleteEnvironment(ctx context.Context, id string) error
func (s *Service) GetEnvironmentStatus(ctx context.Context, id string) (*EnvironmentStatus, error)

□ Implement error handling
type ServiceError struct {
    Code    string
    Message string
    Details map[string]interface{}
}

□ Add logging
  import "log/slog"
  
  logger := slog.Default().With("service", "environment")
  logger.Info("Creating environment", "id", id)

□ Write unit tests
  // internal/environment/service_test.go
  func TestCreateEnvironment(t *testing.T)
  func TestStopEnvironment(t *testing.T)
```

**Day 3: HTTP Server & Routes**
```go
□ Create HTTP server (internal/server/server.go)
type Server struct {
    router      *mux.Router
    envService  *environment.Service
    config      *config.Config
}

func (s *Server) Start() error {
    addr := fmt.Sprintf(":%s", s.config.Port)
    log.Printf("Server starting on %s", addr)
    return http.ListenAndServe(addr, s.router)
}

□ Create routes (internal/server/routes.go)
func (s *Server) setupRoutes() {
    // Health checks
    s.router.HandleFunc("/health", s.handleHealth).Methods("GET")
    
    // Environment management
    s.router.HandleFunc("/environments", s.handleCreateEnvironment).Methods("POST")
    s.router.HandleFunc("/environments", s.handleListEnvironments).Methods("GET")
    s.router.HandleFunc("/environments/{id}", s.handleGetEnvironment).Methods("GET")
    s.router.HandleFunc("/environments/{id}/start", s.handleStartEnvironment).Methods("POST")
    s.router.HandleFunc("/environments/{id}/stop", s.handleStopEnvironment).Methods("POST")
    s.router.HandleFunc("/environments/{id}", s.handleDeleteEnvironment).Methods("DELETE")
    s.router.HandleFunc("/environments/{id}/status", s.handleGetStatus).Methods("GET")
}

□ Add middleware (internal/server/middleware.go)
func LoggingMiddleware(next http.Handler) http.Handler
func CORSMiddleware(next http.Handler) http.Handler
func AuthMiddleware(next http.Handler) http.Handler (basic for now)

□ Implement handlers (internal/environment/handler.go)
func (s *Server) handleCreateEnvironment(w http.ResponseWriter, r *http.Request) {
    var req CreateEnvironmentRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    env, err := s.envService.CreateEnvironment(r.Context(), req)
    if err != nil {
        respondError(w, err)
        return
    }
    
    respondJSON(w, http.StatusCreated, env)
}

□ Test endpoints
  curl -X POST http://localhost:8080/environments \
    -H "Content-Type: application/json" \
    -d '{"name":"test","baseImage":"node","cpuCores":2,"memoryGB":4}'

□ Integration tests
  // Test full flow from HTTP to Azure
```

**Deliverables:**
- Go agent with Azure SDK integrated
- Environment CRUD operations working
- ACI containers can be created/deleted
- Azure Files mounting functional
- Comprehensive tests passing

**Time:** 12-16 hours  
**Owner:** Backend team

---

### Day 4-5: VS Code Docker Images

**Issue:** [#21 - VS Code Server Docker Images](https://github.com/VAIBHAVSING/Dev8.dev/issues/21)

**Tasks:**

**Base Image**
```dockerfile
□ Create base Dockerfile (docker/base/Dockerfile)
FROM ubuntu:22.04

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install common tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create workspace directory
RUN mkdir -p /workspace
WORKDIR /workspace

# Expose code-server port
EXPOSE 8080

# Start code-server (secure: password auth from env)
# SECURITY NOTE:
#  - Do NOT use --auth none in any environment (even dev) when exposed over a network.
#  - Provide CODE_SERVER_PASSWORD (preferred) or PASSWORD via container environment / secret.
#  - For Azure ACI: store secret in Azure Key Vault or secure parameter and inject at deployment.
#  - Enforce network restrictions (private VNet / IP allow list, NSG rules) + HTTPS termination at ingress.
#  - Regenerate per deployment; never bake static password into image.
ENV CODE_SERVER_PASSWORD=changeme  # Overridden by runtime secret injection
CMD ["/bin/sh", "-c", "if [ -z \"$CODE_SERVER_PASSWORD\" ] && [ -n \"$PASSWORD\" ]; then CODE_SERVER_PASSWORD=$PASSWORD; fi; exec code-server --bind-addr 0.0.0.0:8080 --auth password --disable-telemetry ."]

□ Build and test base image
  docker build -t vscode-base:latest ./docker/base
  docker run -p 8080:8080 vscode-base:latest
  # Test: Open http://localhost:8080 in browser
```

**Node.js Image**
```dockerfile
□ Create Node.js Dockerfile (docker/nodejs/Dockerfile)
FROM vscode-base:latest

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs

# Install common VS Code extensions
RUN code-server --install-extension ms-vscode.vscode-typescript-next
RUN code-server --install-extension esbenp.prettier-vscode
RUN code-server --install-extension dbaeumer.vscode-eslint

# Set up sample project
COPY workspace-templates/nodejs /workspace
RUN npm install

□ Build and test
  docker build -t vscode-node:latest ./docker/nodejs
  docker run -p 8080:8080 vscode-node:latest
```

**Python Image**
```dockerfile
□ Create Python Dockerfile (docker/python/Dockerfile)
FROM vscode-base:latest

# Install Python
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    python3-venv

# Install common VS Code extensions
RUN code-server --install-extension ms-python.python
RUN code-server --install-extension ms-python.vscode-pylance

# Set up sample project
COPY workspace-templates/python /workspace
RUN pip3 install -r requirements.txt

□ Build and test
```

**Go Image**
```dockerfile
□ Create Go Dockerfile (docker/golang/Dockerfile)
FROM vscode-base:latest

# Install Go
RUN wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
RUN tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
ENV PATH=$PATH:/usr/local/go/bin

# Install common VS Code extensions
RUN code-server --install-extension golang.go

# Set up sample project
COPY workspace-templates/golang /workspace
RUN go mod download

□ Build and test
```

**Push to Registry**
```bash
□ Login to Azure Container Registry
  az acr login --name dev8mvpregistry

□ Tag images
  docker tag vscode-node:latest dev8mvpregistry.azurecr.io/vscode-node:latest
  docker tag vscode-python:latest dev8mvpregistry.azurecr.io/vscode-python:latest
  docker tag vscode-go:latest dev8mvpregistry.azurecr.io/vscode-go:latest

□ Push images
  docker push dev8mvpregistry.azurecr.io/vscode-node:latest
  docker push dev8mvpregistry.azurecr.io/vscode-python:latest
  docker push dev8mvpregistry.azurecr.io/vscode-go:latest

□ Verify in Azure portal

□ Create GitHub Action for automated builds (future)
```

**Deliverables:**
- Base VS Code image created
- Node.js, Python, Go images created
- Images pushed to Azure Container Registry
- Images tested locally and in ACI
- Documentation for adding new images

**Time:** 6-8 hours  
**Owner:** DevOps team

---

**Week 2 Completion Criteria:**
- [ ] Go agent can create/delete ACI containers
- [ ] Azure Files mounting works correctly
- [ ] VS Code images load in < 30 seconds
- [ ] All environment operations tested
- [ ] Integration tests passing
- [ ] Performance meets targets

**Week 2 Review:** Friday, April 11, 2PM
- Demo: Create environment via API
- Demo: VS Code loads in browser
- Demo: Files persist after container restart
- Performance review: Creation time, load time
- Planning: Week 3 frontend tasks

---

## 📆 Week 3: Frontend Integration (April 12-18)

### Goals
- ✅ API routes connecting to Go backend
- ✅ Environment management UI working
- ✅ Complete user flow functional
- ✅ VS Code iframe integration

### Day 1-2: API Routes

**Issue:** [#9 - Next.js API Routes](https://github.com/VAIBHAVSING/Dev8.dev/issues/9)

**Tasks:**
```typescript
□ Create environment API routes
  apps/web/app/api/environments/route.ts

// GET /api/environments - List user environments
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const environments = await prisma.environment.findMany({
    where: { userId: session.user.id },
    orderBy: { lastAccessedAt: 'desc' },
  });
  
  return NextResponse.json({ environments });
}

// POST /api/environments - Create environment
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const validated = createEnvironmentSchema.parse(body);
  
  // Call Go agent
  const response = await fetch('http://agent:8080/environments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: session.user.id,
      ...validated,
    }),
  });
  
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
  
  const agentData = await response.json();
  
  // Save to database
  const environment = await prisma.environment.create({
    data: {
      userId: session.user.id,
      name: validated.name,
      baseImage: validated.baseImage,
      cpuCores: validated.cpuCores,
      memoryGB: validated.memoryGB,
      storageGB: validated.storageGB,
      status: 'CREATING',
      aciContainerGroupId: agentData.containerGroupId,
      cloudProvider: 'azure',
      cloudRegion: 'eastus',
    },
  });
  
  return NextResponse.json({ environment }, { status: 201 });
}

□ Create environment detail routes
  apps/web/app/api/environments/[id]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get environment details
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Delete environment
}

□ Create environment action routes
  apps/web/app/api/environments/[id]/start/route.ts
  apps/web/app/api/environments/[id]/stop/route.ts
  apps/web/app/api/environments/[id]/status/route.ts

□ Add error handling
□ Add request validation
□ Add rate limiting (basic)
□ Write API tests
□ Document endpoints
```

**Deliverables:**
- API routes implement full CRUD
- Proper authentication checks
- Error handling and validation
- Tests passing

**Time:** 6-8 hours

---

### Day 3-4: Frontend Components

**Issue:** [#8 - Frontend Components](https://github.com/VAIBHAVSING/Dev8.dev/issues/8)

**Tasks:**
```typescript
□ Create EnvironmentCard component
  apps/web/components/environment-card.tsx

interface EnvironmentCardProps {
  environment: Environment;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

export function EnvironmentCard({ environment, ...actions }: EnvironmentCardProps) {
  const statusColor = {
    creating: 'yellow',
    running: 'green',
    stopped: 'gray',
    error: 'red',
  }[environment.status];
  
  return (
    <Card>
      <CardHeader>
        <StatusBadge status={environment.status} color={statusColor} />
        <h3>{environment.name}</h3>
      </CardHeader>
      <CardBody>
        <div>CPU: {environment.cpuCores} cores</div>
        <div>Memory: {environment.memoryGB} GB</div>
        <div>Template: {environment.baseImage}</div>
        <div>Created: {formatDate(environment.createdAt)}</div>
      </CardBody>
      <CardFooter>
        {environment.status === 'running' && (
          <Button onClick={() => actions.onOpen(environment.id)}>
            Open IDE
          </Button>
        )}
        {environment.status === 'stopped' && (
          <Button onClick={() => actions.onStart(environment.id)}>
            Start
          </Button>
        )}
        {environment.status === 'running' && (
          <Button onClick={() => actions.onStop(environment.id)}>
            Stop
          </Button>
        )}
        <Button variant="danger" onClick={() => actions.onDelete(environment.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

□ Create CreateEnvironmentForm component
  apps/web/components/create-environment-form.tsx

export function CreateEnvironmentForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    baseImage: 'node',
    preset: 'medium',
  });
  
  const presets = {
    small: { cpuCores: 1, memoryGB: 2, storageGB: 20 },
    medium: { cpuCores: 2, memoryGB: 4, storageGB: 50 },
    large: { cpuCores: 4, memoryGB: 8, storageGB: 100 },
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Environment Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <Select
        label="Template"
        value={formData.baseImage}
        onChange={(value) => setFormData({ ...formData, baseImage: value })}
      >
        <Option value="node">Node.js</Option>
        <Option value="python">Python</Option>
        <Option value="golang">Go</Option>
      </Select>
      
      <RadioGroup
        label="Size"
        value={formData.preset}
        onChange={(value) => setFormData({ ...formData, preset: value })}
      >
        <Radio value="small">Small (1 CPU, 2GB RAM)</Radio>
        <Radio value="medium">Medium (2 CPU, 4GB RAM)</Radio>
        <Radio value="large">Large (4 CPU, 8GB RAM)</Radio>
      </RadioGroup>
      
      <Button type="submit">Create Environment</Button>
    </form>
  );
}

□ Create VSCodeEmbed component
  apps/web/components/vscode-embed.tsx

export function VSCodeEmbed({ url }: { url: string }) {
  return (
    <div className="h-full w-full">
      <iframe
        src={url}
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  );
}

□ Create StatusIndicator component
□ Create LoadingSpinner component
□ Create ErrorBoundary component
□ Write component tests
```

**Deliverables:**
- Reusable UI components
- Proper TypeScript types
- Responsive design
- Accessibility features
- Component documentation

**Time:** 8-10 hours

---

### Day 5: Dashboard Pages

**Issue:** [#22 - Dashboard Pages](https://github.com/VAIBHAVSING/Dev8.dev/issues/22)

**Tasks:**
```typescript
□ Create environments list page
  apps/web/app/environments/page.tsx

'use client';

export default function EnvironmentsPage() {
  const { data, error, mutate } = useSWR('/api/environments');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const handleCreate = async (formData) => {
    const response = await fetch('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      mutate(); // Refresh list
      setShowCreateForm(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this environment?')) return;
    
    await fetch(`/api/environments/${id}`, { method: 'DELETE' });
    mutate();
  };
  
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <LoadingSpinner />;
  
  return (
    <div>
      <Header>
        <h1>My Environments</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          New Environment
        </Button>
      </Header>
      
      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <CreateEnvironmentForm onSubmit={handleCreate} />
        </Modal>
      )}
      
      {data.environments.length === 0 ? (
        <EmptyState>
          <p>No environments yet</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Your First Environment
          </Button>
        </EmptyState>
      ) : (
        <Grid>
          {data.environments.map((env) => (
            <EnvironmentCard
              key={env.id}
              environment={env}
              onStart={(id) => handleStart(id)}
              onStop={(id) => handleStop(id)}
              onDelete={(id) => handleDelete(id)}
              onOpen={(id) => router.push(`/environments/${id}/ide`)}
            />
          ))}
        </Grid>
      )}
    </div>
  );
}

□ Create environment detail page
  apps/web/app/environments/[id]/page.tsx

□ Create IDE page
  apps/web/app/environments/[id]/ide/page.tsx

export default function IDEPage({ params }: { params: { id: string } }) {
  const { data, error } = useSWR(`/api/environments/${params.id}`);
  
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <LoadingSpinner />;
  
  if (data.environment.status !== 'running') {
    return (
      <div>
        <p>Environment is {data.environment.status}</p>
        {data.environment.status === 'stopped' && (
          <Button onClick={() => startEnvironment(params.id)}>
            Start Environment
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="h-screen w-screen">
      <VSCodeEmbed url={data.environment.vsCodeUrl} />
    </div>
  );
}

□ Add loading states
□ Add error handling
□ Add empty states
□ Test user flows
□ Mobile responsive design
```

**Deliverables:**
- Complete dashboard pages
- Environment list view
- Environment creation flow
- IDE access page
- Mobile responsive

**Time:** 4-6 hours

---

**Week 3 Completion Criteria:**
- [ ] API routes fully functional
- [ ] Environment CRUD works from UI
- [ ] VS Code loads in iframe
- [ ] User can create → access → delete environment
- [ ] No critical bugs
- [ ] Mobile responsive

**Week 3 Review:** Friday, April 18, 2PM
- Demo: Complete user flow
- Demo: Mobile responsiveness
- User testing session
- Bug triage
- Planning: Week 4 polish tasks

---

## 📆 Week 4: Polish & Launch (April 19-25)

### Goals
- ✅ File persistence verified
- ✅ Real-time status updates
- ✅ Critical bugs fixed
- ✅ Production deployment
- ✅ Documentation complete

### Day 1-2: File Persistence Testing

**Issue:** [#18 - File Persistence](https://github.com/VAIBHAVSING/Dev8.dev/issues/18)

**Tasks:**
```bash
□ Test Azure Files mounting
  - Create environment
  - Create files in VS Code
  - Stop environment
  - Start environment
  - Verify files exist

□ Test large file operations
  - Upload 100MB file
  - Download file
  - Verify integrity

□ Test concurrent access
  - Multiple tabs editing same file
  - Conflict resolution
  - Auto-save functionality

□ Test edge cases
  - Storage quota limits
  - Permission issues
  - Network failures

□ Add monitoring
  - Track file sync operations
  - Alert on sync failures
  - Log file operations

□ Document known issues
□ Create backup strategy
```

**Deliverables:**
- File persistence 100% reliable
- Edge cases handled
- Monitoring in place
- Documentation updated

**Time:** 6-8 hours

---

### Day 3: Real-time Status Updates

**Issue:** [#20 - Real-time Status](https://github.com/VAIBHAVSING/Dev8.dev/issues/20)

**Tasks:**
```typescript
□ Implement polling-based status updates
  // apps/web/hooks/use-environment-status.ts
  
export function useEnvironmentStatus(environmentId: string) {
  const { data, error } = useSWR(
    `/api/environments/${environmentId}/status`,
    { refreshInterval: 5000 } // Poll every 5 seconds
  );
  
  return {
    status: data?.status,
    isLoading: !error && !data,
    isError: error,
  };
}

□ Add status indicators
  - Real-time status badges
  - Progress indicators for creating
  - Error states with retry

□ Optimize polling
  - Stop polling when environment stable
  - Exponential backoff for errors
  - Pause when tab not visible

□ Add toast notifications
  - "Environment ready"
  - "Environment stopped"
  - "Operation failed"

□ Test status updates
  - All state transitions
  - Multiple environments
  - Network failures
```

**Deliverables:**
- Real-time status updates working
- Optimized polling
- User notifications
- Tests passing

**Time:** 4-6 hours

---

### Day 4: Bug Fixes & Testing

**Tasks:**
```bash
□ Run comprehensive testing
  - Manual testing of all flows
  - Cross-browser testing
  - Mobile testing
  - Performance testing

□ Fix critical bugs
  - Authentication issues
  - Environment creation failures
  - VS Code loading issues
  - File sync problems

□ Security review
  - Authentication hardening
  - Input validation
  - Error message sanitization
  - Rate limiting verification

□ Performance optimization
  - API response times
  - Frontend bundle size
  - Database query optimization
  - Image loading optimization

□ Accessibility audit
  - Keyboard navigation
  - Screen reader support
  - Color contrast
  - ARIA labels
```

**Deliverables:**
- All critical bugs fixed
- Security reviewed
- Performance optimized
- Accessibility compliant

**Time:** 6-8 hours

---

### Day 5: Documentation & Deployment

**Tasks:**
```bash
□ Update documentation
  - README with screenshots
  - Setup instructions
  - API documentation
  - Troubleshooting guide

□ Create user documentation
  - Getting started guide
  - Feature walkthrough
  - FAQ
  - Video tutorial (optional)

□ Prepare deployment
  - Environment variables configured
  - Database migrations ready
  - Monitoring set up
  - Alerts configured

□ Deploy to production
  - Frontend: Vercel deployment
  - Backend: Docker container deployment
  - Database: Managed PostgreSQL
  - Verify deployment

□ Post-launch monitoring
  - Set up error tracking
  - Monitor performance
  - Watch for issues
  - Respond to user feedback

□ Launch announcement
  - Blog post
  - Twitter/LinkedIn
  - Product Hunt (optional)
  - Email to early users
```

**Deliverables:**
- Documentation complete
- Production deployment successful
- Monitoring active
- Launch announcement published

**Time:** 4-6 hours

---

**Week 4 Completion Criteria:**
- [ ] File persistence 100% reliable
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Production deployment successful
- [ ] Launch announcement published
- [ ] MVP LIVE! 🎉

**Week 4 Review:** Friday, April 25, 4PM
- Demo: Live production site
- Metrics review: Performance, errors
- User feedback review
- Retrospective: Full MVP cycle
- Planning: Post-MVP priorities

---

## 🎯 Post-MVP Priorities

### Immediate (Week 5-6)
1. Bug fixes from user feedback
2. Performance optimization based on metrics
3. Documentation improvements
4. User onboarding flow refinement

### Short-term (Month 2)
1. SSH access implementation
2. Browser terminal
3. Multiple hardware configurations
4. Team collaboration features

### Medium-term (Month 3-4)
1. GitHub Copilot integration
2. Advanced monitoring and analytics
3. Billing and usage tracking
4. API for programmatic access

### Long-term (Month 5+)
1. Kubernetes migration (if needed)
2. Multi-region deployment
3. Enterprise features
4. Mobile apps

---

## 📊 Success Metrics

### Technical Metrics
- Environment creation time: < 2 minutes
- VS Code load time: < 30 seconds
- File sync latency: < 5 seconds
- API P99 latency: < 500ms
- Uptime: > 99%

### Business Metrics
- New user signups: Target 100 in first month
- Active environments: Target 50 concurrent
- User retention: > 40% weekly retention
- NPS score: > 50

### Quality Metrics
- Test coverage: > 70%
- Error rate: < 1%
- Customer satisfaction: > 4.5/5
- Support ticket resolution: < 24 hours

---

## 🚨 Risk Management

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Azure ACI quota limits | Medium | High | Request quota increase early |
| File sync failures | Medium | High | Implement robust retry logic |
| Container startup time | Low | Medium | Optimize images, consider warm pools |
| Cost overruns | Medium | High | Set up billing alerts, resource limits |

### Schedule Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Azure SDK issues | Low | High | Have backup plan, vendor support |
| Scope creep | High | High | Strict scope definition, say no |
| Team availability | Medium | Medium | Clear responsibilities, buffer time |
| Integration complexity | Medium | High | Early integration testing |

---

## 🎯 Team Structure

### Recommended Roles
- **Tech Lead** (1): Architecture decisions, code review
- **Backend Engineer** (1): Go agent, Azure integration
- **Frontend Engineer** (1): Next.js UI, components
- **DevOps** (0.5): Infrastructure, deployment
- **Designer** (0.5): UI/UX, branding

### Communication
- **Daily Standups**: 15 min, 9 AM
- **Weekly Planning**: Monday, 10 AM
- **Demo/Review**: Friday, 2 PM
- **Retrospective**: Friday, 3 PM

### Tools
- **Project Management**: GitHub Projects
- **Communication**: Slack/Discord
- **Code Review**: GitHub PR
- **Monitoring**: Azure Monitor, Vercel Analytics
- **Error Tracking**: Sentry (optional)

---

## 📝 Definition of Done

### For Each Feature
- [ ] Code written and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Tested in staging
- [ ] Approved by tech lead
- [ ] Deployed to production

### For MVP Launch
- [ ] All Week 1-4 tasks complete
- [ ] Success metrics defined and tracked
- [ ] Documentation complete
- [ ] Monitoring and alerts configured
- [ ] Launch announcement published
- [ ] Support process established

---

**Roadmap Version:** 1.0  
**Last Updated:** March 29, 2025  
**Next Review:** After Week 1 completion

**Let's ship this! 🚀**
