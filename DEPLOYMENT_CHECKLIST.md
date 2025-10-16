# 🚀 Production Deployment Checklist

Quick reference checklist for deploying Dev8.dev to Azure.

**Estimated Time:** 2-3 hours  
**Estimated Cost:** $50-100/month

---

## ✅ Pre-Deployment

### Tools Installation
- [ ] Azure CLI installed (`az --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm 9+ installed (`pnpm --version`)
- [ ] Go 1.22+ installed (`go version`)

### Azure Account
- [ ] Active Azure subscription
- [ ] Logged in (`az login`)
- [ ] Contributor permissions verified
- [ ] Credit card on file

### Repository
- [ ] Code cloned locally
- [ ] On `docker-setup` or `main` branch
- [ ] `in/azure/` folder exists

---

## 🏗️ Phase 1: Azure Infrastructure (30 min)

```bash
cd /home/vsing/code/Dev8.dev/in/azure/scripts
chmod +x *.sh
./setup-infrastructure.sh
./validate-setup.sh
```

- [ ] Resource group created (`dev8-mvp-rg`)
- [ ] Storage account created (check suffix)
- [ ] Container registry created (check suffix)
- [ ] Service principal created
- [ ] `azure-credentials.json` generated
- [ ] `.env.azure` file created
- [ ] Validation script passed ✅

**Save these values:**
```bash
REGISTRY_NAME=_______________
STORAGE_NAME=_______________
SUBSCRIPTION_ID=_______________
```

---

## 🐳 Phase 2: Docker Images (30 min)

### Fix Build Script
```bash
cd /home/vsing/code/Dev8.dev/docker
# Edit build.sh:
# Line 60: Change `./base/` to `.`
# Line 77: Change `./mvp/` to `.`
```

- [ ] build.sh context fixed

### Build & Push
```bash
export REGISTRY=$(az acr show --name YOUR_REGISTRY_NAME --query loginServer -o tsv)
export VERSION=1.0.0
BUILD_BASE=true BUILD_MVP=true ./build.sh

az acr login --name YOUR_REGISTRY_NAME
docker tag dev8-base:1.0.0 ${REGISTRY}/dev8-base:latest
docker tag dev8-mvp:1.0.0 ${REGISTRY}/dev8-mvp:latest
docker push ${REGISTRY}/dev8-base:latest
docker push ${REGISTRY}/dev8-mvp:latest
```

- [ ] Base image built (757MB)
- [ ] MVP image built (~3.5GB)
- [ ] Logged into ACR
- [ ] Images tagged
- [ ] Images pushed to registry
- [ ] Verified in ACR (`az acr repository list`)

---

## 💾 Phase 3: Database (20 min)

```bash
az postgres flexible-server create \
  --resource-group dev8-mvp-rg \
  --name dev8-postgres-server \
  --location eastus \
  --admin-user dev8admin \
  --admin-password "YOUR_STRONG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14

az postgres flexible-server db create \
  --resource-group dev8-mvp-rg \
  --server-name dev8-postgres-server \
  --database-name dev8db
```

- [ ] PostgreSQL server created
- [ ] Database `dev8db` created
- [ ] Connection string saved
- [ ] Firewall rules configured
- [ ] Connection tested with `psql`

**Save this:**
```bash
DATABASE_URL=postgresql://dev8admin:PASSWORD@HOST:5432/dev8db?sslmode=require
```

### Run Migrations
```bash
cd /home/vsing/code/Dev8.dev/apps/web
export DATABASE_URL="YOUR_CONNECTION_STRING"
pnpm prisma migrate deploy
pnpm prisma generate
```

- [ ] Migrations applied
- [ ] Prisma client generated
- [ ] Tables created (verify with `\dt` in psql)

---

## 🤖 Phase 4: Go Agent (30 min)

### Build Binary
```bash
cd /home/vsing/code/Dev8.dev/apps/agent
GOOS=linux GOARCH=amd64 go build -o agent-linux main.go
```

- [ ] Binary built for Linux

### Deploy to ACI
```bash
az container create \
  --resource-group dev8-mvp-rg \
  --name dev8-agent \
  --image YOUR_REGISTRY.azurecr.io/dev8-agent:latest \
  --cpu 1 \
  --memory 2 \
  --registry-login-server YOUR_REGISTRY.azurecr.io \
  --registry-username $(az acr credential show --name REGISTRY_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name REGISTRY_NAME --query passwords[0].value -o tsv) \
  --dns-name-label dev8-agent \
  --ports 8080 \
  --environment-variables \
    AGENT_PORT=8080 \
    AZURE_SUBSCRIPTION_ID=YOUR_SUB_ID \
    AZURE_RESOURCE_GROUP=dev8-mvp-rg \
    AZURE_STORAGE_ACCOUNT=YOUR_STORAGE \
    AZURE_CONTAINER_REGISTRY=YOUR_REGISTRY.azurecr.io \
  --secure-environment-variables \
    AZURE_STORAGE_KEY=YOUR_KEY
```

- [ ] Container created
- [ ] Container running
- [ ] FQDN obtained
- [ ] Health check passed (`curl http://FQDN:8080/health`)

**Save this:**
```bash
AGENT_URL=http://dev8-agent.eastus.azurecontainer.io:8080
```

---

## 🌐 Phase 5: Next.js Frontend (30 min)

### Configure Environment
```bash
cd /home/vsing/code/Dev8.dev/apps/web
cat > .env.production << EOF
DATABASE_URL="YOUR_DATABASE_URL"
NEXTAUTH_URL="https://dev8-web.azurewebsites.net"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
AUTH_SECRET="$(openssl rand -base64 32)"
AGENT_API_URL="YOUR_AGENT_URL"
EOF
```

- [ ] `.env.production` created
- [ ] All secrets generated
- [ ] Agent URL configured

### Build & Deploy
```bash
pnpm install
pnpm build

# Create App Service
az appservice plan create \
  --name dev8-app-plan \
  --resource-group dev8-mvp-rg \
  --sku B1 \
  --is-linux

az webapp create \
  --resource-group dev8-mvp-rg \
  --plan dev8-app-plan \
  --name dev8-web \
  --runtime "NODE:20-lts"

# Deploy
zip -r deploy.zip .next standalone package.json
az webapp deployment source config-zip \
  --resource-group dev8-mvp-rg \
  --name dev8-web \
  --src deploy.zip
```

- [ ] App built successfully
- [ ] App Service created
- [ ] Code deployed
- [ ] Environment variables set
- [ ] Site accessible (https://dev8-web.azurewebsites.net)

---

## 🧪 Phase 6: Testing (30 min)

### Test Agent API
```bash
# Health check
curl http://dev8-agent.eastus.azurecontainer.io:8080/health

# Create test environment
curl -X POST http://dev8-agent.eastus.azurecontainer.io:8080/api/v1/environments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "name": "Test Env",
    "cloudProvider": "AZURE",
    "cloudRegion": "eastus",
    "cpuCores": 1,
    "memoryGB": 2,
    "storageGB": 20,
    "baseImage": "REGISTRY.azurecr.io/dev8-mvp:latest"
  }'
```

- [ ] Health endpoint responds
- [ ] Can create environment via API
- [ ] ACI container spins up
- [ ] File share created

### Test Frontend
- [ ] Can access web app
- [ ] Can register account
- [ ] Can create environment
- [ ] Environment shows in dashboard
- [ ] Can access VS Code server

### Verify Resources
```bash
# List all containers
az container list --resource-group dev8-mvp-rg --output table

# Check specific container
az container show \
  --resource-group dev8-mvp-rg \
  --name env-XXXXX \
  --query "{FQDN:ipAddress.fqdn,State:instanceView.state}"
```

- [ ] Agent container running
- [ ] User environment container(s) running
- [ ] All have public IPs/FQDNs
- [ ] Can SSH to containers (if configured)

---

## 💰 Post-Deployment

### Cost Monitoring
```bash
# View budget
az consumption budget show \
  --resource-group dev8-mvp-rg \
  --budget-name dev8-mvp-budget

# View current costs
az consumption usage list \
  --start-date $(date -d "7 days ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d)
```

- [ ] Budget alerts configured
- [ ] Cost monitoring set up
- [ ] Daily/weekly reviews scheduled

### Security
- [ ] Service principal credentials secured
- [ ] Database password stored safely
- [ ] No secrets in git
- [ ] Firewall rules reviewed
- [ ] HTTPS configured for web app

### Documentation
- [ ] Deployment notes saved
- [ ] Credentials stored in password manager
- [ ] Team notified of URLs
- [ ] Runbook created for operations

---

## 📊 Success Criteria

### Agent API
- ✅ Health endpoint returns 200
- ✅ Can create environments
- ✅ Can list environments
- ✅ Can start/stop environments
- ✅ Can delete environments

### Frontend
- ✅ Site loads without errors
- ✅ User registration works
- ✅ User login works
- ✅ Environment creation works
- ✅ Environment dashboard shows status

### Infrastructure
- ✅ All resources in `dev8-mvp-rg`
- ✅ Containers running
- ✅ Database connected
- ✅ Images in registry
- ✅ Storage account operational

### End-to-End
- ✅ User can create account
- ✅ User can create environment
- ✅ Environment spins up in <2 min
- ✅ VS Code Server accessible
- ✅ Files persist after restart
- ✅ Can SSH into environment
- ✅ Can run code in environment

---

## 🔧 Troubleshooting Quick Ref

### Agent Won't Start
```bash
az container logs --resource-group dev8-mvp-rg --name dev8-agent
# Check: Azure credentials, subscription ID, registry auth
```

### Database Connection Failed
```bash
psql "$DATABASE_URL"
az postgres flexible-server firewall-rule create ...
# Check: Firewall rules, SSL mode, password
```

### Container Won't Create
```bash
# Check agent logs
az container logs --resource-group dev8-mvp-rg --name dev8-agent

# Verify registry
az acr credential show --name REGISTRY_NAME

# Test image pull
docker pull REGISTRY.azurecr.io/dev8-mvp:latest
```

### High Costs
```bash
# Stop unused containers
az container stop --resource-group dev8-mvp-rg --name CONTAINER_NAME

# Delete unused resources
az container delete --resource-group dev8-mvp-rg --name CONTAINER_NAME

# Review all resources
az resource list --resource-group dev8-mvp-rg --output table
```

---

## 📞 Support Resources

- **Full Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Azure Docs**: `in/azure/docs/`
- **Setup Scripts**: `in/azure/scripts/`
- **Azure Status**: https://status.azure.com
- **Cost Calculator**: https://azure.microsoft.com/pricing/calculator/

---

**Last Updated:** October 16, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅
