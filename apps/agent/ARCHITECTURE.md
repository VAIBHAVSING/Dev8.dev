# Dev8 Agent Architecture Documentation

## Overview

This document addresses the architecture decisions for the Dev8 Agent service, specifically clarifying database implementation, communication protocols, and integration patterns with the Next.js frontend.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Communication Protocol](#communication-protocol)
3. [Service Responsibilities](#service-responsibilities)
4. [Integration Pattern](#integration-pattern)
5. [Current Implementation Status](#current-implementation-status)
6. [Future Roadmap](#future-roadmap)

---

## Database Architecture

### ❌ No Database in Go Agent

**The Go Agent is intentionally stateless and does NOT have a database.**

#### Why No Database in Go Agent?

1. **Separation of Concerns**
   - **Go Agent**: Infrastructure orchestration (Azure ACI, Azure Files)
   - **Next.js Backend**: Data persistence, business logic, user management

2. **Stateless Design**
   - Go Agent operates as a pure API for cloud resource management
   - No persistent state stored in the agent
   - All environment metadata stored in Next.js PostgreSQL database

3. **Simplified Deployment**
   - Go Agent can be horizontally scaled without database coordination
   - No database migrations or schema management in Go
   - Easier to deploy across multiple regions

### Database Location: Next.js + Prisma + PostgreSQL

**All persistent data lives in the Next.js application:**

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │          PostgreSQL Database (Prisma)            │  │
│  │                                                   │  │
│  │  • User                 (Auth, Profile)          │  │
│  │  • Account              (OAuth Accounts)         │  │
│  │  • Session              (User Sessions)          │  │
│  │  • Environment          (Environment Metadata)   │  │
│  │  • Template             (Environment Templates)  │  │
│  │  • ResourceUsage        (Usage Metrics)          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Location: /apps/web/prisma/schema.prisma               │
└─────────────────────────────────────────────────────────┘
```

### Environment Data Flow

```
1. User creates environment via Next.js UI
   ↓
2. Next.js API validates request & checks user auth
   ↓
3. Next.js saves Environment record to PostgreSQL (status: CREATING)
   ↓
4. Next.js calls Go Agent HTTP API to provision infrastructure
   ↓
5. Go Agent creates Azure resources (Container + File Share)
   ↓
6. Go Agent returns Azure resource IDs & URLs
   ↓
7. Next.js updates Environment record in PostgreSQL
   (status: RUNNING, aciPublicIp, vsCodeUrl, etc.)
   ↓
8. User accesses environment via URL from database
```

### Current Placeholder Code in Go Agent

In `apps/agent/internal/services/environment.go`, you'll see:

```go
// GetEnvironment retrieves an environment by ID
func (s *EnvironmentService) GetEnvironment(ctx context.Context, envID, userID string) (*models.Environment, error) {
    // In a real implementation, this would fetch from database
    // For now, we'll return a not found error
    return nil, models.ErrNotFound("environment not found")
}
```

**This is intentional!** The Go Agent should NOT fetch from a database. Instead:

1. **Option A**: Next.js passes full environment details in each request
2. **Option B**: Go Agent maintains an in-memory cache synced from Next.js
3. **Option C**: Remove these methods and handle all lookups in Next.js

**Recommended: Option A** - Pass environment metadata from Next.js to Go Agent for start/stop/delete operations.

---

## Communication Protocol

### ❌ NOT Using gRPC

**The system uses pure REST/HTTP APIs for communication.**

#### Why REST over gRPC?

1. **Simplicity**
   - No Protocol Buffer compilation
   - Easy debugging with curl/Postman
   - Standard HTTP tools and middleware

2. **Browser Compatibility**
   - Next.js API routes work seamlessly with REST
   - No gRPC-Web gateway required
   - Direct fetch() API calls

3. **Tooling & Observability**
   - Standard HTTP load balancers
   - Standard API gateways (Azure API Management)
   - Easy logging and monitoring

4. **Future Flexibility**
   - Can add gRPC later if performance demands it
   - GraphQL as alternative for complex queries
   - WebSockets for real-time updates

### Communication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│                                                              │
│  React Components ──fetch()──> Next.js API Routes          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP REST/JSON
                            │
┌─────────────────────────────────────────────────────────────┐
│              Next.js Backend (Port 3000)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Next.js API Routes                       │    │
│  │  /app/api/                                         │    │
│  │    • /auth/[...nextauth]      (NextAuth)          │    │
│  │    • /auth/register           (User registration)  │    │
│  │    • /environments/*          (TO BE IMPLEMENTED)  │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ Prisma ORM                        │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         PostgreSQL Database                        │    │
│  │  • Users, Sessions, Accounts                       │    │
│  │  • Environments (metadata)                         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP REST/JSON
                            │ (TO BE IMPLEMENTED)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Go Agent (Port 8080)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        REST API (gorilla/mux)                      │    │
│  │  /api/v1/                                          │    │
│  │    POST   /environments          (Create)          │    │
│  │    GET    /environments          (List)            │    │
│  │    GET    /environments/{id}     (Get)             │    │
│  │    POST   /environments/{id}/start                 │    │
│  │    POST   /environments/{id}/stop                  │    │
│  │    DELETE /environments/{id}     (Delete)          │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ Azure SDK                         │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Azure Cloud Services                       │    │
│  │  • Container Instances (ACI)                       │    │
│  │  • File Storage (Azure Files)                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### API Communication Example

#### 1. Create Environment Flow

**Client → Next.js:**

```http
POST https://dev8.dev/api/environments
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "My Dev Environment",
  "baseImage": "node",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  "region": "eastus"
}
```

**Next.js → Go Agent:**

```http
POST http://localhost:8080/api/v1/environments
Content-Type: application/json

{
  "userId": "user_abc123",
  "name": "My Dev Environment",
  "baseImage": "node",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  "cloudRegion": "eastus"
}
```

**Go Agent → Azure SDK:**

```go
// Creates Azure Container Instance
azureClient.CreateContainerGroup(ctx, "eastus", "rg-eastus", "container-name", spec)

// Creates Azure File Share
storageClient.CreateFileShare(ctx, "workspace-abc123-env456", 20)
```

**Go Agent → Next.js Response:**

```json
{
  "id": "env-1234567890",
  "name": "My Dev Environment",
  "status": "RUNNING",
  "aciContainerGroupId": "container-group-name",
  "aciPublicIp": "20.185.123.45",
  "azureFileShareName": "workspace-abc123-env456",
  "vsCodeUrl": "http://env-abc123.eastus.azurecontainer.io:8080",
  "cloudRegion": "eastus",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  "createdAt": "2025-10-04T12:00:00Z",
  "updatedAt": "2025-10-04T12:00:00Z"
}
```

**Next.js → PostgreSQL:**

```sql
INSERT INTO environments (
  id, user_id, name, status, cloud_provider, cloud_region,
  aci_container_group_id, aci_public_ip, azure_file_share_name,
  vs_code_url, cpu_cores, memory_gb, storage_gb, base_image,
  created_at, updated_at, last_accessed_at
) VALUES (
  'env-1234567890', 'user_abc123', 'My Dev Environment', 'RUNNING',
  'AZURE', 'eastus', 'container-group-name', '20.185.123.45',
  'workspace-abc123-env456', 'http://env-abc123.eastus.azurecontainer.io:8080',
  2, 4, 20, 'node', NOW(), NOW(), NOW()
);
```

---

## Service Responsibilities

### Next.js Backend Responsibilities

✅ **Data Management**

- User authentication & authorization
- Environment CRUD operations in database
- User profiles and preferences
- Billing and usage tracking
- Resource quotas and limits

✅ **Business Logic**

- Validate user requests
- Enforce resource limits
- Calculate pricing
- Manage subscriptions
- Audit logging

✅ **API Gateway**

- Authenticate requests
- Rate limiting
- Request transformation
- Error handling
- Response formatting

### Go Agent Responsibilities

✅ **Infrastructure Orchestration**

- Azure Container Instance provisioning
- Azure File Share creation/deletion
- Container lifecycle (start/stop)
- Resource monitoring
- Multi-region deployment

✅ **Cloud Integration**

- Azure SDK operations
- Retry logic for cloud operations
- Timeout management
- Error handling for cloud failures

✅ **Stateless Operations**

- No database access
- No session management
- Pure infrastructure API
- Idempotent operations

❌ **NOT Responsible For**

- User authentication
- Data persistence
- Business logic
- Billing calculations
- User management

---

## Integration Pattern

### Recommended Implementation

#### Step 1: Create Next.js API Routes

**File**: `/apps/web/app/api/environments/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate request
  const body = await request.json();
  const { name, baseImage, cpuCores, memoryGB, storageGB, region } = body;

  // 3. Validate user quotas
  const userEnvCount = await prisma.environment.count({
    where: { userId: session.user.id, status: { in: ["RUNNING", "STOPPED"] } },
  });

  if (userEnvCount >= 5) {
    // Max 5 environments per user
    return NextResponse.json(
      { error: "Environment limit reached" },
      { status: 429 },
    );
  }

  // 4. Create environment record in database (status: CREATING)
  const environment = await prisma.environment.create({
    data: {
      userId: session.user.id,
      name,
      baseImage,
      cpuCores,
      memoryGB,
      storageGB,
      cloudRegion: region,
      cloudProvider: "AZURE",
      status: "CREATING",
    },
  });

  try {
    // 5. Call Go Agent to provision infrastructure
    const agentResponse = await fetch(`${AGENT_URL}/api/v1/environments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        name,
        baseImage,
        cpuCores,
        memoryGB,
        storageGB,
        cloudRegion: region,
      }),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent error: ${agentResponse.statusText}`);
    }

    const agentData = await agentResponse.json();

    // 6. Update environment with Azure resource details
    const updatedEnvironment = await prisma.environment.update({
      where: { id: environment.id },
      data: {
        status: "RUNNING",
        aciContainerGroupId: agentData.environment.aciContainerGroupId,
        aciPublicIp: agentData.environment.aciPublicIp,
        azureFileShareName: agentData.environment.azureFileShareName,
        vsCodeUrl: agentData.environment.vsCodeUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedEnvironment, { status: 201 });
  } catch (error) {
    // 7. Update environment status to ERROR on failure
    await prisma.environment.update({
      where: { id: environment.id },
      data: { status: "ERROR" },
    });

    console.error("Failed to create environment:", error);
    return NextResponse.json(
      { error: "Failed to provision environment" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // List user's environments from database
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const environments = await prisma.environment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(environments);
}
```

#### Step 2: Add Environment Variables

**File**: `/apps/web/.env.example`

```env
# Existing variables...

# Go Agent Configuration
AGENT_URL=http://localhost:8080
AGENT_API_KEY=your-api-key-here  # For agent-to-agent auth
```

#### Step 3: Update Go Agent (Remove Database Placeholders)

**File**: `/apps/agent/internal/services/environment.go`

```go
// Remove GetEnvironment method entirely
// Next.js should pass all needed data in requests

// Update StartEnvironment to accept full environment data
func (s *EnvironmentService) StartEnvironment(ctx context.Context, req *models.StartEnvironmentRequest) error {
    // Validate request
    if req.ACIContainerGroupID == "" || req.CloudRegion == "" {
        return models.ErrInvalidRequest("missing required fields")
    }

    // Get region configuration
    regionConfig := s.config.GetRegion(req.CloudRegion)
    if regionConfig == nil {
        return models.ErrInternalServer("region configuration not found")
    }

    resourceGroup := regionConfig.ResourceGroupName
    if resourceGroup == "" {
        resourceGroup = s.config.Azure.ResourceGroupName
    }

    // Start the container group
    if err := s.azureClient.StartContainerGroup(ctx, req.CloudRegion, resourceGroup, req.ACIContainerGroupID); err != nil {
        return fmt.Errorf("failed to start container group: %w", err)
    }

    return nil
}

// Add request model
type StartEnvironmentRequest struct {
    CloudRegion         string `json:"cloudRegion"`
    ACIContainerGroupID string `json:"aciContainerGroupId"`
}
```

---

## Current Implementation Status

### ✅ Implemented

1. **Next.js Authentication** - Complete with NextAuth.js
2. **PostgreSQL Database** - Prisma schema with Environment model
3. **Go Agent HTTP Server** - REST API with gorilla/mux
4. **Azure SDK Integration** - ACI and Azure Files clients
5. **Multi-Region Support** - Configuration and client initialization

### 🚧 In Progress (PR #36)

1. **Go Agent Environment Management** - Create/Start/Stop/Delete operations
2. **Azure Resource Provisioning** - Container groups and file shares
3. **Health Checks** - Readiness and liveness endpoints

### ❌ Not Yet Implemented

1. **Next.js → Go Agent Integration**
   - API routes in Next.js to call Go Agent
   - Environment CRUD operations from frontend
   - Error handling and retry logic

2. **Authentication Between Services**
   - API key or JWT validation in Go Agent
   - Secure communication between Next.js and Go Agent

3. **Real-Time Updates**
   - WebSocket or Server-Sent Events for environment status
   - Progress updates during provisioning

4. **Monitoring & Observability**
   - Structured logging
   - Metrics (Prometheus)
   - Distributed tracing

---

## Future Roadmap

### Phase 1: Complete MVP Integration

1. **Implement Next.js API Routes**
   - `/api/environments` - CRUD operations
   - `/api/environments/[id]/start` - Start environment
   - `/api/environments/[id]/stop` - Stop environment

2. **Add Service-to-Service Auth**
   - API key validation in Go Agent
   - JWT token validation (optional)

3. **Error Handling & Retries**
   - Exponential backoff for Go Agent calls
   - Circuit breaker pattern
   - Dead letter queue for failed operations

### Phase 2: Production Hardening

1. **Observability**
   - Structured logging (JSON)
   - Metrics (Prometheus + Grafana)
   - Distributed tracing (OpenTelemetry)

2. **Security**
   - Azure Key Vault for secrets
   - mTLS for service-to-service communication
   - Rate limiting and DDoS protection

3. **Reliability**
   - Health checks with dependency validation
   - Graceful degradation
   - Automatic cleanup of orphaned resources

### Phase 3: Enhanced Features

1. **gRPC Migration** (Optional)
   - If performance requires it
   - Bidirectional streaming for logs
   - Protocol Buffers for type safety

2. **GraphQL API** (Optional)
   - Unified API gateway
   - Complex query support
   - Real-time subscriptions

3. **Multi-Cloud Support**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Abstract cloud provider interface

---

## FAQ

### Q: Why isn't the Go Agent directly connected to PostgreSQL?

**A:** Separation of concerns. The Go Agent is purely for infrastructure orchestration. Connecting it to PostgreSQL would:

- Create tight coupling
- Complicate deployment
- Require database schema sync across services
- Make horizontal scaling harder

### Q: Should we switch to gRPC?

**A:** Not now. REST/HTTP is:

- Simpler to implement and debug
- Works seamlessly with Next.js
- Sufficient for MVP performance

Consider gRPC in Phase 3 if:

- Latency becomes critical
- Need bidirectional streaming
- Want type-safe contracts

### Q: How do we handle environment state synchronization?

**A:** Next.js is the source of truth:

1. **Create**: Next.js creates DB record → calls Go Agent → updates DB
2. **Read**: Next.js reads from PostgreSQL
3. **Update**: Next.js updates DB → optionally calls Go Agent for infrastructure changes
4. **Delete**: Next.js calls Go Agent to delete resources → updates DB

### Q: What happens if Go Agent fails during provisioning?

**A:** Next.js handles it:

1. Environment stays in "CREATING" status
2. Frontend shows error message
3. Background job retries provisioning
4. User can manually retry or delete
5. Failed resources cleaned up automatically

### Q: How do we prevent orphaned Azure resources?

**A:** Multiple safeguards:

1. **Resource Tags**: All resources tagged with environment ID
2. **Cleanup Jobs**: Periodic scan for orphaned resources
3. **TTL**: Auto-delete environments after inactivity
4. **Audit Log**: Track all resource operations

---

## Conclusion

The Dev8 architecture intentionally separates concerns:

- **Next.js**: Data persistence, business logic, user management
- **Go Agent**: Infrastructure orchestration, cloud operations
- **PostgreSQL**: Single source of truth for all data
- **REST/HTTP**: Simple, reliable communication protocol

This design provides:

- ✅ Clear separation of concerns
- ✅ Independent scalability
- ✅ Simple deployment
- ✅ Easy debugging and monitoring
- ✅ Future flexibility (can add gRPC later)

**No database in Go Agent is a feature, not a limitation!**
