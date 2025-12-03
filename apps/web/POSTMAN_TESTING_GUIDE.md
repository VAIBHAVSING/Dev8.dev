# 🚀 Complete Postman Testing Guide for Dev8 Backend APIs

**Date:** October 28, 2025  
**Total APIs:** 40 Endpoints  
**Base URL:** http://localhost:3000

---

## 📋 Table of Contents

1. [Start Backend Server](#start-backend-server)
2. [Postman Setup](#postman-setup)
3. [Authentication APIs (9)](#authentication-apis)
4. [User Management APIs (5)](#user-management-apis)
5. [Workspace APIs (11)](#workspace-apis)
6. [Team APIs (15)](#team-apis)
7. [Expected Responses](#expected-responses)

---

## 🚀 Step 1: Start Backend Server

### Open Terminal and Run:

```bash
cd "c:/Users/RITESH PRADHAN/OneDrive/Desktop/FINAL_YEAR_PROJECT/Dev8.dev/apps/web"
pnpm dev
```

### Wait for:
```
✓ Ready in XXs
- Local: http://localhost:3000
```

**✅ Server is now running!**

---

## 🔧 Step 2: Postman Setup

### A. Create New Collection

1. Open Postman
2. Click "New" → "Collection"
3. Name it: **"Dev8 Backend APIs"**
4. Save

### B. Set Collection Variables

1. Click on your collection → "Variables" tab
2. Add these variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `accessToken` | (empty) | (will be filled after login) |
| `refreshToken` | (empty) | (will be filled after login) |
| `userId` | (empty) | (will be filled after registration) |
| `workspaceId` | (empty) | (will be filled after creating workspace) |
| `teamId` | (empty) | (will be filled after creating team) |

3. Click "Save"

---

## 🔐 Section 1: Authentication APIs (9 Endpoints)

### **Test 1.1: Register New User** ⭐ (DO THIS FIRST)

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "testuser@dev8.com",
  "password": "SecurePass@123",
  "name": "Test User",
  "username": "testuser"
}
```

**Expected Response (201 Created):**
```json
{
  "user": {
    "id": "cm1234567890abcdefghij",
    "email": "testuser@dev8.com",
    "name": "Test User",
    "username": "testuser",
    "role": "USER",
    "emailVerified": false,
    "createdAt": "2025-10-28T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**✅ Action After Success:**
1. Copy the `accessToken` from response
2. Go to Collection Variables
3. Paste into `accessToken` variable
4. Copy `refreshToken` and paste into `refreshToken` variable
5. Copy `user.id` and paste into `userId` variable
6. Save!

---

### **Test 1.2: Login User**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "testuser@dev8.com",
  "password": "SecurePass@123"
}
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "cm1234567890abcdefghij",
    "email": "testuser@dev8.com",
    "name": "Test User",
    "username": "testuser",
    "role": "USER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **Test 1.3: Get Current User** ⭐ (Test Authentication)

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/auth/me`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "cm1234567890abcdefghij",
    "email": "testuser@dev8.com",
    "name": "Test User",
    "username": "testuser",
    "role": "USER",
    "emailVerified": false,
    "bio": null,
    "avatar": null,
    "createdAt": "2025-10-28T10:30:00.000Z",
    "updatedAt": "2025-10-28T10:30:00.000Z"
  }
}
```

---

### **Test 1.4: Logout**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/logout`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### **Test 1.5: Refresh Token**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### **Test 1.6: Change Password**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/change-password`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "currentPassword": "SecurePass@123",
  "newPassword": "NewSecurePass@456"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**⚠️ Note:** If you change the password, update it in future login requests!

---

### **Test 1.7: Forgot Password**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/forgot-password`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "testuser@dev8.com"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

**📧 Note:** Email won't actually be sent (SMTP not configured), but check server console for reset token.

---

### **Test 1.8: Reset Password**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/reset-password`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "YOUR_RESET_TOKEN_FROM_CONSOLE",
  "newPassword": "ResetPass@789"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Password reset successful"
}
```

---

### **Test 1.9: Verify Email**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/verify-email`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "VERIFICATION_TOKEN_FROM_EMAIL"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

---

## 👤 Section 2: User Management APIs (5 Endpoints)

### **Test 2.1: Get User Profile**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/users/me`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "cm1234567890abcdefghij",
    "email": "testuser@dev8.com",
    "name": "Test User",
    "username": "testuser",
    "bio": null,
    "avatar": null,
    "role": "USER",
    "emailVerified": false,
    "createdAt": "2025-10-28T10:30:00.000Z",
    "updatedAt": "2025-10-28T10:30:00.000Z"
  }
}
```

---

### **Test 2.2: Update User Profile**

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/users/me`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Updated Test User",
  "bio": "Full-stack developer passionate about cloud computing",
  "username": "testuser_updated"
}
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "cm1234567890abcdefghij",
    "email": "testuser@dev8.com",
    "name": "Updated Test User",
    "username": "testuser_updated",
    "bio": "Full-stack developer passionate about cloud computing",
    "avatar": null,
    "updatedAt": "2025-10-28T10:35:00.000Z"
  }
}
```

---

### **Test 2.3: Get User Usage Statistics**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/users/me/usage`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "usage": {
    "workspaces": {
      "total": 0,
      "running": 0,
      "stopped": 0
    },
    "resources": {
      "computeHours": 0,
      "storageGB": 0,
      "networkGB": 0
    },
    "costs": {
      "thisMonth": 0,
      "lastMonth": 0
    }
  }
}
```

---

### **Test 2.4: Search Users**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/users/search?q=test`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params:**
- `q` = `test` (search term)
- `limit` = `10` (optional)

