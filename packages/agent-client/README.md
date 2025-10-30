# @repo/agent-client

TypeScript client for the Dev8 Agent API. Implements a singleton pattern for efficient API communication.

## Features

- **Singleton Pattern**: Single instance across your application
- **Type-safe**: Full TypeScript support with all API types
- **Complete API Coverage**: All Dev8 Agent endpoints
- **Error Handling**: Structured error responses
- **Easy to Use**: Simple, intuitive interface

## Installation

This package is internal to the Dev8 monorepo and used via workspace protocol:

```json
{
  "dependencies": {
    "@repo/agent-client": "workspace:*"
  }
}
```

## Usage

### Initialize the Client

```typescript
import { AgentClient } from '@repo/agent-client';

// First initialization requires base URL
const client = AgentClient.getInstance('http://localhost:8080');

// Subsequent calls don't need the URL
const sameClient = AgentClient.getInstance();
```

### Health Checks

```typescript
// Check API health
const health = await client.health();
console.log(health.data?.status); // "healthy"

// Check readiness
const ready = await client.ready();

// Check liveness
const live = await client.live();
```

### Create Workspace

```typescript
const response = await client.createWorkspace({
  workspaceId: 'unique-workspace-id',
  userId: 'user-123',
  name: 'My Workspace',
  cloudRegion: 'centralindia',
  cpuCores: 2,
  memoryGB: 4,
  storageGB: 20,
  baseImage: 'node',
  githubToken: 'ghp_xxx',
  codeServerPassword: 'secure-password',
});

if (response.success) {
  console.log('Workspace URL:', response.data?.environment.connectionUrls?.vscode);
}
```

### Start Workspace

```typescript
const response = await client.startWorkspace({
  workspaceId: 'unique-workspace-id',
  cloudRegion: 'centralindia',
  userId: 'user-123',
  name: 'My Workspace',
  cpuCores: 2,
  memoryGB: 4,
  storageGB: 20,
  baseImage: 'node',
});

if (response.success) {
  console.log('Workspace started:', response.data?.environment.status);
}
```

### Stop Workspace

```typescript
const response = await client.stopWorkspace({
  workspaceId: 'unique-workspace-id',
  cloudRegion: 'centralindia',
});

if (response.success) {
  console.log('Workspace stopped, volumes preserved');
}
```

### Delete Workspace

```typescript
const response = await client.deleteWorkspace({
  workspaceId: 'unique-workspace-id',
  cloudRegion: 'centralindia',
  force: false, // Set to true to force delete running workspace
});

if (response.success) {
  console.log('Workspace permanently deleted');
}
```

### Report Activity

```typescript
const response = await client.reportActivity('unique-workspace-id');
```

## API Response Format

All methods return a standard response structure:

```typescript
{
  success: boolean;
  message: string;
  data?: T;        // Response data when successful
  error?: string;  // Error category when failed
  code?: string;   // Error code when failed
}
```

## Error Handling

```typescript
const response = await client.createWorkspace(config);

if (!response.success) {
  console.error('Error:', response.error);
  console.error('Message:', response.message);
  console.error('Code:', response.code);
}
```

## Types

All API types are exported for use in your application:

```typescript
import type {
  WorkspaceConfig,
  Environment,
  CreateWorkspaceResponse,
  StartWorkspaceRequest,
  StopWorkspaceRequest,
  DeleteWorkspaceRequest,
  ApiResponse,
} from '@repo/agent-client';
```

## Notes

- The client uses the singleton pattern - only one instance exists
- First initialization requires the base URL
- All methods are async and return promises
- Type safety is enforced throughout
- Handles network errors gracefully

## Related

- Agent API Documentation: `apps/agent/API_DOCUMENTATION.md`
- Main Application: `apps/web`
