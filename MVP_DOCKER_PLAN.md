# 🚀 Dev8.dev MVP Implementation Plan
**Complete Docker Images + Secret Management for Production**

> **Based on:** Complete codebase review + All requirements  
> **Timeline:** 1 week (4 days of focused work)  
> **Status:** ✅ Ready to implement  
> **Last Updated:** 2024-10-06

---

## 📋 Complete Requirements Met

Based on your requirements, this plan delivers:

✅ **ACI deployment** with VS Code Server  
✅ **SSH connection** - both web browser terminal AND local terminal  
✅ **VS Code access** - browser-based VS Code Server  
✅ **Language support** - Node.js, Bun, Go, Rust, Python pre-installed  
✅ **Automatic Git login** - GitHub, GitLab, BitBucket  
✅ **AI CLI tools** - Copilot CLI, Claude CLI, Gemini CLI  
✅ **VS Code Copilot** - Auto-configured and working  
✅ **Security** - SSH keys, tokens managed securely via environment variables

---

## 🏗️ Architecture

**Simple, Production-Ready Approach:**

```
User → Browser/SSH → ACI Container
                        ├── Entrypoint Script (Bash)
                        │   ├── Configure Git providers
                        │   ├── Setup AI CLIs
                        │   ├── Inject SSH keys
                        │   └── Start services
                        ├── code-server (Port 8080)
                        ├── SSH Server (Port 2222)
                        └── Languages & Tools
                            ├── Node.js 20 + Bun
                            ├── Python 3.11
                            ├── Go 1.21
                            └── Rust stable
                        ↓
                   Azure Files (Persistent)
```

**Secrets Flow:**
```
User creates environment with secrets
    ↓
Next.js → Go Agent (stores in DB/env vars)
    ↓
Go Agent creates ACI with env vars
    ↓
Container starts → Entrypoint reads env vars
    ↓
Configures everything automatically
    ↓
User connects (everything works!)
```

---

## 📦 Implementation: Single Fullstack Image

### Why One Image for MVP?
- ✅ Faster to build and maintain
- ✅ Users get ALL languages without switching
- ✅ Simpler deployment
- ✅ Can split later in Phase 2

### Image: `dev8-fullstack` (~4-5GB)

**Includes:**
- ✅ All languages: Node.js, Bun, Python, Go, Rust
- ✅ All AI CLIs: Copilot, Claude, Gemini
- ✅ Git providers: GitHub CLI, GitLab CLI
- ✅ Dev tools: Git, SSH, VS Code Server
- ✅ Smart entrypoint for auto-configuration

**See full Dockerfile in `/tmp/REAL_MVP_PLAN.md`**

---

## 🔗 Integration Points

### Go Agent Updates Needed

1. **Update Models** (`apps/agent/internal/models/environment.go`):
   - Add secret fields to `CreateEnvironmentRequest`

2. **Update Azure Client** (`apps/agent/internal/azure/client.go`):
   - Pass environment variables to container

3. **Update Service** (`apps/agent/internal/services/environment.go`):
   - Use `dev8-fullstack:latest` image
   - Pass secrets as environment variables

### Frontend Updates Needed

1. **Environment Creation Form**:
   - Git provider selection (GitHub/GitLab/Bitbucket)
   - Token input fields
   - SSH key input or generation
   - AI CLI API keys (optional)

---

## 📋 4-Day Implementation Plan

### Day 1: Docker Image (6-8 hours)
- [ ] Create `docker/fullstack/Dockerfile`
- [ ] Create `docker/fullstack/entrypoint.sh`
- [ ] Build and test locally
- [ ] Verify all languages work
- [ ] Verify VS Code and SSH work
- [ ] Push to Azure Container Registry

### Day 2: Go Agent Updates (4-6 hours)
- [ ] Update models with secret fields
- [ ] Update Azure client for env vars
- [ ] Update service to use new image
- [ ] Test environment creation
- [ ] Verify secret injection works

### Day 3: Frontend Integration (4-6 hours)
- [ ] Build environment creation form
- [ ] Add secret input fields
- [ ] Integrate with Go Agent API
- [ ] Test full workflow
- [ ] Handle errors gracefully

### Day 4: Testing & Polish (2-4 hours)
- [ ] E2E test: create → connect → code
- [ ] Test all Git providers
- [ ] Test all AI CLIs
- [ ] Test SSH from local terminal
- [ ] Write user documentation
- [ ] Deploy to production

---

## 🎯 Success Metrics

After implementation, verify:
- ✅ Environment creates in < 60 seconds
- ✅ Git works (push/pull) without manual setup
- ✅ SSH works from local terminal
- ✅ VS Code Copilot works in browser
- ✅ All languages available (node, python, go, rust, bun)
- ✅ AI CLIs work (claude, gemini)
- ✅ Workspace persists across restarts

---

## 🔐 Security Approach

**Secrets Management:**
- Secrets passed as environment variables (SecureValue in ACI)
- Not baked into Docker images
- Can be stored in database (encrypted)
- Can upgrade to Azure Key Vault in Phase 2

**Network Security:**
- SSH: Key-based auth only
- VS Code: Can add auth layer via proxy
- All traffic over HTTPS/SSH

---

## 🚀 Deployment Process

```bash
# 1. Build image
cd docker/fullstack
docker build -t dev8-fullstack:latest .

# 2. Test locally
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  -e GITHUB_TOKEN="ghp_xxx" \
  -v $(pwd)/test:/workspace \
  dev8-fullstack:latest

# 3. Push to ACR
az acr login --name yourregistry
docker tag dev8-fullstack:latest yourregistry.azurecr.io/dev8-fullstack:latest
docker push yourregistry.azurecr.io/dev8-fullstack:latest

# 4. Update Go agent config
export AZURE_CONTAINER_REGISTRY="yourregistry.azurecr.io"

# 5. Deploy!
```

---

## 💡 Why This Works

1. **Proven**: Same approach as Coder, Gitpod, Codespaces
2. **Simple**: Bash script everyone understands
3. **Complete**: Has ALL your requirements
4. **Fast**: Build in 1 week, not 1 month
5. **Secure**: Secrets managed properly
6. **Maintainable**: Easy to update and debug
7. **Scalable**: Works for 1 or 1000 users

---

## 🔄 Phase 2 Enhancements (After MVP)

Once you have users and feedback:
- Split into specialized images (optimize size)
- Add Golang supervisor (advanced monitoring)
- Add Azure Key Vault integration
- Add health check API
- Add process auto-restart
- Add more AI CLIs
- Add collaborative features

---

## 📚 Next Steps

1. **Review this plan** ✅
2. **Create Docker files** (Day 1)
3. **Update Go agent** (Day 2)
4. **Build frontend** (Day 3)
5. **Test & deploy** (Day 4)
6. **Ship MVP!** 🚀

---

## 📞 Support

- **Full implementation details**: See `/tmp/REAL_MVP_PLAN.md`
- **Dockerfile**: Complete, ready to use
- **Entrypoint script**: Complete, ready to use
- **Go agent code snippets**: Ready to integrate

**This plan is production-ready. Let's ship it!** 🎉

---

**Created by:** Dev8.dev Team  
**Status:** Ready for implementation  
**Timeline:** 1 week  
**Effort:** ~20 hours total