**Body:** None

**Expected Response (200 OK):**
```json
{
  "users": [
    {
      "id": "cm1234567890abcdefghij",
      "email": "testuser@dev8.com",
      "name": "Updated Test User",
      "username": "testuser_updated",
      "avatar": null
    }
  ],
  "total": 1
}
```

---

### **Test 2.5: Delete User Account**

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/users/me`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "password": "NewSecurePass@456"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Account deleted successfully"
}
```

**⚠️ Note:** This is a soft delete. Account is marked deleted but data is retained for 30 days.

---

## 💻 Section 3: Workspace Management APIs (11 Endpoints)

### **Test 3.1: Create Workspace** ⭐

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "My Dev Environment",
  "template": "node-typescript",
  "instanceType": "small",
  "region": "eastus"
}
```

**Template Options:**
- `node-typescript`
- `python`
- `react`
- `nextjs`
- `go`
- `rust`

**Instance Types:**
- `small` (2 vCPU, 4GB RAM)
- `medium` (4 vCPU, 8GB RAM)
- `large` (8 vCPU, 16GB RAM)

**Regions:**
- `eastus`
- `westus`
- `westeurope`

**Expected Response (201 Created):**
```json
{
  "workspace": {
    "id": "cm9876543210zyxwvutsrq",
    "name": "My Dev Environment",
    "template": "node-typescript",
    "instanceType": "small",
    "region": "eastus",
    "status": "creating",
    "environmentId": "env-abc123",
    "userId": "cm1234567890abcdefghij",
    "teamId": null,
    "createdAt": "2025-10-28T10:40:00.000Z",
    "updatedAt": "2025-10-28T10:40:00.000Z"
  }
}
```

**✅ Action:** Copy `workspace.id` to `workspaceId` variable!

---

### **Test 3.2: List Workspaces**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params (optional):**
- `page` = `1`
- `limit` = `10`
- `status` = `running` or `stopped` or `creating`

**Body:** None

**Expected Response (200 OK):**
```json
{
  "workspaces": [
    {
      "id": "cm9876543210zyxwvutsrq",
      "name": "My Dev Environment",
      "template": "node-typescript",
      "instanceType": "small",
      "status": "creating",
      "region": "eastus",
      "createdAt": "2025-10-28T10:40:00.000Z",
      "updatedAt": "2025-10-28T10:40:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### **Test 3.3: Get Workspace Details**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "workspace": {
    "id": "cm9876543210zyxwvutsrq",
    "name": "My Dev Environment",
    "template": "node-typescript",
    "instanceType": "small",
    "region": "eastus",
    "status": "creating",
    "environmentId": "env-abc123",
    "containerUrl": null,
    "sshUrl": null,
    "userId": "cm1234567890abcdefghij",
    "teamId": null,
    "createdAt": "2025-10-28T10:40:00.000Z",
    "updatedAt": "2025-10-28T10:40:00.000Z",
    "owner": {
      "id": "cm1234567890abcdefghij",
      "name": "Updated Test User",
      "email": "testuser@dev8.com"
    }
  }
}
```

---

### **Test 3.4: Update Workspace**

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Updated Dev Environment",
  "instanceType": "medium"
}
```

**Expected Response (200 OK):**
```json
{
  "workspace": {
    "id": "cm9876543210zyxwvutsrq",
    "name": "Updated Dev Environment",
    "instanceType": "medium",
    "status": "stopped",
    "updatedAt": "2025-10-28T10:45:00.000Z"
  }
}
```

---

### **Test 3.5: Start Workspace**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/start`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "workspace": {
    "id": "cm9876543210zyxwvutsrq",
    "name": "Updated Dev Environment",
    "status": "starting"
  },
  "message": "Workspace is starting"
}
```

**⚠️ Note:** May return error if Agent service is not running. This is expected during testing.

**Error Response (500):**
```json
{
  "error": "Failed to start workspace",
  "code": "INTERNAL_ERROR",
  "details": "Agent service unavailable"
}
```

---

### **Test 3.6: Stop Workspace**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/stop`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "workspace": {
    "id": "cm9876543210zyxwvutsrq",
    "status": "stopped"
  },
  "message": "Workspace stopped successfully"
}
```

---

### **Test 3.7: Get Workspace Activity**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/activity`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params (optional):**
- `limit` = `50`
- `startDate` = `2025-10-01`
- `endDate` = `2025-10-31`

