# Azure Container Apps (ACA) Documentation

This directory contains documentation for the Azure Container Apps (ACA) deployment support in Dev8.dev.

## Overview

Dev8.dev supports two Azure deployment modes:

- **ACI (Azure Container Instances)**: Pay-per-second billing, always running
- **ACA (Azure Container Apps)**: Scale-to-zero capability, 30-40% cost savings for inactive workspaces

## Documentation Files

### Architecture & Comparison

- **[ACA_VS_ACI_ARCHITECTURE.md](ACA_VS_ACI_ARCHITECTURE.md)** - Detailed comparison of ACI vs ACA architectures, features, and cost models
- **[ACA_DEPLOYMENT_AND_PRICING_GUIDE.md](ACA_DEPLOYMENT_AND_PRICING_GUIDE.md)** - Comprehensive guide to ACA deployment options and pricing analysis

### Implementation & Deployment

- **[ACA_DEPLOYMENT_COMPLETE_GUIDE.md](ACA_DEPLOYMENT_COMPLETE_GUIDE.md)** - Complete deployment guide with step-by-step instructions
- **[ACA_STORAGE_FIX.md](ACA_STORAGE_FIX.md)** - Storage integration fixes and Azure Files mounting solutions

### Validation & Testing

- **[ACA_VALIDATION_REPORT.md](ACA_VALIDATION_REPORT.md)** - ACA implementation validation and test results
- **[ACI_VALIDATION_REPORT.md](ACI_VALIDATION_REPORT.md)** - ACI implementation validation and test results

### Development Notes

- **[ACA_FIXES_SUMMARY.md](ACA_FIXES_SUMMARY.md)** - Summary of all fixes and improvements made during ACA implementation

## Quick Start

### Configuration

To use ACA mode, set the following environment variables in your agent:

```bash
AZURE_DEPLOYMENT_MODE=aca
AZURE_ACA_ENVIRONMENT_ID=/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/managedEnvironments/{env-name}
```

For ACI mode (default):

```bash
AZURE_DEPLOYMENT_MODE=aci
```

### Key Features

**ACA Mode Benefits:**

- Scale-to-zero for cost savings (30-40% reduction)
- HTTP-based auto-scaling
- Integrated ingress with automatic HTTPS
- Built-in load balancing

**ACI Mode Benefits:**

- Simpler deployment model
- Faster cold start times
- Direct public IP allocation
- Lower management overhead

## Implementation Details

### Code Structure

- `apps/agent/internal/azure/aca_client.go` - ACA client implementation
- `apps/agent/internal/services/deployment_strategy.go` - Strategy pattern for ACI/ACA routing
- `apps/agent/internal/config/config.go` - Configuration validation

### Key Improvements

1. Config validation for ACA environment ID
2. Intelligent file share polling with exponential backoff
3. Workspace ID context in all error messages
4. Unified storage mounting for both modes

## Cost Optimization

ACA mode provides significant cost savings:

- **Inactive workspaces**: Scale to zero (0 replicas) = $0/hour compute cost
- **Active workspaces**: Same compute cost as ACI, but optimized for bursty workloads
- **Storage**: Always billed (same for both ACI and ACA)

Expected savings: 30-40% for typical usage patterns with 60-70% inactive time.

## Related Documentation

- [Main README](../../README.md) - Project overview
- [Agent Documentation](../../apps/agent/README.md) - Agent service details
- [Docker Documentation](../../docker/README.md) - Container image information
