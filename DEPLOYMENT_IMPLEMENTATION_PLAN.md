# Dev8.dev Azure Deployment Implementation Plan

## Executive Summary

**Current Status:**

- ✅ PROD deployed: Storage + ACR in `dev8-prod-rg` (centralindia)
- ✅ DEV deployed: Storage + ACR in `dev8-dev-rg` (eastus)
- ❌ ACA environments: None deployed
- ❌ make deploy-dev-aca: Fails with AppLogsConfiguration error
- ⚠️ Issue: Separate ACRs per environment (unnecessary cost)

**Goal:**

1. Fix ACA deployment with proper Bicep templates
2. Unify to single ACR for both dev/prod
3. Support both ACI and ACA deployment modes
4. Clean up redundant documentation
5. Ensure all env vars configured in apps/agent/.env.example

---

## Problem Analysis

### Issue 1: ACA Environment Creation Failure

**Error:**

```
InvalidRequestParameterWithDetails: AppLogsConfiguration.Destination is invalid.
App Logs destination 'none' not supported. Supported values: 'log-analytics', 'azure-monitor' or none
```

**Root Cause:**

- `aca-environment.bicep` doesn't configure appLogsConfiguration
- Azure requires explicit log destination

**Solution:**

- Create minimal ACA environment without logging (cost optimization)
- Remove the appLogsConfiguration property entirely or set properly

### Issue 2: Duplicate ACRs (Cost Issue)

**Current:**

- `dev8prodcr5xv5pu3m2xjli` in dev8-prod-rg
- `dev8devcr3ttnbdco3yuv6` in dev8-dev-rg

**Impact:**

- $10/month ($5 × 2) instead of $5/month
- Unnecessary for Azure for Students

**Solution:**

- Use single shared ACR: `dev8sharedcr<suffix>`
- Deploy in dev8-prod-rg
- Both environments reference same ACR

### Issue 3: Makefile Complexity

**Current:**

- `_deploy-aca` creates ACA env but still uses parameter files that disable ACA
- Confusing deploy-dev-aca vs deploy-dev-aci targets
- Manual confirmation prompts block CI/CD

**Solution:**

- Separate Bicep parameter files for ACI vs ACA
- Clear naming: `dev.aci.bicepparam`, `dev.aca.bicepparam`
- Non-interactive modes for automation

---

## Implementation Plan

### Phase 1: Fix ACA Environment Bicep Template

**Files to modify:**

- `in/azure/bicep/modules/aca-environment.bicep`

**Changes:**

```bicep
resource environment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    zoneRedundant: false
    // Do NOT include appLogsConfiguration for free tier
  }
}
```

### Phase 2: Unified ACR Architecture

**Files to modify:**

- `in/azure/bicep/main.bicep`
- `in/azure/bicep/parameters/dev.bicepparam`
- `in/azure/bicep/parameters/prod.bicepparam`

**New ACR Strategy:**

```
Resource Group: dev8-shared-rg (centralindia)
├── ACR: dev8sharedcr<suffix>
│   └── Used by: dev8-dev-rg + dev8-prod-rg
└── Cost: $5/month (single ACR)
```

**Parameter Changes:**

- Add `useSharedACR` parameter
- Add `sharedACRResourceGroup` parameter
- Conditional ACR deployment

### Phase 3: Separate Parameter Files

**New files to create:**

```
in/azure/bicep/parameters/
├── dev.aci.bicepparam    # DEV with ACI
├── dev.aca.bicepparam    # DEV with ACA
├── prod.aci.bicepparam   # PROD with ACI
└── prod.aca.bicepparam   # PROD with ACA
```

### Phase 4: Refactor Makefile

**New targets:**

```makefile
# Clear deployment options
make deploy-dev-aci       # DEV + ACI (default, fast)
make deploy-dev-aca       # DEV + ACA (scale-to-zero)
make deploy-prod-aci      # PROD + ACI (current)
make deploy-prod-aca      # PROD + ACA (advanced)

# Non-interactive
make deploy-dev-aci-auto  # CI/CD friendly
make deploy-dev-aca-auto  # CI/CD friendly

# Utility
make clean-acr            # Delete redundant ACRs
make migrate-to-shared-acr # Migrate to single ACR
```

### Phase 5: Apps/Agent Environment Configuration

**Files to modify:**

- `apps/agent/.env.example`

**Required env vars:**

