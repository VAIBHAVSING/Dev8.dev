# Workspace Creation Fix - 400 Error Resolution

## Problem Analysis

### Error Observed
```
POST /api/workspaces/estimate 200 in 1461ms  ✅ Working
POST /api/workspaces 400 in 2395ms          ❌ Bad Request
```

### Root Cause: Data Format Mismatch

**Frontend was sending (INCORRECT):**
```javascript
{
  action: "create",
  name: "my-workspace",
  provider: "aws",
  image: "ubuntu-22",
  size: "small",      // ❌ Wrong - not a resource specification
  region: "us-east"   // ❌ Wrong field name
}
```

**Backend was expecting (CORRECT):**
```javascript
{
  name: string,
  cloudRegion: string,    // ✅ Not "region"
  cpuCores: number,       // ✅ Not "size"
  memoryGB: number,       // ✅ Not "size"
  storageGB: number,      // ✅ Required
  baseImage: string       // ✅ Not "image"
}
```

### Validation Schema (lib/validations.ts)

The backend validation requires:
```typescript
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  cloudRegion: z.string().min(1),           // Required
  cpuCores: z.number().min(1).max(4),       // Required
  memoryGB: z.number().min(2).max(16),      // Required
  storageGB: z.number().min(10).max(100),   // Required
  baseImage: z.string().default('node'),    // Required
  // ... optional fields
});
```

## Solution Implemented

### File Modified: `app/workspaces/new/page.tsx`

**Before:**
```javascript
async function onSubmit() {
  setSubmitting(true);
  try {
    await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "create",  // ❌ Unknown field
        name, 
        provider,          // ❌ Not used
        image,             // ❌ Should be baseImage
        size,              // ❌ Should be cpuCores + memoryGB
        region             // ❌ Should be cloudRegion
      }),
    });
    router.push("/dashboard");
  } catch (e) {
    console.error(e);
  } finally {
    setSubmitting(false);
  }
}
```

**After:**
```javascript
async function onSubmit() {
  setSubmitting(true);
  try {
    // Map size to actual resource values
    const sizeConfig = options?.sizes.find(s => s.id === size) || { cpu: 2, ramGb: 4 };
    
    // Build proper payload matching backend validation schema
    const payload = {
      name,
      cloudRegion: region,           // ✅ Correct field name
      cpuCores: sizeConfig.cpu,      // ✅ Extract CPU from size config
      memoryGB: sizeConfig.ramGb,    // ✅ Extract RAM from size config
      storageGB: 20,                 // ✅ Default storage
      baseImage: image,              // ✅ Correct field name
    };

    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // ✅ Better error handling
    if (!response.ok) {
      const error = await response.json();
      console.error("Workspace creation failed:", error);
      alert(`Failed to create workspace: ${error.message || 'Unknown error'}`);
      return;
    }

    router.push("/dashboard");
  } catch (e) {
    console.error(e);
    alert("Failed to create workspace. Please try again.");
  } finally {
    setSubmitting(false);
  }
}
```

## Key Changes

1. **Field Name Mapping:**
   - `region` → `cloudRegion`
   - `image` → `baseImage`

2. **Size Conversion:**
   - Frontend: User selects `"small"` / `"medium"` / `"large"`
   - Backend: Needs actual numbers (`cpuCores`, `memoryGB`)
   - Solution: Look up size config and extract `cpu` and `ramGb` values

3. **Added Missing Fields:**
   - `storageGB: 20` (default value)

4. **Removed Invalid Fields:**
   - `action: "create"` (not in schema)
   - `provider` (not in schema)

5. **Better Error Handling:**
   - Check response status
   - Parse and display error messages
   - User-friendly alerts

## Size Configuration Reference

The frontend defines sizes with actual resource specifications:

```typescript
sizes: [
  { id: "small", cpu: 2, ramGb: 4 },
  { id: "medium", cpu: 4, ramGb: 8 },
  { id: "large", cpu: 8, ramGb: 16 }
]
```

When user selects "small", we now extract `cpu: 2` and `ramGb: 4` to send to the backend.

## Testing

### Expected Flow Now:

1. User fills form:
   - Name: "my-workspace"
   - Provider: AWS (visual only, not sent)
   - Image: ubuntu-22
   - Size: Small (2 CPU / 4 GB)
   - Region: us-east

2. Frontend sends:
   ```json
   {
     "name": "my-workspace",
     "cloudRegion": "us-east",
     "cpuCores": 2,
     "memoryGB": 4,
     "storageGB": 20,
     "baseImage": "ubuntu-22"
   }
   ```

3. Backend validates: ✅ Pass
4. Backend creates environment record
5. Backend calls Agent API
6. Response: `201 Created` with workspace data

### Expected Log:
```
POST /api/workspaces 201 in ~2000ms  ✅
```

## Verification Steps

1. Refresh the page: http://localhost:3000/workspaces/new
2. Fill in the form:
   - Workspace Name: "test-workspace"
   - Select any Size (Small/Medium/Large)
   - Select Region
3. Click "Create Workspace"
4. Expected: Redirect to dashboard with new workspace visible
5. Check terminal: Should see `POST /api/workspaces 201` (not 400)

## Related Files

- ✅ `app/workspaces/new/page.tsx` - Fixed form submission
- ✅ `app/api/workspaces/route.ts` - Backend validation (no changes)
- ✅ `lib/validations.ts` - Schema definition (no changes)

## Status: ✅ FIXED

The workspace creation now sends correctly formatted data that matches the backend validation schema. The 400 error should be resolved.

---

**Date Fixed**: October 31, 2025
**Issue**: 400 Bad Request on workspace creation
**Cause**: Frontend sending wrong data format
**Solution**: Map frontend fields to backend schema requirements
