# 🚀 Quick Start Testing Guide

**Complete Step-by-Step Instructions**

---

## ⚡ Quick Test (5 minutes)

### Step 1: Start the Server

```bash
cd "c:/Users/RITESH PRADHAN/OneDrive/Desktop/FINAL_YEAR_PROJECT/Dev8.dev/apps/web"
pnpm dev
```

**Expected Output:**
```
▲ Next.js 15.5.0
- Local:        http://localhost:3000
✓ Ready in 2s
```

**✅ Checkpoint:** Server should be running without errors

---

### Step 2: Test Backend APIs (Automated)

```bash
# Make the script executable
chmod +x test-all-apis.sh

# Run all API tests
./test-all-apis.sh
```

**Expected Output:**
```
============================================
🧪 Dev8 Backend API Testing Suite
============================================

✅ PASS: User registration successful
✅ PASS: User login successful
✅ PASS: Get current user successful
...
============================================
📊 Test Results Summary
============================================
Total Tests: 40
Passed: 35
Failed: 0
Skipped: 5
🎉 All tests passed!
```

**✅ Checkpoint:** 35+ tests passed, 0 failures

---

### Step 3: Test Frontend Pages (Manual - 5 minutes)

Open your browser and visit these pages:

#### ✅ Public Pages (No Login Required)

1. **Landing Page**: http://localhost:3000
   - Check: Hero section, features, navigation
   
2. **Features Page**: http://localhost:3000/features
   - Check: Feature cards display correctly
   
3. **Sign Up Page**: http://localhost:3000/signup
   - Check: Form fields, validation

#### ✅ Protected Pages (Login Required)

4. **Sign In First**: http://localhost:3000/signin
   - Use credentials from automated test (check console output)
   - Or create new account

5. **Dashboard**: http://localhost:3000/dashboard
   - Check: Workspace stats, recent activity
   
6. **Workspaces**: http://localhost:3000/workspaces
   - Check: List of workspaces, create button
   
7. **Profile**: http://localhost:3000/profile
   - Check: User info displays, edit works

**✅ Checkpoint:** All pages load without errors

---

## 📋 Detailed Testing (30 minutes)

### Part 1: Backend Testing

#### Option A: Automated Test Script ⚡ (Recommended)

```bash
cd "c:/Users/RITESH PRADHAN/OneDrive/Desktop/FINAL_YEAR_PROJECT/Dev8.dev/apps/web"
./test-all-apis.sh
```

This tests all 40 endpoints automatically!

#### Option B: Manual API Testing 🔧

**Test Authentication:**
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dev8.com",
    "password": "Test@123456",
    "name": "Test User",
    "username": "testuser"
  }'

# Expected: 201 Created with tokens
# Save the accessToken!

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dev8.com",
    "password": "Test@123456"
  }'

# Expected: 200 OK with user and tokens
```

**Test Workspaces:**
```bash
# Replace YOUR_TOKEN with token from login
TOKEN="YOUR_ACCESS_TOKEN_HERE"

# 1. Create Workspace
curl -X POST http://localhost:3000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Dev Workspace",
    "template": "node-typescript",
    "instanceType": "small",
    "region": "eastus"
  }'

# Expected: 201 Created with workspace ID

# 2. List Workspaces
curl -X GET http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with array of workspaces
```

**Test Teams:**
```bash
# 1. Create Team
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Team",
    "slug": "my-team",
    "description": "Our awesome team"
  }'

# Expected: 201 Created with team ID