```bash
# Deployment Mode
AZURE_DEPLOYMENT_MODE=aci  # or 'aca'

# Shared ACR
AZURE_CONTAINER_REGISTRY=dev8sharedcr<suffix>.azurecr.io
REGISTRY_USERNAME=<from-shared-acr>
REGISTRY_PASSWORD=<from-shared-acr>

# ACA specific (when mode=aca)
AZURE_ACA_ENVIRONMENT_ID=<full-resource-id>

# Storage (per environment)
AZURE_STORAGE_ACCOUNT=<env-specific>
AZURE_STORAGE_KEY=<env-specific>
```

### Phase 6: Documentation Cleanup

**Files to remove:**

```
in/azure/ACA_DEPLOYMENT_PLAN.md
in/azure/ACI_QUICK_REFERENCE.md
in/azure/COMPREHENSIVE_ANALYSIS.md
in/azure/DEPLOYMENT_FLOW.md
```

**Files to keep/update:**

```
in/azure/README.md (primary, comprehensive)
in/azure/docs/* (detailed guides)
```

---

## Detailed Implementation Steps

### Step 1: Fix ACA Bicep (Immediate)

```bash
# Edit aca-environment.bicep
# Remove appLogsConfiguration or set to proper value
# Test: make deploy-dev-aca
```

### Step 2: Create Shared ACR

```bash
# Create shared resource group
az group create --name dev8-shared-rg --location centralindia

# Deploy shared ACR only
az acr create \
  --name dev8sharedcr$(openssl rand -hex 4) \
  --resource-group dev8-shared-rg \
  --sku Basic \
  --admin-enabled true

# Get credentials
ACR_NAME=$(az acr list -g dev8-shared-rg --query "[0].name" -o tsv)
ACR_USER=$(az acr credential show -n $ACR_NAME --query username -o tsv)
ACR_PASS=$(az acr credential show -n $ACR_NAME --query "passwords[0].value" -o tsv)
```

### Step 3: Update Bicep Templates

```bicep
// main.bicep - Add conditional ACR
param useSharedACR bool = true
param sharedACRName string = ''
param sharedACRResourceGroup string = 'dev8-shared-rg'

module registry 'modules/registry.bicep' = if (!useSharedACR) {
  name: 'registry-deployment'
  // ... existing
}

// Output shared ACR if used
output registryLoginServer string = useSharedACR
  ? '${sharedACRName}.azurecr.io'
  : registry.outputs.loginServer
```

### Step 4: Create New Parameter Files

```bicep
// dev.aca.bicepparam
using '../main.bicep'
param environment = 'dev'
param location = 'eastus'
param useSharedACR = true
param sharedACRName = 'dev8sharedcr<suffix>'
param deployACAEnvironment = true
param acaEnvironmentName = 'dev8-dev-aca-env'
```

### Step 5: Refactor Makefile Targets

```makefile
deploy-dev-aca: check-login check-bicep
	@echo "Deploying DEV with ACA..."
	@$(MAKE) _deploy-with-aca \
		RG_NAME=$(RG_NAME_DEV) \
		LOCATION=eastus \
		PARAMS_FILE=bicep/parameters/dev.aca.bicepparam \
		ACA_ENV_NAME=dev8-dev-aca-env

_deploy-with-aca:
	# Step 1: Create resource group
	# Step 2: Check/create ACA environment
	# Step 3: Deploy Bicep with ACA enabled
	# Step 4: Configure agent .env
```

### Step 6: Update Agent .env.example

```bash
# Add all Azure-related env vars with comments
# Include both ACI and ACA configurations
# Add shared ACR configuration
```

### Step 7: Cleanup

```bash
# Remove old docs
rm in/azure/*.md (except README.md)

# Optional: Delete old ACRs after migration
az acr delete -n dev8devcr3ttnbdco3yuv6 -g dev8-dev-rg --yes
# (keep prod ACR until confirmed working)
```

---

## Migration Strategy

### For Existing Users

**Option A: Keep Current Setup (ACI only)**

```bash
# No changes needed
make deploy-dev-aci  # continues to work
make deploy-prod-aci # continues to work
```

**Option B: Migrate to ACA**

```bash
# 1. Deploy ACA environment
make deploy-dev-aca

# 2. Update agent config
cd apps/agent
# Edit .env: AZURE_DEPLOYMENT_MODE=aca

# 3. Deploy workspaces
cd ../../docker
make dev-deploy-aca
```

**Option C: Migrate to Shared ACR**

