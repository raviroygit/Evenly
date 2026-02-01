# Verify Mobile Never-Expiring Token

You just logged in! Let's verify that your mobile token is configured correctly.

## Method 1: Quick Check Using Token Decoder (Easiest)

### Step 1: Get Your Access Token

Open your terminal and run this from the app directory:

```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app

# For iOS Simulator (if using React Native Debugger)
npx react-native-devsettings
```

**OR** use this quick script to extract token from iOS simulator:

```bash
# Extract token from iOS simulator
xcrun simctl get_app_container booted com.raviroy.evenlysplit data 2>/dev/null | \
  xargs -I {} find {} -name "RCTAsyncLocalStorage*" 2>/dev/null | \
  head -1 | xargs -I {} sqlite3 {} "SELECT value FROM catalystLocalStorage WHERE key='evenly_auth';" 2>/dev/null | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print('Access Token:', data.get('accessToken', 'NOT FOUND')[:50]+'...'); print('Refresh Token:', data.get('refreshToken', 'null'))"
```

### Step 2: Decode the Token

Once you have your access token, run:

```bash
node verify-mobile-token.js "YOUR_ACCESS_TOKEN_HERE"
```

**Expected Output for Mobile Token:**
```
✅ Token lifetime is 10.0 years (MOBILE TOKEN)
✅ Platform is set to "mobile"
✅ User ID: xxx-xxx-xxx
✅ Token type is "access"

🎉 VERIFICATION PASSED: This is a valid mobile never-expiring token!
```

**If you see Web Token:**
```
❌ Token lifetime is 30 minutes (WEB TOKEN - expected 10 years)
❌ Platform is set to "web" (expected "mobile")
```

---

## Method 2: Check App Logs (Most Reliable)

### Step 1: Open Metro Bundler Logs

The Metro bundler should be running in your terminal. Look for these logs after login:

**✅ GOOD - Mobile Token Received:**
```
[AuthStorage] ✅ Auth data saved (token never expires)
[AuthContext] ✅ Login successful - mobile token never expires
[EvenlyApiClient] Using never-expiring mobile token
```

**❌ BAD - Web Token Received:**
```
[AuthStorage] ⚠️ Saved auth data with refresh token
[AuthContext] Setting up token refresh timer
```

### Step 2: Check Backend Logs

If you have the evenly-backend running, check its terminal for:

**✅ GOOD - Mobile Detected:**
```
📱 [evenly-backend] Forwarding mobile client header to auth system
✅ [evenly-backend] Received mobile tokens: {
  platform: 'mobile',
  expiresIn: null,
  hasRefreshToken: false
}
```

**❌ BAD - No Mobile Detection:**
```
[evenly-backend] Processing OTP verification for web client
```

---

## Method 3: Check AsyncStorage Directly

### iOS Simulator:

```bash
# Find the app container
xcrun simctl get_app_container booted com.raviroy.evenlysplit

# Then navigate to:
# <container>/Library/Caches/RCTAsyncLocalStorage/
# Look for manifest.json or .sqlite file
```

### Using React Native Debugger:

1. Open React Native Debugger
2. Go to "React Native" tab
3. Click "Show AsyncStorage"
4. Find key: `evenly_auth`
5. Check the value:

**✅ GOOD (Mobile):**
```json
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": null,  // ← Should be null or undefined
  "timestamp": 1738410000000
}
```

**❌ BAD (Web):**
```json
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",  // ← Should NOT be present
  "timestamp": 1738410000000
}
```

---

## Method 4: Manual Token Decode

If you have your access token, paste it into https://jwt.io and check:

**Payload should show:**
```json
{
  "userId": "your-user-id",
  "type": "access",
  "platform": "mobile",    // ← Should say "mobile"
  "createdAt": 1738410000000,
  "iat": 1738410000,
  "exp": 2053770000        // ← Should be ~10 years from now
}
```

**Calculate expiry:**
```javascript
// In browser console at jwt.io
const now = Date.now() / 1000;
const exp = 2053770000; // Your exp value
const years = (exp - now) / (365.25 * 24 * 60 * 60);
console.log(`Token expires in ${years.toFixed(1)} years`);
// Should show ~10 years
```

---

## Quick Manual Test

### Test 1: Check if RefreshToken is Null

Open React Native Debugger Console and run:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.getItem('evenly_auth').then(data => {
  const auth = JSON.parse(data);
  console.log('Refresh Token:', auth.refreshToken);
  // Should be null or undefined for mobile
});
```

### Test 2: Close and Reopen App

1. Close the app completely (swipe away from app switcher)
2. Wait 1 minute
3. Reopen the app
4. **✅ Expected:** You should still be logged in, dashboard loads immediately
5. **❌ Problem:** If you're logged out or see "Session expired", tokens aren't working

---

## Troubleshooting

### Issue: Token Expires in 30 Minutes (Not 10 Years)

**Cause:** Mobile header not being sent or not detected

**Fix:**
1. Check `EvenlyApiClient.ts` has this in headers:
   ```typescript
   headers: {
     'x-client-type': 'mobile',
   }
   ```

2. Check evenly-backend `authService.ts` forwards the header:
   ```typescript
   if (isMobile) {
     headers['x-client-type'] = 'mobile';
   }
   ```

3. Check shared auth `auth.controller.ts` detects mobile:
   ```typescript
   private isMobileClient(request: FastifyRequest): boolean {
     const clientType = request.headers['x-client-type'] as string;
     return clientType === 'mobile';
   }
   ```

### Issue: Refresh Token is Present

**Cause:** Storage still saving refresh token

**Fix:**
Check `storage.ts` - the `saveAuthData` signature should NOT accept refreshToken:
```typescript
async saveAuthData(user: any, accessToken?: string, organizations?: Organization[])
```

### Issue: App Logs Out After Closing

**Cause:** Token not being stored or retrieved correctly

**Fix:**
1. Check AsyncStorage writes successfully
2. Check no code clears storage on app startup
3. Check AuthContext doesn't call logout automatically

---

## Expected Behavior (✅ Correct)

After logging in with mobile app:

1. **Token received:** 10-year access token, no refresh token
2. **Storage:** Token saved in AsyncStorage without expiry
3. **API calls:** All requests include `Authorization: Bearer <token>`
4. **Background:** No token refresh timers or background checks
5. **Reopen app:** User stays logged in forever
6. **Network errors:** User stays logged in with cached data
7. **Manual logout:** Only way to log out

---

## Quick Command Summary

```bash
# Navigate to app directory
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app

# Verify token (after extracting it)
node ../verify-mobile-token.js "YOUR_TOKEN_HERE"

# Check Metro bundler logs
# Look for: [AuthContext] ✅ Login successful - mobile token never expires

# Check backend logs (if running)
cd ../evenly-backend
npm run dev
# Look for: 📱 [evenly-backend] Forwarding mobile client header

# Check shared auth logs (if running)
cd ../../AuthSystem/nxgenaidev_auth
npm run dev
# Look for: 📱 Detected mobile client via x-client-type header
```

---

## Success Indicators

You'll know the implementation is working correctly when you see:

✅ Token expires in ~10 years (not 30 minutes)
✅ No refresh token in AsyncStorage
✅ `platform: 'mobile'` in JWT payload
✅ App logs show "mobile token never expires"
✅ Backend logs show mobile client detection
✅ App stays logged in after complete close/reopen
✅ No token refresh API calls in network logs
✅ Works offline with cached data

If you see all these, your mobile never-expiring token system is working perfectly! 🎉
