# ACA vs ACI: Storage Architecture Comparison

## Overview

This document explains the architectural differences between Azure Container Apps (ACA) and Azure Container Instances (ACI) regarding storage mounting.

## Storage Mounting Architectures

### ACA (Azure Container Apps) - Shared Environment Model

```
┌─────────────────────────────────────────────────────────────────┐
│  BICEP: Deploy Once                                            │
│  ├─ Storage Account (persistent)                               │
│  └─ ACA Managed Environment (persistent, shared)               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENT: Per-Workspace (Dynamic, Runtime)                       │
│                                                                 │
│  For Each Workspace:                                           │
│  1. Create file share: fs-{workspaceId}                        │
│  2. Register with environment:                                 │
│     ManagedEnvironmentsStoragesClient.CreateOrUpdate(          │
│       storageName: "fs-{workspaceId}",                         │
│       accountName: "dev8devst...",                             │
│       accountKey: "***",                                       │
│       shareName: "fs-{workspaceId}",                           │
│       accessMode: ReadWrite                                    │
│     )                                                           │
│  3. Create container app:                                      │
│     volumes:                                                   │
│       - storageName: "fs-{workspaceId}"  ← references step 2   │
│         storageType: AzureFile                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Environment is **shared** across all workspaces
- ✅ Storage is **registered** with environment before creating container apps
- ✅ Container apps **reference** storage by name (indirection)
- ✅ More efficient for multiple workspaces (no duplicate credentials)
- ✅ Centralized storage management

### ACI (Azure Container Instances) - Self-Contained Model

```
┌─────────────────────────────────────────────────────────────────┐
│  BICEP: Deploy Once                                            │
│  └─ Storage Account (persistent)                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENT: Per-Workspace (Dynamic, Runtime)                       │
│                                                                 │
│  For Each Workspace:                                           │
│  1. Create file share: fs-{workspaceId}                        │
│  2. Create container group:                                    │
│     volumes:                                                   │
│       - name: dev8-data                                        │
│         azureFile:                                             │
│           shareName: "fs-{workspaceId}"                        │
│           storageAccountName: "dev8devst..."                   │
│           storageAccountKey: "***"  ← embedded directly        │
│     containers:                                                │
│       volumeMounts:                                            │
│         - name: dev8-data                                      │
│           mountPath: /home/dev8                                │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Each container group is **self-contained**
- ✅ Storage credentials **embedded** directly in each container group
- ✅ No environment-level storage registration needed
- ✅ Simpler deployment (fewer steps)
- ⚠️ Duplicates storage credentials across container groups

## Code Comparison

### ACA: Two-Step Storage Process

```go
// Step 1: Register storage with environment FIRST
func (c *Client) RegisterStorageWithEnvironment(
    ctx context.Context,
    resourceGroup, environmentID, fileShareName, storageAccountName string,
) error {
    storageClient, _ := armappcontainers.NewManagedEnvironmentsStoragesClient(...)
    
    // Fetch storage key dynamically
    storageKey, _ := c.GetStorageAccountKey(ctx, resourceGroup, storageAccountName)
    
    // Configure storage on environment
    storageConfig := armappcontainers.ManagedEnvironmentStorage{
        Properties: &armappcontainers.ManagedEnvironmentStorageProperties{
            AzureFile: &armappcontainers.AzureFileProperties{
                AccountName:  to.Ptr(storageAccountName),
                AccountKey:   to.Ptr(storageKey),        // ← Key stored in environment
                ShareName:    to.Ptr(fileShareName),
                AccessMode:   to.Ptr(armappcontainers.AccessModeReadWrite),
            },
        },
    }
    
    // Register with environment
    _, err := storageClient.CreateOrUpdate(ctx, resourceGroup, envName, fileShareName, storageConfig, nil)
    return err
}

// Step 2: Create container app (references storage by name)
func (c *Client) CreateContainerApp(...) {
    // ...
    volumes := []*armappcontainers.Volume{
        {
            Name:        to.Ptr("workspace-data"),
            StorageName: to.Ptr(spec.FileShareName),  // ← References environment storage
            StorageType: to.Ptr(armappcontainers.StorageTypeAzureFile),
        },
    }
    // No storage credentials needed here!
}
```