```bash
# 1. Create shared ACR
make create-shared-acr

# 2. Push images to shared ACR
docker tag <old-image> dev8sharedcr.azurecr.io/dev8-workspace:latest
docker push dev8sharedcr.azurecr.io/dev8-workspace:latest

# 3. Update environments
make deploy-dev-aci  # auto-uses shared ACR
make deploy-prod-aci # auto-uses shared ACR

# 4. Delete old ACRs
make cleanup-old-acrs
```

---

## Testing Plan

### Test 1: ACA Environment Creation

```bash
cd in/azure
make deploy-dev-aca
# Expected: Creates dev8-dev-aca-env successfully
```

### Test 2: Shared ACR

```bash
make create-shared-acr
make deploy-dev-aci  # should use shared ACR
make deploy-prod-aci # should use shared ACR
```

### Test 3: Agent Configuration

```bash
cd apps/agent
cat .env | grep AZURE_
# Verify all required vars present
```

### Test 4: End-to-End Workspace

```bash
# ACI mode
make deploy-dev-aci
cd ../../docker && make dev-deploy-aci

# ACA mode
make deploy-dev-aca
cd ../../docker && make dev-deploy-aca
```

---

## Rollback Plan

### If ACA Deployment Fails

```bash
# Revert to ACI only
cd apps/agent
sed -i 's/AZURE_DEPLOYMENT_MODE=aca/AZURE_DEPLOYMENT_MODE=aci/' .env

# Use existing infrastructure
make deploy-dev-aci
```

### If Shared ACR Fails

```bash
# Keep environment-specific ACRs
# Update param files: useSharedACR = false
make deploy-dev-aci
make deploy-prod-aci
```

---

## Cost Comparison

### Current (2 ACRs)

```
Dev ACR:  $5/month
Prod ACR: $5/month
Total:    $10/month
```

### After Migration (1 Shared ACR)

```
Shared ACR: $5/month
Total:      $5/month
Savings:    $5/month ($60/year)
```

### ACI vs ACA Costs

```
ACI:  Pay per second (running only)
ACA:  $0/month (scale-to-zero) + pay per execution
Verdict: ACA cheaper for infrequent use, ACI cheaper for 24/7
```

---

## Success Criteria

✅ `make deploy-dev-aca` completes without errors
✅ `make deploy-dev-aci` continues to work
✅ Single shared ACR for both environments
✅ All env vars documented in .env.example
✅ Redundant docs removed
✅ Both ACI and ACA modes functional
✅ Agent can deploy to both ACI and ACA
✅ Cost reduced from $10/month to $5/month

---

## Timeline

**Immediate (1 hour):**

- Fix aca-environment.bicep
- Test make deploy-dev-aca

**Short-term (2-3 hours):**

- Create shared ACR
- Update Bicep templates
- Refactor Makefile

**Medium-term (4-6 hours):**

- Update agent .env.example
- Comprehensive testing
- Documentation cleanup

**Total Estimated Time: 8-10 hours**

---

## Priority Order

1. **P0 (Critical):** Fix ACA environment Bicep - blocks all ACA deployments
2. **P1 (High):** Unified ACR - saves cost immediately
3. **P2 (Medium):** Refactor Makefile - improves UX
4. **P3 (Low):** Documentation cleanup - reduces confusion
5. **P4 (Nice-to-have):** Complete .env.example - improves onboarding

---

## Next Steps

**Execute now:**

```bash
# 1. Fix ACA Bicep
vim in/azure/bicep/modules/aca-environment.bicep
# Remove appLogsConfiguration

# 2. Test
cd in/azure && make deploy-dev-aca INTERACTIVE=false

# 3. If successful, proceed with shared ACR
make create-shared-acr

# 4. Update and redeploy
make deploy-dev-aci
make deploy-prod-aci
```

**Then review and approve before:**

- Deleting old ACRs
- Removing documentation
- Final testing

---

## Questions for Review

1. ✅ Should we keep 2 ACRs or move to 1 shared? **Answer: 1 shared**
2. ✅ Should dev use ACA or ACI by default? **Answer: ACI (simpler)**
3. ✅ Should prod use ACA or ACI by default? **Answer: ACI (current)**
4. ⚠️ When to delete old ACRs? **Answer: After confirming shared ACR works**
5. ⚠️ Which docs to keep? **Answer: Keep README.md + docs/\* only**

---

_Plan created: 2025-01-07_
_Status: Ready for implementation_
