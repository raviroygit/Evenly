# Update Transaction Network Error - Debug Guide

**Date**: January 27, 2026
**Status**: 🔍 **DEBUGGING**

---

## Problem

Transaction updates with images are failing with Network Error, despite implementing the 120-second timeout fix.

### Error Logs

```
ERROR ❌ [makeRequest] API request failed for /khata/transactions/17aac6f4-1aa0-4eab-9f01-d85d64d5e754: [AxiosError: Network Error]
ERROR [CustomerDetailScreen] Error updating transaction: [AxiosError: Network Error]
```

### Key Observations

1. **Create transactions work** - POST `/khata/transactions` succeeds with images
2. **Update transactions fail** - PUT `/khata/transactions/:id` fails with images
3. **Error type**: Pure Network Error (no HTTP status code)
4. **Timeout**: Set to 120 seconds (should be sufficient)

---

## Enhanced Logging Implemented

### CustomerDetailScreen.tsx (lines 219-277)

Added detailed logging to track:
- When update starts
- Transaction ID
- Data type (FormData vs JSON)
- Progress callback status
- Success/failure details
- Complete error information

### EvenlyBackendService.ts (lines 943-1060)

Added comprehensive logging for:
- Request initialization
- Data type detection
- Timeout configuration
- Progress tracking
- Full URL construction
- Request config details
- Success confirmation
- Detailed error breakdown

---

## Debugging Steps

### Step 1: Check New Logs

When you try to update a transaction with an image, you should now see logs like:

**Start of Update:**
```
[CustomerDetailScreen] ========== UPDATE TRANSACTION START ==========
[CustomerDetailScreen] Transaction ID: 17aac6f4-1aa0-4eab-9f01-d85d64d5e754
[CustomerDetailScreen] Data is FormData: true
[CustomerDetailScreen] Progress callback provided: true
[CustomerDetailScreen] Calling updateKhataTransaction...
```

**Backend Service:**
```
[EvenlyBackendService] ========== UPDATE KHATA TRANSACTION ==========
[EvenlyBackendService] Transaction ID: 17aac6f4-1aa0-4eab-9f01-d85d64d5e754
[EvenlyBackendService] Data type: FormData
[EvenlyBackendService] Timeout set to: 120000ms (2 minutes)
[EvenlyBackendService] Upload progress tracking enabled
[EvenlyBackendService] Request config: { timeout: 120000, hasProgressCallback: true, ... }
[EvenlyBackendService] Endpoint: /khata/transactions/17aac6f4-1aa0-4eab-9f01-d85d64d5e754
[EvenlyBackendService] Full URL will be: http://YOUR_BACKEND_URL/api/khata/transactions/17aac6f4-1aa0-4eab-9f01-d85d64d5e754
```

**If Successful:**
```
[EvenlyBackendService] Upload progress: 25%
[EvenlyBackendService] Upload progress: 50%
[EvenlyBackendService] Upload progress: 75%
[EvenlyBackendService] Upload progress: 100%
[EvenlyBackendService] ✅ Update successful
[CustomerDetailScreen] ✅ Update successful: { id: ..., ... }
```

**If Failed:**
```
[EvenlyBackendService] ========== UPDATE FAILED ==========
[EvenlyBackendService] Error details: {
  message: "Network Error",
  code: "ECONNABORTED" or "ERR_NETWORK",
  status: undefined,
  config: { url: "...", method: "PUT", timeout: 120000 }
}
[CustomerDetailScreen] ========== UPDATE TRANSACTION FAILED ==========
[CustomerDetailScreen] Error type: AxiosError
[CustomerDetailScreen] Error code: ECONNABORTED
```

### Step 2: Analyze the Logs

**Look for these key indicators:**

1. **Full URL**: Check if the URL is correct
   - Should be: `http://YOUR_BACKEND_URL/api/khata/transactions/:id`
   - Verify backend URL matches your actual backend server

2. **Timeout**: Confirm it's set to 120000ms
   - If you see a different timeout, the config isn't being applied

3. **Progress**: Check if any progress is logged
   - **No progress at all** → Request never starts (network/connection issue)
   - **Progress starts then stops** → Upload interrupted
   - **Progress reaches 100% then fails** → Backend processing issue

4. **Error Code**:
   - `ECONNABORTED` → Timeout (but we set 120s, so unlikely)
   - `ERR_NETWORK` → Network connectivity issue
   - `ECONNREFUSED` → Backend not running or wrong URL
   - No code → Generic network error

### Step 3: Verify Backend Endpoint

Check if the backend actually has a PUT endpoint for `/khata/transactions/:id`.

**In your backend code** (nxgenaidev_auth), look for:
- File: `src/routes/khata.routes.ts` (or similar)
- Route: `PUT /khata/transactions/:id`
- Controller: Should handle FormData with image uploads

**Backend endpoint checklist:**
- [ ] PUT endpoint exists
- [ ] Accepts multipart/form-data
- [ ] Has proper CORS configuration
- [ ] Has sufficient timeout (at least 120s)
- [ ] Handles image uploads correctly

