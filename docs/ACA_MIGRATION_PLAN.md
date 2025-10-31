# Azure Container Apps (ACA) Migration Plan

**Created:** 2024-10-31  
**Status:** Implementation Ready  
**Version:** 1.0.0

---

## 📋 Executive Summary

This document outlines the migration strategy from Azure Container Instances (ACI) to Azure Container Apps (ACA) for Dev8.dev's cloud development workspaces.

### Key Highlights

- **Approach:** Hybrid ACI+ACA deployment (not full replacement)
- **Cost Savings:** 30-40% through intelligent routing
- **Zero Downtime:** Gradual migration with rollback capability
- **Implementation:** Stateless agent enhancement (no breaking changes)

---

## 💰 Cost Analysis (Official Azure Pricing - Oct 2024)

### Current Pricing (2 vCPU, 8 GB RAM)

#### Azure Container Instances (ACI)
```
Pricing Model: Per-hour billing (always running)
  • vCPU:   $0.0405/hour per vCPU
  • Memory: $0.00445/hour per GB

Single Instance (24/7):
  • vCPU Cost:   2 × $0.0405 × 720 hrs = $58.32
  • Memory Cost: 8 × $0.00445 × 720 hrs = $25.63
  • TOTAL: $83.95/month

Multiple Instances:
  •   10 instances:   $839.52/month
  •   50 instances:  $4,197.60/month
  •  100 instances:  $8,395.20/month

✅ BEST FOR: 24/7 always-on workloads
```

#### Azure Container Apps (ACA)
```
Pricing Model: Per-second with active/idle states
  • vCPU Active:   $0.000024/second
  • Memory Active: $0.000003/second per GiB
  • vCPU Idle:     $0.000003/second
  • Memory Idle:   $0.000003/second per GiB
  • Requests:      $0.40 per million

Scenario 1: 100% Active (24/7)
  • TOTAL: $186.62/month ❌ MORE EXPENSIVE THAN ACI

Scenario 2: 50% Active, 50% Idle (typical dev)
  • Active (12h/day): $93.31
  • Idle (12h/day):   $38.88
  • TOTAL: $132.19/month ❌ STILL MORE THAN ACI

Scenario 3: 20% Active, 80% Scale-to-Zero (light usage)
  • Active (5h/day): $37.32
  • Scaled to Zero: $0.00
  • TOTAL: $37.32/month ✅ 56% CHEAPER THAN ACI

✅ BEST FOR: Workspaces idle >60% of time
```

---

## 🎯 Hybrid Deployment Strategy

### Cost Optimization Model

```
User Classification → Deployment Target
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Free Tier Users (idle >80%)
  → ACA (scale-to-zero)
  → Cost: $37/month/workspace
  → Savings: 56% vs ACI

Regular Users (8h/day, 5 days/week)
  → ACA (auto-scale)
  → Cost: ~$55-65/month/workspace
  → Savings: 25-35% vs ACI

Power Users (24/7 active)
  → ACI (always-on)
  → Cost: $84/month/workspace
  → Savings: 0% (but cheaper than ACA)
```

### Expected Savings (100 Workspaces)

| User Type | Count | Current (ACI) | Target (Hybrid) | Savings |
|-----------|-------|---------------|-----------------|---------|
| Power Users (24/7) | 20 | $1,679 | $1,679 (ACI) | $0 |
| Regular (8h/day) | 50 | $4,198 | $3,000 (ACA) | $1,198 (29%) |
| Casual (2h/day) | 30 | $2,519 | $1,120 (ACA) | $1,399 (56%) |
| **TOTAL** | **100** | **$8,396** | **$5,799** | **$2,597 (31%)** |

---

## 🚀 Migration Timeline

### Phase 1: Infrastructure Setup (Week 1)
- [ ] Deploy Container Apps Environment in `centralindia`
- [ ] Configure storage mounts for Azure Files
- [ ] Test environment creation with dummy workspaces

### Phase 2: Agent Implementation (Week 2)
- [ ] Create `aca_client.go` with full CRUD operations
- [ ] Add `DeploymentMode` to config
- [ ] Update `environment.go` service with routing logic
- [ ] Write unit tests for ACA client

### Phase 3: Testing & Validation (Week 3)
- [ ] Deploy agent to staging
- [ ] Create test workspaces on ACA
- [ ] Validate scale-to-zero behavior
- [ ] Cost monitoring setup

### Phase 4: Gradual Rollout (Week 4+)
- [ ] Enable for 10% free tier users
- [ ] Monitor costs and performance
- [ ] Enable for 50% free tier users
- [ ] Full hybrid deployment

---

**See full documentation in the PR description for detailed technical implementation.**
