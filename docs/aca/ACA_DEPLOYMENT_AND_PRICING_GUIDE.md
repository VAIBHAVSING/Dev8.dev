# Azure Container Apps: Deployment Model & Pricing Guide

## 🎯 Executive Summary

**Deployment Model**: **Consumption Plan** (Serverless)  
**Auto-Scaling**: **Scale-to-Zero** Enabled  
**Billing**: **Pay-per-second** for active compute only  
**Cost When Idle**: **$0** (no charges when scaled to zero)

---

## 📊 Current Deployment Configuration

### Infrastructure (Bicep)

**File**: `in/azure/bicep/modules/aca-environment.bicep`

```bicep
resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  properties: {
    workloadProfiles: [
      {
        name: 'Consumption'              // ← CONSUMPTION PLAN
        workloadProfileType: 'Consumption'
      }
    ]
    zoneRedundant: false
  }
}
```

### Container App Configuration (Agent)

**File**: `apps/agent/internal/azure/aca_client.go`

```go
Template: &armappcontainers.Template{
  Containers: []*armappcontainers.Container{
    {
      Name:  to.Ptr("workspace"),
      Image: to.Ptr(spec.Image),
      Resources: &armappcontainers.ContainerResources{
        CPU:    to.Ptr(spec.CPUCores),    // e.g., 2.0 vCPU
        Memory: to.Ptr(memorySize),        // e.g., "4Gi"
      },
    },
  },
  Scale: &armappcontainers.Scale{
    MinReplicas: to.Ptr(int32(0)),  // ← SCALE TO ZERO
    MaxReplicas: to.Ptr(int32(1)),  // Single instance per workspace
    Rules: []*armappcontainers.ScaleRule{
      {
        Name: to.Ptr("http-scaling"),
        HTTP: &armappcontainers.HTTPScaleRule{
          Metadata: map[string]*string{
            "concurrentRequests": to.Ptr("10"),
          },
        },
      },
    },
  },
}
```

---

## 🔄 Scaling Behavior

### Automatic Scale-to-Zero

**When does it happen?**

- Container app scales to **0 replicas** when there are **no active HTTP requests**
- Typically happens within **2-5 minutes** of last request
- **No manual action required** (automatic via Azure platform)

**Cold Start Behavior:**

- First request after scale-to-zero: **~10-30 seconds** (container startup)
- Subsequent requests: **<1 second** (container already running)

### Scale Rules

| Trigger          | Threshold               | Action           |
| ---------------- | ----------------------- | ---------------- |
| **HTTP Traffic** | 0 requests for 2-5 min  | Scale to 0       |
| **HTTP Traffic** | >0 concurrent requests  | Scale to 1       |
| **HTTP Traffic** | >10 concurrent requests | Scale to 1 (max) |

**Note**: With `maxReplicas: 1`, we prevent multiple instances per workspace.

---

## 💰 Pricing Breakdown

### Consumption Plan Pricing (Central India Region)

**Pricing Model**: Pay only for **active compute time**

| Resource          | Rate                       | Calculation            |
| ----------------- | -------------------------- | ---------------------- |
| **vCPU**          | $0.000024 per vCPU-second  | $0.0864 per vCPU-hour  |
| **Memory**        | $0.000002667 per GB-second | $0.009600 per GB-hour  |
| **HTTP Requests** | First 2 million FREE       | Then $0.40 per million |

### Example: 2 vCPU, 4GB RAM Workspace

**Active Usage Costs (per hour):**

```
CPU Cost:    2 vCPU × $0.0864/vCPU-hr  = $0.1728/hr
Memory Cost: 4 GB   × $0.0096/GB-hr    = $0.0384/hr
───────────────────────────────────────────────────
Total:                                   $0.2112/hr
```

**Monthly Costs (Different Usage Patterns):**

| Usage Pattern                    | Hours/Month | Cost/Month | Annual Cost |
| -------------------------------- | ----------- | ---------- | ----------- |
| **Always On**                    | 730 hrs     | $154.18    | $1,850.16   |
| **Business Hours** (8hrs×22days) | 176 hrs     | $37.17     | $446.08     |
| **Part-time** (4hrs×20days)      | 80 hrs      | $16.90     | $202.75     |
| **On-demand** (10hrs/mo)         | 10 hrs      | $2.11      | $25.34      |
| **Idle (scale-to-zero)**         | 0 hrs       | **$0.00**  | **$0.00**   |

### Cost Comparison: ACA vs ACI

**Same Config**: 2 vCPU, 4GB RAM, Central India

| Metric               | ACA (Consumption)  | ACI (Dedicated)      |
| -------------------- | ------------------ | -------------------- |
| **Idle Cost**        | $0.00/month        | $154.18/month        |
| **Active (8hr/day)** | $37.17/month       | $154.18/month        |
| **Scaling**          | Automatic          | Manual               |
| **Cold Start**       | 10-30 seconds      | Instant (always on)  |
| **Best For**         | Variable workloads | Consistent workloads |