**Body:** None

**Expected Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "act123",
      "environmentId": "env-abc123",
      "cpuUsagePercent": 0,
      "memoryUsageMB": 0,
      "diskUsageMB": 0,
      "networkInMB": 0,
      "networkOutMB": 0,
      "timestamp": "2025-10-28T10:40:00.000Z"
    }
  ],
  "total": 1
}
```

---

### **Test 3.8: Record Workspace Activity** ⭐

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/activity`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "cpuUsagePercent": 45.5,
  "memoryUsageMB": 512,
  "diskUsageMB": 2048,
  "networkInMB": 100,
  "networkOutMB": 50
}
```

**Expected Response (201 Created):**
```json
{
  "activity": {
    "id": "act124",
    "environmentId": "env-abc123",
    "cpuUsagePercent": 45.5,
    "memoryUsageMB": 512,
    "diskUsageMB": 2048,
    "networkInMB": 100,
    "networkOutMB": 50,
    "timestamp": "2025-10-28T10:50:00.000Z",
    "costAmount": 0.15
  }
}
```

---

### **Test 3.9: List SSH Keys**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/ssh-keys`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "sshKeys": [],
  "total": 0
}
```

---

### **Test 3.10: Add SSH Key**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/ssh-keys`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "My Laptop SSH Key",
  "publicKey": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCtest1234567890 user@laptop"
}
```

**Expected Response (201 Created):**
```json
{
  "sshKey": {
    "id": "ssh123",
    "name": "My Laptop SSH Key",
    "fingerprint": "SHA256:abc123def456...",
    "environmentId": "env-abc123",
    "createdAt": "2025-10-28T10:55:00.000Z"
  }
}
```

---

### **Test 3.11: Delete Workspace**

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "message": "Workspace deleted successfully"
}
```

---

## 👥 Section 4: Team Management APIs (15 Endpoints)

