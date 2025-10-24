# 🚀 CI/CD Pipelines Documentation

## Overview

Dev8.dev uses separate CI and CD pipelines for Docker image management:

- **CI Pipeline** (`docker-images.yml`) - Runs on pull requests to `main`
- **CD Pipeline** (`docker-cd-production.yml`) - Runs on push to `production` branch

---

## 🔄 Workflow Overview

```
Developer → Feature Branch → PR to main → CI Pipeline (Build & Test)
                                               ↓
                                          PR Approved
                                               ↓
                                       Merge to main branch
                                               ↓
                                    Manual merge main → production
                                               ↓
                                    CD Pipeline (Build, Scan, Deploy to ACR)
                                               ↓
                                    Azure Container Registry
                                               ↓
                                    Production Deployment
```

---

## 📋 CI Pipeline (Pull Requests)

### Trigger
- Pull requests to `main` branch
- Changes to `docker/**` or `apps/supervisor/**`
- Manual workflow dispatch

### What it does
1. ✅ Detects which layers changed
2. ✅ Builds only affected layers (optimization)
3. ✅ Runs tests on each layer
4. ✅ Scans for vulnerabilities (Trivy)
5. ✅ Reports results in PR

### File
`.github/workflows/docker-images.yml`

### Example
```bash
# Automatically runs when you create a PR to main
git checkout -b feature/update-nodejs
# ... make changes to docker/images/10-languages/Dockerfile
git commit -am "Update Node.js to 20.12.0"
git push origin feature/update-nodejs
# Create PR to main → CI runs automatically
```

---

## 🚢 CD Pipeline (Production Deployment)

### Trigger
- Push to `production` branch (merge from main)
- Manual workflow dispatch with environment selection

### What it does
1. ✅ Generates version tags (e.g., `v20241024-a1b2c3d`)
2. ✅ Builds all required layers sequentially
3. ✅ Runs comprehensive tests
4. ✅ Performs security scans (Trivy)
5. ✅ Pushes to Azure Container Registry with multiple tags:
   - `:latest` - Latest production image
   - `:production` - Production stable tag
   - `:v20241024-a1b2c3d` - Specific version

### File
`.github/workflows/docker-cd-production.yml`

### Example
```bash
# Merge main into production to trigger deployment
git checkout production
git merge main
git push origin production
# CD pipeline runs automatically
```

---

## 🔧 Setup Requirements

### GitHub Secrets

Add these secrets to your GitHub repository:

1. **ACR_USERNAME** - Azure Container Registry username
2. **ACR_PASSWORD** - Azure Container Registry password

#### How to get ACR credentials:

```bash
# Login to Azure
az login

# Get ACR credentials
az acr credential show --name dev8registry

# Set secrets in GitHub
# Go to: Repository → Settings → Secrets and variables → Actions
# Add: ACR_USERNAME = <username from above>
# Add: ACR_PASSWORD = <password from above>
```

### Azure Container Registry Setup

```bash
# Create resource group (if not exists)
az group create --name dev8-rg --location eastus

# Create Azure Container Registry
az acr create \
  --resource-group dev8-rg \
  --name dev8registry \
  --sku Basic \
  --admin-enabled true

# Get login server
az acr show --name dev8registry --query loginServer --output tsv
# Output: dev8registry.azurecr.io
```

---

## 🎯 Layer Build Strategy

### Smart Layer Detection

The pipelines automatically detect which layers need rebuilding:

| Changed Files | Layers Rebuilt |
|---------------|----------------|
| `00-base/` or `apps/supervisor/` | All layers (base → languages → vscode → workspace) |
| `10-languages/` | languages → vscode → workspace |
| `20-vscode/` | vscode → workspace |
| `30-ai-tools/` | workspace only |

### Build Optimization

- **Layer caching** - Each layer caches from ACR
- **Parallel jobs** - Independent tests run in parallel
- **Conditional builds** - Only rebuild what changed
- **BuildKit** - Modern Docker build engine for speed

---

## 📊 Pipeline Stages

### CI Pipeline Stages

```
1. Setup
   ├─ Checkout code
   ├─ Detect changes
   └─ Generate PR version

2. Build Base (if changed)
   ├─ Build dev8-base
   ├─ Test base
   └─ Scan vulnerabilities

3. Build Languages (if changed)
   ├─ Build dev8-languages
   ├─ Test languages
   └─ Verify runtimes

4. Build VS Code (if changed)
   ├─ Build dev8-vscode
   ├─ Test code-server
   └─ Check health

5. Build AI Tools (if changed)
   ├─ Build dev8-workspace
   ├─ Test AI CLIs
   └─ Scan vulnerabilities

6. Summary
   └─ Generate PR summary
```

### CD Pipeline Stages

```
1. Setup
   ├─ Checkout code
   ├─ Generate version tag
   └─ Detect changes

2. Build & Push Base
   ├─ Build dev8-base
   ├─ Test base
   ├─ Scan vulnerabilities
   └─ Push to ACR

3. Build & Push Languages
   ├─ Pull/build base
   ├─ Build dev8-languages
   ├─ Test languages
   └─ Push to ACR

4. Build & Push VS Code
   ├─ Pull/build prerequisites
   ├─ Build dev8-vscode
   ├─ Test code-server
   └─ Push to ACR

5. Build & Push AI Tools
   ├─ Pull/build prerequisites
   ├─ Build dev8-workspace
   ├─ Test AI tools
   ├─ Comprehensive scan
   └─ Push to ACR (3 tags)

6. Post-Deployment
   ├─ Generate summary
   ├─ List ACR images
   └─ Notify results

7. Notifications
   ├─ Success notification
   └─ Failure notification
```