---

## 🚀 Scaling Operations: Stop vs Start

### The Misconception

❌ **WRONG**: You need to manually "stop" containers to save money  
✅ **CORRECT**: Containers automatically scale to zero with no traffic

### What "Stop" Actually Does

**Current Implementation** (Fixed):

```go
// StopContainerApp - Sets minReplicas=0, maxReplicas=1
// Container AUTOMATICALLY scales to 0 with no traffic (2-5 min)
func (c *Client) StopContainerApp(...) {
  Scale.MinReplicas = 0  // Allow scale to zero
  Scale.MaxReplicas = 1  // Must be >0 (Azure requirement)
}
```

**Behavior**:

- Sets scaling policy to allow scale-to-zero
- Container scales to 0 **automatically** when no traffic
- **NO immediate shutdown** (waits for no traffic)

### What "Start" Actually Does

```go
// StartContainerApp - Ensures scaling is enabled
func (c *Client) StartContainerApp(...) {
  Scale.MinReplicas = 0  // Allow scale to zero
  Scale.MaxReplicas = 1  // Allow scale to 1
}
```

**Behavior**:

- Ensures scaling policy is configured
- Container scales to 1 **on first HTTP request**
- **NO immediate startup** (waits for traffic)

### The Truth About Scaling

| Action                | What Happens        | When It Happens            | Cost Impact         |
| --------------------- | ------------------- | -------------------------- | ------------------- |
| **Create Container**  | Scales to 1 replica | Immediately                | Billing starts      |
| **Send HTTP Request** | Keeps replica at 1  | While traffic exists       | Billed per second   |
| **No Traffic**        | Auto-scales to 0    | 2-5 min after last request | Billing stops       |
| **Call "Stop" API**   | Sets scaling policy | Immediately                | No immediate effect |
| **Call "Start" API**  | Sets scaling policy | Immediately                | No immediate effect |

**Key Insight**:

> Stop/Start APIs **DO NOT** immediately control replicas.  
> Azure **AUTOMATICALLY** scales based on **HTTP traffic** (or lack thereof).

---

## 🎮 Operational Recommendations

### Do You Need to Call "Stop" API?

**Short Answer**: **NO** for cost savings (auto-scaling handles it)

**When to use Stop/Start**:

- ✅ Pause workspace before maintenance
- ✅ Ensure consistent scaling policy
- ✅ Administrative purposes (mark as "stopped")
- ❌ **NOT** for cost savings (automatic already)

### Supervisor Inside Container

**Question**: Should supervisor stop the container when idle?

**Answer**: **NO** - Let Azure handle it

**Why?**