### **Test 4.1: Create Team** ⭐

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/teams`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Dev8 Team",
  "slug": "dev8-team",
  "description": "Our awesome development team"
}
```

**Expected Response (201 Created):**
```json
{
  "team": {
    "id": "team123",
    "name": "Dev8 Team",
    "slug": "dev8-team",
    "description": "Our awesome development team",
    "plan": "FREE",
    "logo": null,
    "createdAt": "2025-10-28T11:00:00.000Z",
    "members": [
      {
        "id": "member123",
        "role": "OWNER",
        "user": {
          "id": "cm1234567890abcdefghij",
          "name": "Updated Test User",
          "email": "testuser@dev8.com"
        }
      }
    ]
  }
}
```

**✅ Action:** Copy `team.id` to `teamId` variable!

---

### **Test 4.2: List User Teams**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/teams`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params (optional):**
- `page` = `1`
- `limit` = `10`

**Body:** None

**Expected Response (200 OK):**
```json
{
  "teams": [
    {
      "id": "team123",
      "name": "Dev8 Team",
      "slug": "dev8-team",
      "role": "OWNER",
      "memberCount": 1,
      "plan": "FREE"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### **Test 4.3: Get Team Details**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "team": {
    "id": "team123",
    "name": "Dev8 Team",
    "slug": "dev8-team",
    "description": "Our awesome development team",
    "plan": "FREE",
    "logo": null,
    "createdAt": "2025-10-28T11:00:00.000Z",
    "members": [
      {
        "id": "member123",
        "role": "OWNER",
        "joinedAt": "2025-10-28T11:00:00.000Z",
        "user": {
          "id": "cm1234567890abcdefghij",
          "name": "Updated Test User",
          "email": "testuser@dev8.com",
          "avatar": null
        }
      }
    ]
  }
}
```

---

### **Test 4.4: Update Team**

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Updated Dev8 Team",
  "description": "Best development team ever!",
  "plan": "TEAM"
}
```

**Plan Options:** `FREE`, `TEAM`, `ENTERPRISE`

**Expected Response (200 OK):**
```json
{
  "team": {
    "id": "team123",
    "name": "Updated Dev8 Team",
    "description": "Best development team ever!",
    "plan": "TEAM",
    "updatedAt": "2025-10-28T11:05:00.000Z"
  }
}
```

---

### **Test 4.5: List Team Members**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/members`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params (optional):**
- `page` = `1`
- `limit` = `20`

**Body:** None

**Expected Response (200 OK):**
```json
{
  "members": [
    {
      "id": "member123",
      "role": "OWNER",
      "joinedAt": "2025-10-28T11:00:00.000Z",
      "user": {
        "id": "cm1234567890abcdefghij",
        "name": "Updated Test User",
        "email": "testuser@dev8.com",
        "avatar": null
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### **Test 4.6: Invite Team Member**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/members`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "newmember@dev8.com",
  "role": "MEMBER"
}
```

**Role Options:** `MEMBER`, `ADMIN`, `OWNER`

**Expected Response - User Exists (201 Created):**
```json
{
  "member": {
    "id": "member124",
    "role": "MEMBER",
    "user": {
      "id": "user456",
      "email": "newmember@dev8.com",
      "name": "New Member"
    }
  }
}
```

**Expected Response - User Doesn't Exist (201 Created):**
```json
{
  "invitation": {
    "id": "inv123",
    "email": "newmember@dev8.com",
    "role": "MEMBER",
    "token": "invite-token-abc123",
    "expiresAt": "2025-11-04T11:10:00.000Z"
  },
  "message": "Invitation sent"
}
```

---

### **Test 4.7: Update Member Role**

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/members/{{memberId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "role": "ADMIN"
}
```

**Expected Response (200 OK):**
```json
{
  "member": {
    "id": "member124",
    "role": "ADMIN",
    "user": {
      "email": "newmember@dev8.com"
    }
  }
}
```

---

