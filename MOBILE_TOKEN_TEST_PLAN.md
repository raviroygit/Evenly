# Mobile Never-Expiring Token - Test Plan

## Overview

This document provides a comprehensive test plan for verifying the mobile never-expiring token implementation across all three layers:
1. Shared Auth System (nxgenaidev_auth)
2. Evenly Backend (wrapper)
3. Mobile App (Expo)

---

## Prerequisites

### 1. Start Backend Services

```bash
# Terminal 1: Start shared auth system
cd AuthSystem/nxgenaidev_auth
npm run dev
# Should run on http://localhost:8001

# Terminal 2: Start evenly backend
cd Evenly/evenly-backend
npm run dev
# Should run on http://localhost:3001

# Terminal 3: Start mobile app
cd Evenly/app
npm start
# Choose platform: npm run ios OR npm run android
```

### 2. Verify Environment Variables

**nxgenaidev_auth/.env:**
```env
PORT=8001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=30m  # For web clients
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=7d
```

**evenly-backend/.env:**
```env
PORT=3001
AUTH_SERVICE_URL=http://localhost:8001/api/v1
ORGANIZATION_ID=your-org-id
```

**Evenly/app/.env:**
```env
EXPO_PUBLIC_EVENLY_BACKEND_URL=http://localhost:3001
```

---

## Test Cases

### Test 1: Mobile Login Flow - Never-Expiring Token

**Purpose:** Verify that mobile clients receive 10-year tokens with no refresh token

**Steps:**
1. **Request OTP for mobile:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "x-client-type: mobile" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "OTP sent to your email!"
   }
   ```

2. **Verify OTP (using test OTP from email):**
   ```bash
   curl -X POST http://localhost:3001/api/auth/verify-otp \
     -H "x-client-type: mobile" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","otp":"123456"}'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "user": {
         "id": "...",
         "email": "test@example.com",
         "name": "Test User"
       },
       "accessToken": "eyJhbGc...",  // JWT token
       "refreshToken": null           // ← NULL for mobile
     }
   }
   ```

3. **Decode JWT to verify expiry:**
   ```bash
   # Copy accessToken from response
   # Visit https://jwt.io and paste token
   # Check 'exp' field in payload
   # Should be approximately 10 years from now (3650 days)
   ```

4. **Check evenly-backend logs:**
   ```
   📱 [evenly-backend] Forwarding mobile client header to auth system
   ✅ [evenly-backend] Received mobile tokens: {
     platform: 'mobile',
     expiresIn: null,
     hasRefreshToken: false
   }
   ```

5. **Check shared auth logs:**
   ```
   📱 Detected mobile client via x-client-type header
   ✅ Generated never-expiring mobile token
   ```

**Success Criteria:**
- ✅ Response includes `accessToken`
- ✅ Response has `refreshToken: null`
- ✅ JWT `exp` field shows ~10 years expiry
- ✅ Logs show mobile detection at both layers
- ✅ Response includes `platform: "mobile"`

---

### Test 2: Web Login Flow - Standard Tokens

**Purpose:** Verify that web clients still receive 30-minute tokens with 7-day refresh tokens

**Steps:**
1. **Request OTP for web (no mobile header):**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"webuser@example.com"}'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "OTP sent to your email!"
   }
   ```

