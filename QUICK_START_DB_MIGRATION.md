# 🚀 Quick Start: Database Migration Guide

## 📋 Overview

This guide helps you quickly migrate the database with the new schema from PR #58.

**PR**: https://github.com/VAIBHAVSING/Dev8.dev/pull/58  
**Branch**: `feature/db-schema-from-scratch`

---

## ⚡ Quick Migration (5 minutes)

### Step 1: Backup Existing Database
```bash
# Create a backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Checkout Branch
```bash
git fetch origin
git checkout feature/db-schema-from-scratch
```

### Step 3: Install Dependencies
```bash
pnpm install
```

### Step 4: Run Migration
```bash
cd apps/web
pnpm prisma migrate dev --name "complete-schema-rewrite"
```

### Step 5: Generate Client
```bash
pnpm prisma generate
```

### Step 6: Test Schema (Optional)
```bash
cd ../..
node test-schema.js
```

---

## 🧪 Testing Locally

### Prerequisites
- PostgreSQL running
- DATABASE_URL set in .env

### Run Test Script
```bash
# The test script will:
# 1. Create test data
# 2. Validate all models
# 3. Test all relations
# 4. Test complex queries
# 5. Clean up

node test-schema.js
```

**Expected Output**: All tests pass with ✅ checkmarks

---

## 📊 What's New

### New Models
- **ActivityReport** - Track IDE/SSH activity
- **SSHKey** - User SSH public keys
- **Secret** - Azure Key Vault references
- **Workspace** - Storage configuration
- **Backup** - Backup history

### New Enums
- **IDEType** - VSCODE, CURSOR, JUPYTER
- **AgentType** - COPILOT, CLAUDE, GEMINI, CODEX
- **SecretType** - Various API key types
- **BackupTrigger** - MANUAL, PRE_SHUTDOWN, SCHEDULED
- **BackupStatus** - PENDING, RUNNING, COMPLETED, FAILED

### Enhanced Models
- **Environment** - Added IDE/Agent selection, auto-stop config
- **User** - Added SSH keys, secrets, workspaces relations

---

## 🔍 Verify Migration

### Check Tables Exist
```bash
cd apps/web
pnpm prisma studio
```

Look for:
- ✅ activity_reports
- ✅ ssh_keys
- ✅ environment_ssh_keys
- ✅ secrets
- ✅ environment_secrets
- ✅ workspaces
- ✅ backups

### Check Environment Model
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'environments'
ORDER BY ordinal_position;
```

Should see new columns:
- ✅ ideType
- ✅ agentType
- ✅ dockerImage
- ✅ autoStopMinutes
- ✅ autoStopEnabled

---

## 🔄 Rollback (If Needed)

### Option 1: Prisma Rollback
```bash
cd apps/web
pnpm prisma migrate resolve --rolled-back <migration-name>
```

### Option 2: Database Restore
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## 📝 Next Steps After Migration

### Backend (Go)
1. Update models in `apps/agent/internal/models/`
2. Create new API endpoints
3. Update supervisor to send activity reports

### Frontend (Next.js)
1. Update TypeScript types
2. Add IDE/Agent selection to environment wizard
3. Build SSH key management UI
4. Build secrets management UI
5. Build backup management UI

### Testing
1. Create new environments with different IDEs
2. Test SSH key injection
3. Test secret injection
4. Test activity reporting
5. Test auto-shutdown
6. Test backups

---

## 💡 Quick Tips

### View Migration SQL
```bash
cd apps/web
cat prisma/migrations/*/migration.sql
```

### Reset Database (Dev Only!)
```bash
cd apps/web
pnpm prisma migrate reset
```

### Check Migration Status
```bash
cd apps/web
pnpm prisma migrate status
```

### Generate Prisma Client Again
```bash
cd apps/web
pnpm prisma generate
```

---

## 🚨 Troubleshooting

### Migration Fails
1. Check DATABASE_URL is correct
2. Ensure database is running
3. Check for existing data conflicts
4. Review error message carefully

### Client Generation Fails
1. Run `pnpm prisma format` first
2. Check for syntax errors in schema.prisma
3. Clear node_modules and reinstall

### Test Script Fails
1. Ensure migration completed successfully
2. Check DATABASE_URL
3. Verify all tables exist
4. Check for data conflicts

---

## 📚 Documentation

### Read This First
- `PR_DESCRIPTION.md` - Complete PR description
- `IMPLEMENTATION_SUMMARY.md` - Implementation status

### Planning Documents (db-prompt/)
- `00-OVERVIEW.md` - Project context
- `01-CURRENT-STATE.md` - Existing schema
- `02-REQUIREMENTS.md` - Requirements
- `03-PHASE1-SCHEMA.md` - Schema details
- `STATUS.md` - Planning status

### Test & Validate
- `test-schema.js` - Comprehensive test script

---

## ⚡ One-Liner (Dev Environment)

```bash
cd apps/web && pnpm prisma migrate dev --name "complete-schema-rewrite" && pnpm prisma generate && cd ../.. && node test-schema.js
```

This will:
1. Run migration
2. Generate Prisma Client
3. Run all tests
4. Show validation results

---

## ✅ Success Checklist

After migration, you should have:

- [ ] Migration completed without errors
- [ ] Prisma Client generated successfully
- [ ] All new tables visible in Prisma Studio
- [ ] Test script runs successfully
- [ ] Environment model has new fields
- [ ] User model has new relations
- [ ] All enums defined
- [ ] All indexes created

---

## 🎉 You're Done!

The database is now ready for the complete Dev8.dev platform with:
- ✅ Multiple IDE support
- ✅ AI agent integration
- ✅ Auto-shutdown capability
- ✅ SSH key management
- ✅ Secrets management
- ✅ Workspace tracking
- ✅ Backup system

**Next**: Start implementing backend and frontend features!

---

**Questions?** Check PR #58 or documentation in `db-prompt/` directory.