# 2. List Teams
curl -X GET http://localhost:3000/api/teams \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with array of teams
```

**✅ Checkpoint:** All curl commands return expected status codes

---

### Part 2: Frontend Testing

#### Page-by-Page Checklist

**Landing Page** (http://localhost:3000)
- [ ] Hero section visible
- [ ] "Get Started" button works
- [ ] Navigation menu functional
- [ ] Features section displays
- [ ] Footer present
- [ ] No console errors

**Sign Up** (http://localhost:3000/signup)
- [ ] All input fields work
- [ ] Password strength indicator
- [ ] Form validation shows errors
- [ ] Can submit form
- [ ] Redirects after signup

**Sign In** (http://localhost:3000/signin)
- [ ] Email and password fields
- [ ] "Show password" toggle
- [ ] "Forgot password" link
- [ ] Can login successfully
- [ ] Redirects to dashboard

**Dashboard** (http://localhost:3000/dashboard)
- [ ] Requires login (redirects if not)
- [ ] Shows workspace count
- [ ] Displays user name
- [ ] Recent activity visible
- [ ] Quick actions available
- [ ] Sidebar navigation works

**Workspaces** (http://localhost:3000/workspaces)
- [ ] Lists all workspaces
- [ ] "Create New" button visible
- [ ] Each workspace shows status
- [ ] Can click to view details
- [ ] Start/Stop buttons work (if Agent running)
- [ ] Search/filter works

**Profile** (http://localhost:3000/profile)
- [ ] Shows user information
- [ ] Avatar/photo displays
- [ ] Can edit profile
- [ ] Save button works
- [ ] Changes persist after refresh

**✅ Checkpoint:** All pages load and basic functionality works

---

## 🧪 Integration Testing (15 minutes)

### Scenario 1: New User Journey

**Steps:**
1. Visit http://localhost:3000
2. Click "Get Started"
3. Fill signup form
4. Submit and login
5. View dashboard
6. Create first workspace
7. Check workspace appears in list

**Expected:** Smooth flow, no errors, workspace created

---

### Scenario 2: Team Collaboration

**Steps:**
1. Login as User A
2. Create team from dashboard
3. Invite User B (via email)
4. Login as User B (different browser/incognito)
5. Accept invitation
6. Both users see team

**Expected:** Invitation system works, permissions correct

---

### Scenario 3: Workspace Management

**Steps:**
1. Create workspace
2. Start workspace
3. View workspace details
4. Record activity
5. Check usage statistics
6. Stop workspace
7. Delete workspace

**Expected:** All lifecycle operations work correctly

---

## ✅ Success Criteria

### Backend APIs: 40 Endpoints

- ✅ **Authentication (9):** Registration, login, password management
- ✅ **Users (5):** Profile, usage, search
- ✅ **Workspaces (11):** CRUD, start/stop, activity, SSH keys
- ✅ **Teams (15):** CRUD, members, invitations, usage

**Minimum:** 35/40 tests pass (5 may be skipped due to Agent/email)

### Frontend Pages: 14 Pages

- ✅ **Public (3):** Landing, Features, Sign In
- ✅ **Auth (1):** Sign Up
- ✅ **Protected (10):** Dashboard, Workspaces, Teams, Profile, Settings, etc.

**Minimum:** All pages load without 404/500 errors

### Database

- ✅ PostgreSQL connected
- ✅ All tables created
- ✅ Migrations applied
- ✅ Data persists correctly

### Security

- ✅ JWT authentication works
- ✅ Protected routes require login
- ✅ Passwords hashed (bcrypt)
- ✅ RBAC permissions enforced

---

## 🐛 Troubleshooting

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find process
netstat -ano | findstr :3000

# Kill it
taskkill /PID <PID_NUMBER> /F

# Or use different port
pnpm dev -- -p 3001
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check PostgreSQL running
psql -U postgres -c "SELECT version();"

# Check .env file
cat .env | grep DATABASE_URL
```

### Issue: "Prisma Client not found"

**Solution:**
```bash
pnpm db:generate
```

### Issue: "Agent service not available"

**Expected:** This is normal. Workspace start/stop will fail gracefully.
**Solution:** Continue testing other endpoints. Agent is optional for most features.

### Issue: VS Code shows TypeScript errors

**Solution:**
```
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 📊 Expected Test Results

### ✅ Passing Tests

```
Authentication APIs:      9/9  ✅
User Management APIs:     5/5  ✅
Workspace Management:    11/11 ✅ (10/11 if Agent down)
Team Management APIs:    15/15 ✅

Total Backend:           40/40 ✅ (or 39/40)
```

### ✅ Frontend Pages

```
Public Pages:      3/3  ✅
Auth Pages:        1/1  ✅
Protected Pages:  10/10 ✅

Total Frontend:   14/14 ✅
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅

1. **Commit your work:**
   ```bash
   git add .
   git commit -m "Complete backend + frontend integration tested"
   git push origin backend-code
   ```

2. **Create Pull Request:**
   - Merge `backend-code` → `main`
   - Review changes
   - Deploy to staging

3. **Deploy:**
   - Set up production database
   - Configure environment variables
   - Deploy to Vercel/Azure
   - Set up Agent service

### If Tests Fail ❌

1. **Review error messages**
2. **Check TESTING_GUIDE.md** for detailed instructions
3. **Verify database connection**
4. **Check console logs**
5. **Ask for help with specific error**

---

## 📞 Getting Help

### Check These First:

1. **TESTING_GUIDE.md** - Detailed testing instructions
2. **BACKEND_API_COMPLETE_SUMMARY.md** - API documentation
3. **README.md** - Project setup
4. **Console output** - Error messages

### Common Questions:

**Q: Some tests show "SKIP" - is that OK?**  
A: Yes! Tests are skipped when:
- Agent service not running (workspace start/stop)
- Email not configured (password reset, email verification)
- Need multiple users (team member operations)

**Q: How many tests should pass?**  
A: Minimum 35/40 backend tests, all 14 frontend pages

**Q: Agent service errors - is that a problem?**  
A: No, Agent is optional for testing. Workspace start/stop will fail gracefully.

**Q: VS Code shows red errors but tests pass?**  
A: TypeScript server cache issue. Restart TS Server (Ctrl+Shift+P).

---

## 🎉 Testing Complete!

**When you see:**
```
✅ PASS: 35+ tests
✅ All pages load
✅ Database connected
✅ No critical errors
```

**You're ready to deploy! 🚀**

Congratulations on building a complete full-stack application!

---

**Need more details?** Check `TESTING_GUIDE.md` for comprehensive testing instructions.