---

## 🔐 Security Scans

### Trivy Integration

Both pipelines use Trivy to scan for vulnerabilities:

```yaml
# Scans for CRITICAL and HIGH severity
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: dev8-workspace:latest
    severity: 'CRITICAL,HIGH'
    format: 'sarif'
```

Results are uploaded to GitHub Security tab:
- Repository → Security → Code scanning alerts

---

## 📝 Manual Workflow Dispatch

### Trigger CI Manually

```yaml
# Go to: Actions → Docker CI - Build & Test → Run workflow
Options:
- build_base: true/false
- build_languages: true/false
- build_vscode: true/false
- build_ai_tools: true/false
```

### Trigger CD Manually

```yaml
# Go to: Actions → Docker CD - Production Deploy → Run workflow
Options:
- environment: production/staging
- force_rebuild: true/false (rebuild all layers)
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. ACR Login Failed
```bash
Error: unauthorized: authentication required
```

**Solution:**
- Check ACR_USERNAME and ACR_PASSWORD secrets
- Verify ACR admin is enabled: `az acr update --name dev8registry --admin-enabled true`

#### 2. Image Not Found
```bash
Error: manifest for dev8-base:latest not found
```

**Solution:**
- Ensure base layer was built successfully
- Check if previous build completed
- Try force rebuild: Set `force_rebuild: true`

#### 3. Build Timeout
```bash
Error: The job running on runner has exceeded the maximum execution time
```

**Solution:**
- Increase timeout in workflow (default: 360 minutes)
- Optimize Dockerfile (remove unnecessary layers)
- Use BuildKit cache mounts

#### 4. Layer Dependency Issues
```bash
Error: failed to solve: dev8-base:latest: not found
```

**Solution:**
- Build layers in order (base → languages → vscode → ai-tools)
- Don't skip prerequisite layers
- Use `force_rebuild: true` to rebuild all

---

## 📈 Monitoring & Metrics

### Build Times (Approximate)

| Layer | CI Build | CD Build (with push) |
|-------|----------|---------------------|
| Base | 3-5 min | 5-7 min |
| Languages | 5-8 min | 8-12 min |
| VS Code | 2-3 min | 3-5 min |
| AI Tools | 2-3 min | 4-6 min |
| **Total** | **12-19 min** | **20-30 min** |

### Success Rates

Monitor in GitHub Actions:
- Repository → Actions → Workflows
- Check success/failure rate
- Review average build times

---

## 🔄 Deployment Process

### Complete Deployment Flow

```bash
# 1. Create feature branch
git checkout -b feature/update-python
# Edit docker/images/10-languages/Dockerfile

# 2. Commit and push
git add .
git commit -m "Update Python to 3.11.8"
git push origin feature/update-python

# 3. Create PR to main
# GitHub → Pull requests → New PR
# CI pipeline runs automatically

# 4. Review and merge PR
# After approval, merge to main

# 5. Deploy to production
git checkout production
git merge main
git push origin production
# CD pipeline runs automatically

# 6. Verify deployment
az acr repository show-tags --name dev8registry --repository dev8-workspace

# 7. Pull and test
docker pull dev8registry.azurecr.io/dev8-workspace:latest
docker run -it --rm dev8registry.azurecr.io/dev8-workspace:latest bash
```

---

## 📚 Additional Resources

### Related Documentation
- [Docker Architecture](../../docker/ARCHITECTURE.md)
- [Build Guide](../../docker/BUILD_GUIDE.md)
- [Production Checklist](../../docker/PRODUCTION_CHECKLIST.md)
- [Container Capabilities](../../docker/CONTAINER_CAPABILITIES.md)

### External Resources
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Docker BuildKit](https://docs.docker.com/build/buildkit/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)

---

## 🎯 Best Practices

1. **Always test locally first**
   ```bash
   cd docker
   make build-all
   make test
   ```

2. **Create small, focused PRs**
   - One layer change per PR
   - Clear commit messages
   - Include tests

3. **Review security scans**
   - Check GitHub Security tab after builds
   - Address CRITICAL and HIGH vulnerabilities
   - Document accepted risks

4. **Version control**
   - Tag releases: `git tag v1.0.0`
   - Semantic versioning: MAJOR.MINOR.PATCH
   - Keep changelog updated

5. **Monitor deployments**
   - Check build status regularly
   - Review ACR storage usage
   - Clean up old images periodically

---

## 📞 Support

For issues or questions:
- **GitHub Issues**: [Create an issue](https://github.com/VAIBHAVSING/Dev8.dev/issues)
- **Discord**: [Join our community](https://discord.gg/xE2u4b8S8g)
- **Documentation**: [docs.dev8.dev](https://docs.dev8.dev)

---

**Last Updated:** 2025-10-24  
**Maintained by:** Dev8.dev Team
