# Agent API Integration Documentation

This document explains how the Next.js web application integrates with the Go agent to manage workspaces.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Dashboard with WorkspaceManager Component         │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js Web App (Port 3000)                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  API Routes (/api/workspaces/*)                    │     │
│  │  - POST /api/workspaces        (Create)            │     │
│  │  - POST /api/workspaces/start  (Start)             │     │
│  │  - POST /api/workspaces/stop   (Stop)              │     │
│  │  - DELETE /api/workspaces      (Delete)            │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │ uses                                 │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  @repo/agent-client Package                        │     │
│  │  - Singleton HTTP client                           │     │
│  │  - Type-safe API methods                           │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Agent (Go) (Port 8080)                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │  HTTP Handlers                                     │     │
│  │  - POST /api/v1/environments                       │     │
│  │  - POST /api/v1/environments/start                 │     │
│  │  - POST /api/v1/environments/stop                  │     │
│  │  - DELETE /api/v1/environments                     │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │ uses                                 │
│  ┌────────────────────▼───────────────────────────────┐     │
│  │  Azure SDK Services                                │     │
│  │  - ACI Management                                  │     │
│  │  - File Share Management                           │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ Azure SDK
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Azure Container Instances                       │
│  - Dev Environment Containers                                │
│  - VS Code Server                                            │
│  - Persistent File Shares                                    │
└─────────────────────────────────────────────────────────────┘
```

## API Flow

### 1. Create Workspace

**User Action:** Fills form in WorkspaceManager → Clicks "Create Workspace"

**Frontend:**
```typescript
POST /api/workspaces
Body: {
  workspaceId: "ws-1234-abcd",
  name: "My Workspace",
  cloudRegion: "centralindia",
  cpuCores: 1,
  memoryGB: 2,
  storageGB: 10,
  baseImage: "dev8/ubuntu-vscode:latest"
}
```

**Backend API Route:**
- Validates NextAuth session
- Validates required fields
- Calls AgentClient.createWorkspace()

**Agent:**
```
POST /api/v1/environments
- Creates Azure File Shares (2x, parallel)
- Provisions ACI Container
- Returns workspace details with FQDN
⏱️ Takes ~2m15s
```

**Response:**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "environment": {
      "id": "ws-1234-abcd",
      "name": "My Workspace",
      "status": "RUNNING",
      "connectionUrls": {
        "vscode": "https://ws-1234-abcd.centralindia.azurecontainer.io"
      }
    }
  }
}
```

### 2. Start Workspace

**User Action:** Clicks "Start" on stopped workspace

**Frontend:**
```typescript
POST /api/workspaces/start
Body: {
  workspaceId: "ws-1234-abcd",
  cloudRegion: "centralindia",
  name: "My Workspace",
  cpuCores: 1,
  memoryGB: 2,
  storageGB: 10,
  baseImage: "dev8/ubuntu-vscode:latest"
}
```

**Agent:**
```
POST /api/v1/environments/start
- Restarts stopped ACI container
- File shares remain intact
⏱️ Takes ~15-20s
```

### 3. Stop Workspace

**User Action:** Clicks "Stop" on running workspace

**Frontend:**
```typescript
POST /api/workspaces/stop
Body: {
  workspaceId: "ws-1234-abcd",
  cloudRegion: "centralindia"
}
```

**Agent:**
```
POST /api/v1/environments/stop
- Stops ACI container (keeps volumes)
- Reduces cost by 95%
⏱️ Takes ~2s
```

### 4. Delete Workspace

**User Action:** Clicks "Delete" → Confirms

**Frontend:**
```typescript
DELETE /api/workspaces
Body: {
  workspaceId: "ws-1234-abcd",
  cloudRegion: "centralindia",
  force: false
}
```

**Agent:**
```
DELETE /api/v1/environments
- Deletes ACI container
- Deletes both file shares
- Removes all resources
⏱️ Takes ~5s
```

## Key Components

### 1. Agent Client Package (`packages/agent-client/`)

**Purpose:** Type-safe HTTP client for agent API

**Files:**
- `src/client.ts` - Singleton HTTP client with methods for all APIs
- `src/types.ts` - TypeScript interfaces matching agent API contracts
- `src/index.ts` - Public exports

**Usage:**
```typescript
import { AgentClient } from "@repo/agent-client";

const client = AgentClient.getInstance("http://localhost:8080");
const response = await client.createWorkspace(config);
```

### 2. API Routes (`apps/web/app/api/workspaces/`)

**Purpose:** Next.js server-side API endpoints

**Files:**
- `route.ts` - Create and Delete workspace
- `start/route.ts` - Start workspace
- `stop/route.ts` - Stop workspace

**Features:**
- NextAuth authentication middleware
- Request validation
- Error handling
- Agent client integration

### 3. Workspace Manager (`apps/web/app/components/workspace-manager.tsx`)

**Purpose:** React component for workspace management UI

**Features:**
- Create workspace form
- Workspace list with status
- Start/Stop/Delete actions
- Error and success notifications
- Real-time UI updates

## Configuration

### Environment Variables

**Web App (`.env.local`):**
```bash
# Agent API URL
AGENT_BASE_URL=http://localhost:8080

# NextAuth (existing)
AUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://...
```

**Agent (`.env`):**
```bash
# Server
AGENT_PORT=8080
AGENT_HOST=0.0.0.0

# Azure Credentials
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_RESOURCE_GROUP=dev8-resources
AZURE_STORAGE_ACCOUNT=dev8storage
AZURE_STORAGE_KEY=your-storage-key
AZURE_LOCATION=centralindia
```

## Development Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Agent Client
```bash
pnpm --filter=@repo/agent-client build
```

### 3. Start Agent
```bash
cd apps/agent
go run .
# Agent runs on http://localhost:8080
```

### 4. Start Web App
```bash
cd apps/web
pnpm dev
# Web app runs on http://localhost:3000
```

### 5. Access Dashboard
1. Sign up/Sign in at http://localhost:3000
2. Navigate to Dashboard
3. Use WorkspaceManager to create/manage workspaces

## Testing

### Manual Testing Checklist
- [ ] Create workspace with valid configuration
- [ ] Verify workspace appears in list with "CREATING" status
- [ ] Wait for creation to complete (~2m15s)
- [ ] Verify status changes to "RUNNING"
- [ ] Click VS Code link (if connectionUrls available)
- [ ] Stop the workspace
- [ ] Verify status changes to "STOPPED"
- [ ] Start the workspace
- [ ] Verify status changes to "RUNNING"
- [ ] Delete the workspace
- [ ] Verify workspace removed from list

### Error Cases to Test
- [ ] Create workspace without authentication (should redirect to login)
- [ ] Create workspace with invalid data (should show error)
- [ ] Start already running workspace (should handle gracefully)
- [ ] Stop already stopped workspace (should handle gracefully)
- [ ] Delete non-existent workspace (should show error)

## Security Considerations

1. **Authentication:**
   - All API routes check NextAuth session
   - Unauthenticated requests return 401

2. **Authorization:**
   - User ID from session attached to workspace
   - Future: Add user-workspace ownership checks

3. **Input Validation:**
   - Required fields validated in API routes
   - Type checking via TypeScript

4. **Agent Communication:**
   - Agent should run on private network
   - Use environment variable for agent URL
   - Consider adding API key authentication

## Cost Optimization

The stop/start workflow enables significant cost savings:

| State | Monthly Cost | Annual Cost |
|-------|-------------|-------------|
| Running 24/7 | $35/workspace | $420/workspace |
| Stopped | $1-2/workspace | $12-24/workspace |
| **Savings** | **95%** 🎉 | **95%** 🎉 |

**Best Practices:**
- Stop workspaces when not in use
- Delete unused workspaces
- Use smaller instances for light development

## Troubleshooting

### Agent Not Responding
```bash
# Check if agent is running
curl http://localhost:8080/health

# Check agent logs
cd apps/agent
go run . 2>&1 | tee agent.log
```

### Workspace Creation Fails
1. Check Azure credentials in agent `.env`
2. Verify Azure subscription has quota
3. Check agent logs for specific error
4. Ensure resource group exists

### UI Not Updating
1. Check browser console for errors
2. Verify API routes return proper responses
3. Check network tab for failed requests
4. Ensure agent-client is built correctly

## Future Enhancements

### Short Term
- [ ] Add loading spinners for long operations
- [ ] Persist workspaces to database
- [ ] Add workspace list API endpoint
- [ ] Show creation progress (websockets)
- [ ] Add configuration presets (templates)

### Medium Term
- [ ] WebSocket for real-time status updates
- [ ] Workspace sharing/collaboration
- [ ] Custom Docker image support
- [ ] SSH key management
- [ ] Environment variables per workspace

### Long Term
- [ ] Multi-cloud support (AWS, GCP)
- [ ] Workspace snapshots/backups
- [ ] Usage analytics and billing
- [ ] Team workspaces
- [ ] API documentation site

## References

- [Agent API Documentation](apps/agent/API_DOCUMENTATION.md)
- [Agent Architecture](apps/agent/ARCHITECTURE.md)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js](https://next-auth.js.org/)
- [Azure Container Instances](https://learn.microsoft.com/en-us/azure/container-instances/)