### **Test 4.8: Remove Team Member**

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/members/{{memberId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "message": "Member removed successfully"
}
```

---

### **Test 4.9: Transfer Team Ownership**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/transfer-ownership`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "newOwnerId": "user456"
}
```

**Expected Response (200 OK):**
```json
{
  "team": {
    "id": "team123",
    "name": "Updated Dev8 Team"
  },
  "message": "Ownership transferred successfully"
}
```

---

### **Test 4.10: Get Team Workspaces**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/workspaces`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params (optional):**
- `page` = `1`
- `limit` = `10`

**Body:** None

**Expected Response (200 OK):**
```json
{
  "workspaces": [],
  "total": 0,
  "page": 1,
  "limit": 10
}
```

---

### **Test 4.11: Get Team Usage**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/usage`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "usage": {
    "team": {
      "workspaces": 0,
      "members": 1,
      "computeCost": 0,
      "storageGB": 0
    },
    "members": [
      {
        "userId": "cm1234567890abcdefghij",
        "name": "Updated Test User",
        "email": "testuser@dev8.com",
        "workspaces": 1,
        "compute": {
          "hours": 0,
          "costThisMonth": 0
        },
        "storage": {
          "usedGB": 2,
          "costThisMonth": 0.2
        }
      }
    ]
  }
}
```

---

### **Test 4.12: Get Team Activity**

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}/activity`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Params (optional):**
- `limit` = `50`

**Body:** None

**Expected Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "activity123",
      "action": "team_created",
      "userId": "cm1234567890abcdefghij",
      "userName": "Updated Test User",
      "timestamp": "2025-10-28T11:00:00.000Z",
      "metadata": {}
    }
  ],
  "total": 1
}
```

---

### **Test 4.13: Accept Team Invitation**

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/teams/invitations/accept`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "invite-token-abc123"
}
```

**Expected Response (200 OK):**
```json
{
  "member": {
    "id": "member125",
    "role": "MEMBER",
    "teamId": "team123"
  },
  "team": {
    "id": "team123",
    "name": "Updated Dev8 Team"
  }
}
```

---

### **Test 4.14: Cancel Invitation**

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/teams/invitations/{{invitationId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** None

**Expected Response (200 OK):**
```json
{
  "message": "Invitation cancelled successfully"
}
```

---

### **Test 4.15: Delete Team**

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/teams/{{teamId}}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "confirmSlug": "dev8-team"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "Team scheduled for deletion. It will be permanently deleted in 7 days."
}
```

**⚠️ Note:** This is a soft delete with 7-day grace period.

---

## 📊 Testing Checklist

Use this to track your testing progress:

### Authentication APIs (9)
- [ ] 1.1 Register New User
- [ ] 1.2 Login User
- [ ] 1.3 Get Current User
- [ ] 1.4 Logout
- [ ] 1.5 Refresh Token
- [ ] 1.6 Change Password
- [ ] 1.7 Forgot Password
- [ ] 1.8 Reset Password
- [ ] 1.9 Verify Email

### User Management APIs (5)
- [ ] 2.1 Get User Profile
- [ ] 2.2 Update User Profile
- [ ] 2.3 Get User Usage
- [ ] 2.4 Search Users
- [ ] 2.5 Delete User Account

### Workspace APIs (11)
- [ ] 3.1 Create Workspace
- [ ] 3.2 List Workspaces
- [ ] 3.3 Get Workspace Details
- [ ] 3.4 Update Workspace
- [ ] 3.5 Start Workspace
- [ ] 3.6 Stop Workspace
- [ ] 3.7 Get Workspace Activity
- [ ] 3.8 Record Workspace Activity
- [ ] 3.9 List SSH Keys
- [ ] 3.10 Add SSH Key
- [ ] 3.11 Delete Workspace