### ACI: Single-Step Embedded Storage

```go
// Single step: Create container group with embedded storage
func (c *Client) CreateContainerGroup(...) {
    // Build volumes with embedded credentials
    volumes := []*armcontainerinstance.Volume{
        {
            Name: to.Ptr("dev8-data"),
            AzureFile: &armcontainerinstance.AzureFileVolume{
                ShareName:          to.Ptr(spec.FileShareName),
                StorageAccountName: to.Ptr(spec.StorageAccountName),
                StorageAccountKey:  to.Ptr(spec.StorageAccountKey),  // ← Embedded directly
            },
        },
    }
    
    volumeMounts := []*armcontainerinstance.VolumeMount{
        {
            Name:      to.Ptr("dev8-data"),
            MountPath: to.Ptr("/home/dev8"),
        },
    }
    
    // Everything in one call
    containerGroup := armcontainerinstance.ContainerGroup{
        Properties: &armcontainerinstance.ContainerGroupPropertiesProperties{
            Volumes:    volumes,       // ← Volumes included here
            Containers: []{
                {
                    Properties: &armcontainerinstance.ContainerProperties{
                        VolumeMounts: volumeMounts,
                    },
                },
            },
        },
    }
}
```

## Deployment Order Guarantees

### ACA
```
1. Storage Account (Bicep) ✓
2. ACA Environment (Bicep) ✓
3. File Share (Agent - concurrent) ✓
4. Register Storage with Environment (Agent) ⭐ CRITICAL!
5. Container App (Agent) ✓
```

### ACI
```
1. Storage Account (Bicep) ✓
2. File Share (Agent - concurrent) ✓
3. Container Group (Agent) ✓
```

## When to Use Which

### Use ACA When:
- ✅ Deploying multiple workspaces in same region
- ✅ Need centralized storage management
- ✅ Want to scale to zero (cost savings)
- ✅ Need ingress traffic management
- ✅ Prefer microservices architecture

### Use ACI When:
- ✅ Simple single-container deployments
- ✅ Want complete isolation per workspace
- ✅ Don't need shared environment
- ✅ Prefer simpler deployment process
- ✅ Need guaranteed resources (no scale-to-zero)

## Security Considerations

### ACA
- ✅ Storage keys stored at environment level (fewer copies)
- ✅ Container apps don't see storage credentials
- ✅ Easier to rotate keys (update environment, not containers)
- ⚠️ All containers in environment share storage config

### ACI
- ✅ Complete isolation per container group
- ✅ Each workspace has independent credentials
- ⚠️ Storage keys duplicated across container groups
- ⚠️ Harder to rotate keys (must update all containers)

## Cost Comparison

### ACA
- 💰 Pay for what you use (scale-to-zero)
- 💰 Shared environment (no duplication)
- 💰 Better for variable workloads
- 💰 Consumption plan: $0/month (pay per second)

### ACI
- 💰 Pay for allocated resources (always running)
- 💰 Each container group billed separately
- 💰 Better for consistent workloads
- 💰 No monthly fee, just resource costs

## Summary

| Feature | ACA | ACI |
|---------|-----|-----|
| **Storage Registration** | Environment-level (2 steps) | Container-level (1 step) |
| **Credential Storage** | Environment (centralized) | Per-container (distributed) |
| **Complexity** | Higher (but more flexible) | Lower (simpler) |
| **Scalability** | Excellent (scale-to-zero) | Good (manual) |
| **Cost Efficiency** | Better (consumption) | Good (predictable) |
| **Deployment Speed** | Slower (extra registration) | Faster (direct) |
| **Management** | Centralized | Distributed |

---

**Recommendation**: 
- Use **ACA** for production workspaces (cost-effective, scalable)
- Use **ACI** for testing or single deployments (simpler)

Both are now fully functional with proper Azure File Share mounting! ✅

