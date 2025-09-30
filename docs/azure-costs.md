# Azure Cost Estimation and Optimization

Comprehensive guide to understanding and optimizing Azure costs for Dev8.dev.

## Table of Contents

- [Cost Overview](#cost-overview)
- [Per-Resource Breakdown](#per-resource-breakdown)
- [Usage Scenarios](#usage-scenarios)
- [Cost Optimization](#cost-optimization)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Scaling Considerations](#scaling-considerations)

## Cost Overview

### MVP Monthly Estimate

| Resource | Configuration | Monthly Cost (USD) |
|----------|--------------|-------------------|
| Storage Account | Standard LRS | $1-2 |
| Container Registry | Basic SKU | $5 |
| Azure Files | 50GB per user | $2.50/user |
| Container Instances | 1 CPU, 2GB RAM | $30-50/container* |
| **Total (1 active user)** | - | **$38-60** |
| **Total (5 active users)** | - | **$180-260** |

*Costs vary based on actual runtime hours

### Cost Factors

**Fixed Costs (always incurred):**
- Storage Account: ~$1/month
- Container Registry (Basic): $5/month
- Azure Files storage: $0.05/GB/month

**Variable Costs (usage-based):**
- Container Instances: Charged per second of runtime
- Data egress: Outbound data transfer
- Storage transactions: API calls to storage

## Per-Resource Breakdown

### 1. Storage Account

**Pricing Model:** Pay-as-you-go

| Component | Rate | MVP Usage | Cost |
|-----------|------|-----------|------|
| Account | Free | 1 account | $0 |
| Capacity (LRS) | $0.05/GB/month | 20GB | $1 |
| Transactions | $0.00036/10K | 100K/month | $0.04 |
| **Total** | - | - | **~$1.04** |

**Optimization Tips:**
- Use Standard_LRS (locally redundant) for MVP
- Enable lifecycle management for old data
- Monitor transaction costs

### 2. Azure Container Registry

**Pricing Model:** Fixed monthly rate per SKU

| SKU | Storage | Webhooks | Geo-replication | Monthly Cost |
|-----|---------|----------|-----------------|--------------|
| Basic | 10GB | 2 | No | $5 |
| Standard | 100GB | 10 | No | $20 |
| Premium | 500GB | 100 | Yes | $150 |

**MVP Recommendation:** Basic SKU
- Sufficient for 3-5 base images
- Adequate storage for development
- Upgrade to Standard for production

**Cost Breakdown:**
- Registry: $5/month (fixed)
- Storage over 10GB: $0.10/GB/month
- Build minutes (if using ACR Tasks): $0.0001/second

### 3. Azure Files

**Pricing Model:** Per GB stored + transactions

| Tier | Storage Cost | Transaction Cost |
|------|--------------|------------------|
| Transaction Optimized | $0.30/GB/month | $0.01/10K |
| Hot | $0.12/GB/month | $0.10/10K |
| Cool | $0.10/GB/month | $0.10/10K |

**MVP Configuration:**
- Hot tier (default)
- 20GB per user workspace
- Cost: 20GB × $0.12 = **$2.40/user/month**

**Optimization Tips:**
- Use Hot tier for active workspaces
- Move inactive workspaces to Cool tier
- Delete unused file shares

### 4. Azure Container Instances (ACI)

**Pricing Model:** Per-second billing

**CPU Pricing (Linux):**
| vCPU | USD/second | USD/hour | USD/day (24h) | USD/month (30d) |
|------|------------|----------|---------------|-----------------|
| 1 | $0.0000125 | $0.045 | $1.08 | $32.40 |
| 2 | $0.0000250 | $0.090 | $2.16 | $64.80 |
| 4 | $0.0000500 | $0.180 | $4.32 | $129.60 |

**Memory Pricing (Linux):**
| GB | USD/second | USD/hour | USD/day (24h) | USD/month (30d) |
|----|------------|----------|---------------|-----------------|
| 1 | $0.0000014 | $0.005 | $0.12 | $3.60 |
| 2 | $0.0000028 | $0.010 | $0.24 | $7.20 |
| 4 | $0.0000056 | $0.020 | $0.48 | $14.40 |

**Common Configurations:**

| Config | Cost/hour | Cost/day (8h) | Cost/day (24h) | Cost/month* |
|--------|-----------|---------------|----------------|-------------|
| 1 CPU, 2GB | $0.055 | $0.44 | $1.32 | $10-40 |
| 2 CPU, 4GB | $0.110 | $0.88 | $2.64 | $20-80 |
| 4 CPU, 8GB | $0.220 | $1.76 | $5.28 | $40-160 |

*Depends on actual usage patterns

### 5. Data Transfer

**Outbound Data Transfer:**
| Tier | Rate |
|------|------|
| First 100GB/month | Free |
| 100GB - 10TB | $0.087/GB |
| 10TB+ | Lower rates |

**Inbound Data Transfer:** Free

**MVP Estimate:**
- VS Code traffic: ~1-2GB/day per user
- Should stay within free tier for MVP

## Usage Scenarios

### Scenario 1: Light Development (4 hours/day)

**Configuration:** 1 CPU, 2GB RAM

**Daily Costs:**
- Container runtime: 4h × $0.055 = $0.22
- Storage: $0.08
- Registry: $0.17
- **Total: $0.47/day = $14/month**

### Scenario 2: Full-Time Development (8 hours/day)

**Configuration:** 2 CPU, 4GB RAM

**Daily Costs:**
- Container runtime: 8h × $0.110 = $0.88
- Storage: $0.08
- Registry: $0.17
- **Total: $1.13/day = $34/month**

### Scenario 3: Always-On Container (24/7)

**Configuration:** 1 CPU, 2GB RAM

**Daily Costs:**
- Container runtime: 24h × $0.055 = $1.32
- Storage: $0.08
- Registry: $0.17
- **Total: $1.57/day = $47/month**

### Scenario 4: Team (5 Users, Mixed Usage)

**Assumptions:**
- 2 users: 8h/day (full-time)
- 2 users: 4h/day (part-time)
- 1 user: 2h/day (light)

**Monthly Costs:**
- 2 × $34 = $68
- 2 × $17 = $34
- 1 × $8 = $8
- Storage (5 users × $2.40): $12
- Registry: $5
- **Total: $127/month**

## Cost Optimization

### 1. Container Lifecycle Management

**Auto-Stop Idle Containers:**
```go
// Stop containers after 30 minutes of inactivity
if time.Since(lastActivity) > 30*time.Minute {
    aciClient.StopContainer(containerID)
}
```

**Estimated Savings:** 40-60% reduction in compute costs

### 2. Right-Sizing Resources

**Start with minimal resources:**
- Default: 1 CPU, 2GB RAM
- Allow users to upgrade if needed
- Monitor actual usage

**Savings:** 50% cost reduction vs. over-provisioning

### 3. Storage Optimization

**File Share Lifecycle:**
- Delete workspaces after 30 days of inactivity
- Compress archived workspaces
- Use Cool tier for long-term storage

**Estimated Savings:** 20-30% on storage costs

### 4. Registry Optimization

**Image Management:**
- Use multi-stage builds to reduce image size
- Delete old image versions
- Share base layers across images

**Typical Savings:** Stay within Basic tier limits

### 5. Scheduling

**Development Hours:**
- Schedule containers during business hours only
- Implement "office hours" mode
- Auto-scale based on time of day

**Potential Savings:** 50-70% for businesses

### 6. Resource Groups and Tags

**Cost Tracking:**
```bash
# Tag all resources for cost tracking
--tags Environment=dev CostCenter=engineering Project=dev8
```

**Benefits:**
- Identify cost centers
- Optimize per-project
- Better budget allocation

## Monitoring and Alerts

### Set Up Cost Alerts

**Budget Alert (via CLI):**
```bash
az consumption budget create \
  --budget-name dev8-mvp-budget \
  --resource-group dev8-mvp-rg \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "1 year" +%Y-%m-01)
```

**Alert Thresholds:**
- 50% of budget: Warning
- 75% of budget: Alert
- 90% of budget: Critical
- 100% of budget: Forecasted alert

### Azure Cost Management

**Portal Access:**
1. Go to Cost Management + Billing
2. Select your subscription
3. View Cost Analysis

**Key Metrics to Monitor:**
- Daily cost trends
- Cost by resource type
- Cost by resource group
- Cost by tag

### Custom Dashboards

**Create cost dashboard:**
1. Azure Portal → Dashboard
2. Add Cost Analysis widget
3. Filter by resource group: dev8-mvp-rg
4. Set time range: Last 30 days

## Scaling Considerations

### Phase 1: MVP (1-10 users)
**Monthly Budget:** $50-100
- Basic Container Registry
- Standard_LRS Storage
- Manual scaling

### Phase 2: Growth (10-50 users)
**Monthly Budget:** $500-1,000
- Standard Container Registry
- Implement auto-scaling
- Add monitoring and analytics

### Phase 3: Scale (50-500 users)
**Monthly Budget:** $5,000-10,000
- Premium Container Registry
- Multi-region deployment
- Azure CDN for static assets
- Dedicated support plan

### Phase 4: Enterprise (500+ users)
**Monthly Budget:** $20,000+
- Enterprise-grade infrastructure
- Geo-replication
- Reserved instances
- Premium support

## Cost Comparison with Alternatives

| Service | Per User/Month | Notes |
|---------|----------------|-------|
| Dev8.dev (MVP) | $30-50 | Pay for actual usage |
| GitHub Codespaces | $18 (2-core) | 120 hours/month included |
| Gitpod | $39 | Unlimited hours |
| AWS Cloud9 | $30-50 | Similar to Dev8 |
| Self-hosted (VMs) | $50-100 | Higher fixed costs |

**Dev8.dev Advantages:**
- Pay only for active usage
- No minimum commitment
- Easy to scale
- Azure ecosystem integration

## FAQ

**Q: Can I reduce costs further?**
A: Yes! Implement auto-stop, right-size containers, and delete unused resources.

**Q: What if I exceed my budget?**
A: Azure will send alerts but won't stop services. Monitor closely or implement spending limits.

**Q: Are there free tier options?**
A: Azure free tier doesn't include ACI or ACR, but you get $200 credit for 30 days as a new customer.

**Q: How do I track costs per user?**
A: Tag resources with user IDs and use Azure Cost Management filtering.

## Resources

- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Azure Container Instances Pricing](https://azure.microsoft.com/pricing/details/container-instances/)
- [Azure Storage Pricing](https://azure.microsoft.com/pricing/details/storage/files/)
- [Azure Container Registry Pricing](https://azure.microsoft.com/pricing/details/container-registry/)
- [Azure Cost Management Docs](https://docs.microsoft.com/azure/cost-management-billing/)

---

**Last Updated:** 2024
**Currency:** USD
**Region:** East US