2. **Verify OTP:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"webuser@example.com","otp":"123456"}'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "user": {
         "id": "...",
         "email": "webuser@example.com"
       },
       "accessToken": "eyJhbGc...",     // JWT token
       "refreshToken": "eyJhbGc..."     // ← PRESENT for web
     }
   }
   ```

3. **Decode JWT to verify expiry:**
   ```bash
   # Paste accessToken to https://jwt.io
   # Check 'exp' field
   # Should be ~30 minutes from now (1800 seconds)
   ```

4. **Check logs - should NOT show mobile detection:**
   ```
   [evenly-backend] Processing OTP verification for web client
   [shared-auth] Generating standard 30-min tokens for web
   ```

**Success Criteria:**
- ✅ Response includes `accessToken`
- ✅ Response includes `refreshToken` (not null)
- ✅ Access token expires in ~30 minutes
- ✅ Refresh token expires in ~7 days
- ✅ No mobile detection logs
- ✅ Response includes `platform: "web"`

---

### Test 3: Mobile App Integration Test

**Purpose:** Verify mobile app uses never-expiring tokens correctly

**Steps:**
1. **Clear app storage (fresh install simulation):**
   - iOS: Long press app → Remove App → Reinstall
   - Android: Settings → Apps → Evenly → Clear Storage

2. **Launch mobile app and login:**
   - Enter email
   - Enter OTP from email
   - Wait for login to complete

3. **Check AsyncStorage (React Native Debugger):**
   ```javascript
   AsyncStorage.getItem('evenly_auth').then(data => {
     const auth = JSON.parse(data);
     console.log('Access Token:', auth.accessToken);
     console.log('Refresh Token:', auth.refreshToken); // Should be undefined
     console.log('User:', auth.user);
   });
   ```

   **Expected:**
   - `accessToken` is present
   - `refreshToken` is `undefined` or `null`
   - `user` object is present

4. **Check mobile app logs:**
   ```
   [AuthStorage] ✅ Auth data saved (token never expires)
   [AuthContext] ✅ Login successful - mobile token never expires
   [EvenlyApiClient] Using never-expiring mobile token
   ```

5. **Close app completely and reopen after 5 minutes:**
   - User should remain logged in
   - No "Session expired" or refresh errors
   - Dashboard loads with cached data

6. **Check API requests:**
   - All requests should include `Authorization: Bearer <token>`
   - All requests should include `x-client-type: mobile`
   - No refresh token API calls should be made

**Success Criteria:**
- ✅ User stays logged in after closing app
- ✅ No token refresh logic executes
- ✅ No refresh token stored in AsyncStorage
- ✅ All API requests include mobile header
- ✅ No "Session expired" errors
- ✅ App works offline with cached data

---

### Test 4: Token Never Expires (Time-Based Test)

**Purpose:** Verify mobile token remains valid after extended period

**Steps:**
1. **Get mobile token from Test 1**

2. **Wait 24 hours (or change system time):**
   - For testing, you can decode JWT and verify expiry is still years away
   - Or actually wait 24 hours

3. **Make API request with old token:**
   ```bash
   curl -X GET http://localhost:3001/api/groups \
     -H "Authorization: Bearer <mobile-token-from-24-hours-ago>" \
     -H "x-client-type: mobile"
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "data": [...]
   }
   ```

4. **Compare with web token after 30 minutes:**
   ```bash
   # Wait 30 minutes after getting web token
   curl -X GET http://localhost:3001/api/groups \
     -H "Authorization: Bearer <web-token-from-30-min-ago>"
   ```

   **Expected Response:**
   ```json
   {
     "success": false,
     "message": "Token expired"
   }
   ```

**Success Criteria:**
- ✅ Mobile token works after 24+ hours
- ✅ Web token expires after 30 minutes
- ✅ Mobile users never see "Session expired"

---

### Test 5: Header Forwarding Through Wrapper

**Purpose:** Verify evenly-backend correctly forwards mobile header to shared auth

**Steps:**
1. **Enable debug logging in evenly-backend:**
   ```typescript
   // In authService.ts, verify these logs are present:
   console.log('📱 [evenly-backend] Forwarding mobile client header to auth system');
   console.log('✅ [evenly-backend] Received mobile tokens:', {...});
   ```

2. **Make request to evenly-backend:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/verify-otp \
     -H "x-client-type: mobile" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","otp":"123456"}' \
     -v
   ```

3. **Check request headers sent to shared auth:**
   - Evenly-backend should add `x-client-type: mobile` to axios request
   - Shared auth should receive and detect the header

4. **Verify in shared auth logs:**
   ```
   📱 Detected mobile client via x-client-type header
   ```

**Success Criteria:**
- ✅ Evenly-backend logs show header forwarding
- ✅ Shared auth logs show mobile detection
- ✅ Response contains mobile-specific tokens
- ✅ Header is preserved through proxy layer

---

### Test 6: Multiple Platforms Simultaneously

**Purpose:** Verify mobile and web can coexist without conflicts

**Steps:**
1. **Login from mobile app:**
   - Complete mobile login flow
   - Note the token

2. **Login from web browser:**
   - Open `http://localhost:3000` (if web frontend exists)
   - Complete web login flow
   - Note the token

3. **Verify both work independently:**
   ```bash
   # Mobile token
   curl -X GET http://localhost:3001/api/groups \
     -H "Authorization: Bearer <mobile-token>" \
     -H "x-client-type: mobile"

   # Web token
   curl -X GET http://localhost:3001/api/groups \
     -H "Authorization: Bearer <web-token>"
   ```

4. **Check token characteristics:**
   - Mobile token has 10-year expiry
   - Web token has 30-minute expiry
   - Both can make API calls simultaneously