- Supervisor runs **inside** the container (can't stop itself)
- Azure monitors **HTTP ingress traffic** (external to container)
- Container health checks keep it alive (defeats scale-to-zero)
- Supervisor should manage **internal processes**, not scaling

**Correct Architecture**:

```
User Request → Azure Ingress → Container → Supervisor → code-server/SSH
                    ↑
                    └─ Azure monitors this for scaling
```

### Recommended Configuration

**For Maximum Cost Efficiency**:

1. **Keep current config** (`minReplicas: 0`, `maxReplicas: 1`)
2. **Remove manual stop/start calls** (let auto-scaling work)
3. **Supervisor should NOT exit** when idle
4. **Let Azure detect idle** (no HTTP requests = scale to 0)

**For Guaranteed Availability** (no cold starts):

```go
Scale: &armappcontainers.Scale{
  MinReplicas: to.Ptr(int32(1)),  // Always keep 1 replica
  MaxReplicas: to.Ptr(int32(1)),
}
```

Cost: $154.18/month per workspace (always running)

---

## 📐 Scaling Rules: Azure Requirements

### ✅ Valid Configurations

```go
// ✓ Scale-to-zero enabled (Consumption plan)
MinReplicas: 0
MaxReplicas: 1  // Must be > 0

// ✓ Always-on (guaranteed availability)
MinReplicas: 1
MaxReplicas: 1

// ✓ Auto-scaling with multiple replicas
MinReplicas: 0
MaxReplicas: 5
```

### ❌ Invalid Configurations

```go
// ✗ maxReplicas = 0 (violates Azure rules)
MinReplicas: 0
MaxReplicas: 0  // ERROR: maxReplicas must be > 0

// ✗ minReplicas > maxReplicas
MinReplicas: 2
MaxReplicas: 1  // ERROR: invalid range

// ✗ Negative values
MinReplicas: -1  // ERROR: must be >= 0
MaxReplicas: -1  // ERROR: must be > 0
```

**Azure Error**:

```
ContainerAppInvalidScaleSpec
The scale options provided for Container App is incorrect.
minReplicas must not be less than 0.
MaxReplicas must be greater than 0.
maxReplicas must not be less than minReplicas.
```

---

## 🔧 Fixed Issues

### Issue 1: Stop API Failed

**Problem**:

```go
// ✗ WRONG
Scale.MaxReplicas = to.Ptr(int32(0))  // Violates Azure rules
```

**Fix**:

```go
// ✓ CORRECT
Scale.MaxReplicas = to.Ptr(int32(1))  // Must be > 0
```

### Issue 2: Understanding Scale-to-Zero

**Before**: Thought "Stop" API immediately stops container  
**After**: Understand auto-scaling happens automatically based on traffic

---

## 📊 Monitoring & Observability

### Check Current Replica Count

```bash
# Get replica count for a container app
az containerapp show \
  --name aca-{workspaceId} \
  --resource-group dev8-dev-rg \
  --query "properties.template.scale.{min:minReplicas,max:maxReplicas}" \
  -o table

# List all running replicas
az containerapp replica list \
  --name aca-{workspaceId} \
  --resource-group dev8-dev-rg \
  -o table
```

### Monitor Scaling Events

```bash
# View scaling metrics (requires Log Analytics)
az monitor metrics list \
  --resource /subscriptions/{sub}/resourceGroups/dev8-dev-rg/providers/Microsoft.App/containerApps/aca-{workspaceId} \
  --metric Replicas \
  --interval PT1M
```

---

## 💡 Best Practices

### 1. **Use Scale-to-Zero for Development** ✅

```go
MinReplicas: 0  // Save costs when not in use
MaxReplicas: 1  // Single instance sufficient
```

**Benefits**:

- Zero cost when idle
- Automatic startup on first request
- Good for dev/test environments

**Drawbacks**:

- 10-30s cold start
- Not suitable for production APIs

### 2. **Use Always-On for Production** ⚠️

```go
MinReplicas: 1  // No cold starts
MaxReplicas: 3  // Auto-scale under load
```

**Benefits**:

- Instant response times
- High availability
- Better user experience

**Drawbacks**:

- Always incurs costs
- Higher monthly bill

### 3. **Hybrid Approach** 🎯

- **DEV**: Scale-to-zero (save costs)
- **PROD**: Always-on (better UX)
- Use environment-based configuration

---

## 🔐 Security Considerations

### Consumption Plan Isolation

- ✅ Each container app runs in **isolated sandbox**
- ✅ Network isolation between apps
- ✅ Managed identity for Azure resources
- ✅ No access to host system

### Resource Limits

| Resource               | Consumption Plan Limit   |
| ---------------------- | ------------------------ |
| **CPU**                | 4 vCPU max per container |
| **Memory**             | 8 GB max per container   |
| **Storage**            | 10 GB ephemeral          |
| **Persistent Storage** | Azure Files (unlimited)  |

---

## 📈 Cost Optimization Tips

### 1. Use Scale-to-Zero Aggressively

**Default**: Container scales to 0 after 2-5 min idle  
**Optimization**: Already optimal (automatic)

### 2. Right-Size Resources

**Before**:

```go
CPUCores: 4.0    // $0.3456/hr
MemoryGB: 8.0    // $0.0768/hr
Total:            $0.4224/hr
```

**After** (right-sized):

```go
CPUCores: 2.0    // $0.1728/hr
MemoryGB: 4.0    // $0.0384/hr
Total:            $0.2112/hr (50% savings)
```

### 3. Use Shared Environment

- ✅ Single ACA environment for all workspaces
- ✅ No per-app environment costs
- ✅ Shared Log Analytics (if enabled)

### 4. Monitor Idle Workspaces

```bash
# Find workspaces scaled to 0
az containerapp replica list \
  --name aca-{workspaceId} \
  --resource-group dev8-dev-rg \
  --query "[].name" -o tsv

# Delete if empty
az containerapp delete \
  --name aca-{workspaceId} \
  --resource-group dev8-dev-rg \
  --yes
```

---

## 🎯 Summary

| Question              | Answer                        |
| --------------------- | ----------------------------- |
| **Deployment Mode**   | Consumption Plan (Serverless) |
| **Auto-Scaling**      | Enabled (scale-to-zero)       |
| **Idle Cost**         | $0.00/month                   |
| **Active Cost**       | $0.2112/hour (2vCPU, 4GB)     |
| **Cold Start**        | 10-30 seconds                 |
| **Need Manual Stop?** | NO (automatic)                |
| **Supervisor Exit?**  | NO (let Azure scale)          |
| **Best For**          | Dev/test, variable workloads  |

---

**Recommendation**: Keep current configuration (scale-to-zero enabled). Remove manual stop/start logic and trust Azure's automatic scaling.