### Step 4: Compare with Create Transaction

Since **create works** but **update fails**, compare:

**Create Transaction (Working):**
- Endpoint: `POST /khata/transactions`
- Uses FormData: ✅
- Timeout: 120s ✅
- Progress tracking: ✅

**Update Transaction (Failing):**
- Endpoint: `PUT /khata/transactions/:id`
- Uses FormData: ✅
- Timeout: 120s ✅
- Progress tracking: ✅

**Question:** Does the backend actually implement the PUT endpoint?

### Step 5: Test Backend Directly

Use a tool like Postman or curl to test the backend endpoint directly:

```bash
# Test PUT endpoint with FormData
curl -X PUT \
  http://YOUR_BACKEND_URL/api/khata/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_SSO_TOKEN" \
  -F "amount=100" \
  -F "type=give" \
  -F "description=Test update" \
  -F "image=@/path/to/test-image.jpg"
```

**Expected response:**
- 200 OK with updated transaction data

**If you get:**
- 404 Not Found → Endpoint doesn't exist
- 405 Method Not Allowed → Backend doesn't support PUT
- 500 Internal Server Error → Backend error processing request
- Connection refused → Backend not running

---

## Possible Root Causes

### 1. Backend Endpoint Missing/Incorrect ⚠️ **MOST LIKELY**

**Symptom:** Create works, update doesn't

**Cause:** Backend might not have PUT `/khata/transactions/:id` endpoint

**Solution:** Add the endpoint to backend:
```typescript
// In nxgenaidev_auth/src/routes/khata.routes.ts
router.put('/transactions/:id', upload.single('image'), khataController.updateTransaction);
```

### 2. CORS Issue with PUT Requests

**Symptom:** GET/POST work, PUT fails

**Cause:** Backend CORS not configured for PUT method

**Solution:** Update backend CORS config:
```typescript
// In nxgenaidev_auth/src/app.ts
fastify.register(cors, {
  origin: [...],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});
```

### 3. Backend Timeout Too Short

**Symptom:** Request starts, progress shows, then fails

**Cause:** Backend timeout < 120s

**Solution:** Increase backend timeout:
```typescript
// In nxgenaidev_auth/src/server.ts
const server = fastify({
  bodyLimit: 10 * 1024 * 1024, // 10MB
  requestTimeout: 180000, // 3 minutes
});
```

### 4. Backend Not Running

**Symptom:** Immediate Network Error, no progress

**Cause:** Backend server stopped or crashed

**Solution:** Start backend:
```bash
cd nxgenaidev_auth
npm run dev
```

### 5. Wrong Backend URL

**Symptom:** Immediate Network Error

**Cause:** Frontend pointing to wrong URL

**Solution:** Check `.env` file:
```env
EXPO_PUBLIC_EVENLY_BACKEND_URL=http://YOUR_CORRECT_URL/api
```

---

## Quick Fixes

### Fix 1: Check if Backend is Running

```bash
# Terminal 1: Start backend
cd nxgenaidev_auth
npm run dev

# Terminal 2: Test health endpoint
curl http://localhost:8001/health
# Should return: {"status":"ok"}
```

### Fix 2: Verify Backend URL in App

Check the full URL being constructed in logs:
```
[EvenlyBackendService] Full URL will be: http://...
```

If it looks wrong, update `.env`:
```bash
cd Evenly/app
# Edit .env
EXPO_PUBLIC_EVENLY_BACKEND_URL=http://192.168.1.X:8001/api
# Restart Expo
npm start
```

### Fix 3: Test with Update Without Image

Try updating without an image to see if FormData is the issue:

**In AddTransactionModal.tsx**, temporarily test without image:
```typescript
// Instead of FormData, try JSON
const updateData = {
  amount: amount,
  type: transactionType,
  description: description,
};
await onUpdateTransaction(editTransaction.id, updateData as any);
```

If this works, the issue is specific to image uploads on updates.

---

## Next Steps

1. **Run the app and trigger an update** - Check the new detailed logs
2. **Copy all the logs** - Share them for further analysis
3. **Verify backend endpoint** - Check if PUT endpoint exists
4. **Test backend directly** - Use curl/Postman to test endpoint
5. **Compare create vs update** - Look for differences in backend implementation

---

## Expected Outcome

After implementing these debugging steps, you should be able to identify:
- Exact point of failure (before request, during upload, or after)
- Whether backend endpoint exists
- Whether it's a network, timeout, or backend issue
- Specific error code and response

**Once we have the detailed logs from the enhanced logging, we can pinpoint the exact cause and implement the correct fix.**

---

## Files Modified for Debugging

1. **`CustomerDetailScreen.tsx`** (lines 219-277)
   - Added detailed logging before, during, and after update
   - Enhanced error logging with full error details

2. **`EvenlyBackendService.ts`** (lines 943-1060)
   - Added comprehensive request logging
   - Added timeout and config logging
   - Added progress tracking logs
   - Enhanced error logging with request config

---

**Status**: Ready for testing with enhanced logging 🔍

**Next**: Run the app, try to update a transaction, and share the complete log output.