### Team APIs (15)
- [ ] 4.1 Create Team
- [ ] 4.2 List User Teams
- [ ] 4.3 Get Team Details
- [ ] 4.4 Update Team
- [ ] 4.5 List Team Members
- [ ] 4.6 Invite Team Member
- [ ] 4.7 Update Member Role
- [ ] 4.8 Remove Team Member
- [ ] 4.9 Transfer Ownership
- [ ] 4.10 Get Team Workspaces
- [ ] 4.11 Get Team Usage
- [ ] 4.12 Get Team Activity
- [ ] 4.13 Accept Invitation
- [ ] 4.14 Cancel Invitation
- [ ] 4.15 Delete Team

**Total: 40 APIs**

---

## 🎯 Expected HTTP Status Codes

| Status Code | Meaning | When You'll See It |
|-------------|---------|-------------------|
| 200 OK | Success | GET, PATCH, DELETE operations |
| 201 Created | Resource created | POST operations (register, create) |
| 400 Bad Request | Invalid input | Validation errors, missing fields |
| 401 Unauthorized | Not authenticated | Missing/invalid token |
| 403 Forbidden | No permission | Trying to access others' resources |
| 404 Not Found | Resource doesn't exist | Invalid IDs |
| 409 Conflict | Duplicate resource | Email/username already exists |
| 500 Internal Server Error | Server error | Database errors, Agent unavailable |

---

## 🐛 Common Errors & Solutions

### Error: "No token provided"
**Problem:** Missing Authorization header  
**Solution:** Add header: `Authorization: Bearer {{accessToken}}`

### Error: "Invalid token"
**Problem:** Token expired or malformed  
**Solution:** Login again to get new token

### Error: "Validation error"
**Problem:** Invalid input data  
**Solution:** Check required fields and format (email, password strength, etc.)

### Error: "Resource not found"
**Problem:** Invalid ID or deleted resource  
**Solution:** Verify IDs are correct, resource hasn't been deleted

### Error: "Agent service unavailable"
**Problem:** Workspace Agent not running  
**Solution:** This is expected during testing. Workspace start/stop will fail gracefully.

### Error: "Database connection failed"
**Problem:** PostgreSQL not running  
**Solution:** Start PostgreSQL service

---

## ✅ Success Criteria

After testing all APIs, you should have:

✅ **Authentication:** Can register, login, get user info  
✅ **User Management:** Can update profile, view usage  
✅ **Workspaces:** Can create, list, update, record activity  
✅ **Teams:** Can create, add members, view usage  
✅ **No Critical Errors:** All endpoints return expected status codes  
✅ **Data Persistence:** Data saved and retrieved correctly  

---

## 🚀 Quick Test Flow (15 minutes)

Follow this order for fastest testing:

1. **Register** (Test 1.1) → Save `accessToken`
2. **Login** (Test 1.2) → Verify token works
3. **Get Current User** (Test 1.3) → Test authentication
4. **Update Profile** (Test 2.2) → Test user updates
5. **Create Workspace** (Test 3.1) → Save `workspaceId`
6. **List Workspaces** (Test 3.2) → Verify workspace exists
7. **Record Activity** (Test 3.8) → Test workspace tracking
8. **Create Team** (Test 4.1) → Save `teamId`
9. **List Teams** (Test 4.2) → Verify team exists
10. **Get Team Usage** (Test 4.11) → Test team statistics

**Result:** All core functionality tested! 🎉

---

## 📝 Notes

- **Agent Service:** Workspace start/stop operations require the Go Agent service running. If it's not running, these will return 500 errors, which is expected.
  
- **Email Service:** Password reset and email verification won't send actual emails unless SMTP is configured. Tokens will appear in server console logs.

- **Soft Deletes:** User and team deletions are soft deletes (data retained for recovery period).

- **Rate Limiting:** Currently not implemented. You can make unlimited requests.

- **Token Expiry:** Access tokens expire after 7 days, refresh tokens after 30 days.

---

## 🎉 You're All Set!

Now you can:
1. Start your backend server
2. Import requests into Postman
3. Test all 40 APIs systematically
4. Verify expected responses
5. Build confidence in your backend!

**Happy Testing! 🚀**
