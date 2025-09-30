# @repo/environment-types

Shared TypeScript types, validation schemas, and constants for Dev8.dev environment management.

## Overview

This package provides a single source of truth for all environment-related types and constants used across the Dev8.dev platform, including the web frontend and Go backend agent.

## Features

- **TypeScript Types**: Fully typed interfaces for environments, templates, and resources
- **Zod Schemas**: Runtime validation schemas for API requests
- **Constants**: Centralized configuration values and presets
- **Type Safety**: Ensures consistency across frontend and backend

## Installation

This is a workspace package and is automatically available to other packages in the monorepo:

```json
{
  "dependencies": {
    "@repo/environment-types": "workspace:*"
  }
}
```

## Usage

### Import Types

```typescript
import type { Environment, EnvironmentStatus, CreateEnvironmentRequest } from '@repo/environment-types';

const environment: Environment = {
  id: 'cuid',
  userId: 'user123',
  name: 'my-dev-env',
  status: 'running',
  // ...
};
```

### Use Validation Schemas

```typescript
import { createEnvironmentSchema } from '@repo/environment-types';

// Validate user input
const result = createEnvironmentSchema.safeParse({
  name: 'my-environment',
  baseImage: 'node',
  cpuCores: 2,
  memoryGB: 4,
  storageGB: 50,
});

if (!result.success) {
  console.error(result.error);
}
```

### Use Constants

```typescript
import { HARDWARE_PRESETS, BASE_IMAGE_LABELS, STATUS_COLORS } from '@repo/environment-types';

// Get preset configuration
const mediumConfig = HARDWARE_PRESETS.medium; // { cpuCores: 2, memoryGB: 4, storageGB: 50 }

// Display labels
const nodeLabel = BASE_IMAGE_LABELS.node; // "Node.js"

// UI styling
const statusColor = STATUS_COLORS.running; // "green"
```

## API Reference

### Types

- `CloudProvider`: 'azure' | 'aws' | 'gcp'
- `EnvironmentStatus`: 'creating' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error' | 'deleting'
- `BaseImage`: 'node' | 'python' | 'golang'
- `Environment`: Full environment object interface
- `Template`: Template configuration interface
- `HardwareConfig`: CPU, memory, and storage configuration

### Schemas

- `createEnvironmentSchema`: Validates environment creation requests
- `updateEnvironmentSchema`: Validates environment update requests
- `environmentIdSchema`: Validates environment ID format

### Constants

- `HARDWARE_PRESETS`: Small, medium, and large preset configurations
- `BASE_IMAGES`: Docker image URLs for each base image type
- `STATUS_LABELS`: Human-readable status labels
- `STATUS_COLORS`: UI color mappings for statuses
- `RESOURCE_LIMITS`: Min/max values for CPU, memory, and storage

## Development

```bash
# Type check
pnpm type-check

# Lint
pnpm lint
```

## License

MIT