**Success Criteria:**
- ✅ Mobile and web tokens are different
- ✅ Both tokens work for API requests
- ✅ No interference between platforms
- ✅ Correct expiry for each platform

---

### Test 7: Error Handling - Missing Mobile Header

**Purpose:** Verify fallback when mobile header is missing

**Steps:**
1. **Mobile app sends request without header (edge case):**
   ```bash
   # Simulate mobile app forgetting to send header
   curl -X POST http://localhost:3001/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","otp":"123456"}'
   ```

   **Expected Behavior:**
   - Should fall back to web token (30 minutes)
   - Check User-Agent for mobile patterns
   - Log warning if mobile app detected but no header

**Success Criteria:**
- ✅ Request succeeds (doesn't fail)
- ✅ Falls back to standard tokens
- ✅ Logs show fallback behavior

---

## Test Results Template

Copy this template for each test run:

```markdown
## Test Run: [Date]

### Environment
- Shared Auth System: [Running/Not Running] on port [8001]
- Evenly Backend: [Running/Not Running] on port [3001]
- Mobile App: [iOS/Android/Both]

### Test 1: Mobile Login Flow
- Status: [✅ PASS / ❌ FAIL]
- Access Token Received: [Yes/No]
- Refresh Token: [null/present] ← Should be null
- Token Expiry: [X years]
- Notes:

### Test 2: Web Login Flow
- Status: [✅ PASS / ❌ FAIL]
- Access Token Received: [Yes/No]
- Refresh Token: [null/present] ← Should be present
- Access Token Expiry: [X minutes]
- Refresh Token Expiry: [X days]
- Notes:

### Test 3: Mobile App Integration
- Status: [✅ PASS / ❌ FAIL]
- App Stays Logged In: [Yes/No]
- No Refresh Logic: [Confirmed/Issues]
- Notes:

### Test 4: Token Never Expires
- Status: [✅ PASS / ❌ FAIL]
- Mobile Token Valid After 24h: [Yes/No]
- Web Token Expired After 30min: [Yes/No]
- Notes:

### Test 5: Header Forwarding
- Status: [✅ PASS / ❌ FAIL]
- Header Forwarded: [Yes/No]
- Logs Show Detection: [Yes/No]
- Notes:

### Test 6: Multiple Platforms
- Status: [✅ PASS / ❌ FAIL]
- Both Platforms Work: [Yes/No]
- No Conflicts: [Yes/No]
- Notes:

### Test 7: Error Handling
- Status: [✅ PASS / ❌ FAIL]
- Fallback Works: [Yes/No]
- Notes:

### Overall Result
- Total Tests: 7
- Passed: [X]
- Failed: [X]
- Implementation Status: [✅ READY FOR PRODUCTION / ❌ NEEDS FIXES]
```

---

## Automated Testing Script

Save this as `test-token-flows.sh`:

```bash
#!/bin/bash

# Mobile Never-Expiring Token - Automated Test Script

echo "🧪 Starting Token Flow Tests..."
echo ""

# Configuration
EVENLY_BACKEND="http://localhost:3001"
TEST_EMAIL="test@example.com"
TEST_OTP="123456"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Mobile Login
echo "📱 Test 1: Mobile Login Flow"
echo "Requesting OTP..."
curl -s -X POST "$EVENLY_BACKEND/api/auth/login" \
  -H "x-client-type: mobile" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}" | jq .

echo ""
echo "Verifying OTP..."
MOBILE_RESPONSE=$(curl -s -X POST "$EVENLY_BACKEND/api/auth/verify-otp" \
  -H "x-client-type: mobile" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$TEST_OTP\"}")

echo "$MOBILE_RESPONSE" | jq .

# Extract tokens
MOBILE_ACCESS=$(echo "$MOBILE_RESPONSE" | jq -r '.data.accessToken')
MOBILE_REFRESH=$(echo "$MOBILE_RESPONSE" | jq -r '.data.refreshToken')

if [ "$MOBILE_REFRESH" == "null" ]; then
  echo -e "${GREEN}✅ PASS: Mobile refresh token is null${NC}"
else
  echo -e "${RED}❌ FAIL: Mobile refresh token should be null${NC}"
fi

echo ""
echo "---"
echo ""

# Test 2: Web Login
echo "🌐 Test 2: Web Login Flow"
echo "Requesting OTP..."
curl -s -X POST "$EVENLY_BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"webuser@example.com\"}" | jq .

echo ""
echo "Verifying OTP..."
WEB_RESPONSE=$(curl -s -X POST "$EVENLY_BACKEND/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"webuser@example.com\",\"otp\":\"$TEST_OTP\"}")

echo "$WEB_RESPONSE" | jq .

# Extract tokens
WEB_REFRESH=$(echo "$WEB_RESPONSE" | jq -r '.data.refreshToken')

if [ "$WEB_REFRESH" != "null" ]; then
  echo -e "${GREEN}✅ PASS: Web refresh token is present${NC}"
else
  echo -e "${RED}❌ FAIL: Web refresh token should be present${NC}"
fi

echo ""
echo "---"
echo ""

# Test 3: Token Validation
echo "🔑 Test 3: Token Validation"
echo "Testing mobile token..."
curl -s -X GET "$EVENLY_BACKEND/api/groups" \
  -H "Authorization: Bearer $MOBILE_ACCESS" \
  -H "x-client-type: mobile" | jq .

echo ""
echo "✅ All tests completed!"
```

Run with:
```bash
chmod +x test-token-flows.sh
./test-token-flows.sh
```

---

## Manual Testing Checklist

Use this for thorough manual verification:

- [ ] **Mobile Login**
  - [ ] Request OTP with mobile header
  - [ ] Verify OTP with mobile header
  - [ ] Receive 10-year access token
  - [ ] Confirm null refresh token
  - [ ] Check backend logs for mobile detection
  - [ ] Check shared auth logs for token generation

- [ ] **Web Login**
  - [ ] Request OTP without mobile header
  - [ ] Verify OTP without mobile header
  - [ ] Receive 30-minute access token
  - [ ] Receive 7-day refresh token
  - [ ] Confirm no mobile detection logs

- [ ] **Mobile App**
  - [ ] Fresh install and login
  - [ ] Verify token stored in AsyncStorage
  - [ ] Confirm no refresh token stored
  - [ ] Close and reopen app
  - [ ] Confirm user stays logged in
  - [ ] Check all API requests include mobile header
  - [ ] Verify no token refresh API calls

- [ ] **Token Longevity**
  - [ ] Decode mobile JWT and verify 10-year expiry
  - [ ] Decode web JWT and verify 30-minute expiry
  - [ ] Test mobile token after 24 hours
  - [ ] Test web token after 30 minutes (should fail)

- [ ] **Error Handling**
  - [ ] Test with missing mobile header
  - [ ] Test with invalid token
  - [ ] Test with network offline
  - [ ] Verify user stays logged in on errors

---

## Troubleshooting

### Issue: Mobile token expires after 30 minutes

**Diagnosis:**
- Mobile header not being sent
- Evenly-backend not forwarding header
- Shared auth not detecting mobile

**Fix:**
1. Check EvenlyApiClient.ts has `x-client-type: mobile` in default headers
2. Check authService.ts forwards header to shared auth
3. Check auth.controller.ts detects mobile header
4. Verify logs show mobile detection

### Issue: Web clients getting 10-year tokens

**Diagnosis:**
- Web clients accidentally sending mobile header
- Shared auth always generating mobile tokens

**Fix:**
1. Verify web clients don't send `x-client-type: mobile`
2. Check auth.controller.ts only generates mobile tokens when header present
3. Test with curl without mobile header

### Issue: User logged out after closing app

**Diagnosis:**
- Token not stored in AsyncStorage
- AuthContext clearing session on error
- Storage expiry check removing token

**Fix:**
1. Check storage.ts doesn't have local expiry checks
2. Verify AuthContext never calls clearAuthData automatically
3. Check AsyncStorage.getItem returns token after app restart

---

## Success Criteria Summary

✅ **Implementation is successful when:**

1. Mobile clients receive 10-year tokens with null refresh token
2. Web clients receive 30-minute tokens with 7-day refresh tokens
3. Mobile app stays logged in indefinitely until manual logout
4. No token refresh logic executes on mobile
5. Evenly-backend correctly forwards mobile header
6. Shared auth correctly detects and generates mobile tokens
7. Both platforms can coexist without conflicts
8. All tests pass consistently

---

## Next Steps After Testing

Once all tests pass:

1. **Deploy to staging:**
   - Deploy shared auth system
   - Deploy evenly-backend
   - Deploy mobile app to TestFlight/Play Store Beta

2. **Monitor in production:**
   - Track mobile token usage
   - Monitor for any token-related errors
   - Verify user retention improves

3. **Consider security enhancements:**
   - Implement token blacklist system (see TOKEN_BLACKLIST_DESIGN.md)
   - Add device fingerprinting
   - Implement suspicious activity detection
