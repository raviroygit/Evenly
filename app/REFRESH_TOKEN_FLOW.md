# Refresh Token Flow - Stay Logged In Forever

## Overview
The mobile app now implements **automatic token refresh** to keep users logged in indefinitely. Users will never be auto-logged out unless they manually logout.

## Token Lifecycle

### 1. **Login Response**
When user logs in, backend returns:
```json
{
  "message": "Logged in successfully",
  "accessToken": "eyJhbGci...",  // Valid for 30 minutes
  "refreshToken": "eyJhbGci...", // Valid for 7 days
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

### 2. **Token Storage**
Mobile app stores in AsyncStorage:
- `accessToken` - Used for API authentication (Bearer token)
- `refreshToken` - Used to get new tokens when accessToken expires
- `user` - User data cached locally

### 3. **API Authentication**
Every API request automatically includes:
```
Authorization: Bearer <accessToken>
```
This is handled by the Axios interceptor in `EvenlyApiClient.ts`

### 4. **Token Expiry Detection**
When `accessToken` expires (30 minutes), backend returns `401 Unauthorized`.

### 5. **Automatic Refresh**
The Axios response interceptor detects 401 and:
1. Calls `/auth/refresh-token` with `refreshToken`
2. Backend validates `refreshToken` and returns:
   ```json
   {
     "accessToken": "new_access_token",
     "refreshToken": "new_refresh_token"
   }
   ```
3. Mobile app stores new tokens in AsyncStorage
4. Retries the failed request with new `accessToken`
5. User never notices - completely seamless!

### 6. **Background Token Refresh**
Every 15 minutes, a background timer checks:
- Decodes JWT to check expiry time
- If token expires in < 5 minutes, refreshes proactively
- Prevents users from experiencing 401 errors

## Implementation Details

### Backend Changes (`nxgenaidev_auth`)

**File**: `src/controllers/auth.controller.ts`

Updated `/auth/refresh-token` endpoint to return BOTH tokens:
```typescript
async refreshToken(request, reply) {
  const { refreshToken } = request.body;

  // Verify refresh token
  const decoded = await request.jwtVerify();
  const user = await authService.validateRefreshToken(userId, refreshToken);

  // Generate NEW tokens
  const newAccessToken = jwt.sign({ userId });
  const newRefreshToken = jwt.sign({ userId }, { expiresIn: '7d' });

  // Update user's refresh token in database
  user.refreshToken = newRefreshToken;
  await user.save();

  // Return both tokens
  reply.send({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
}
```

### Mobile App Changes

#### 1. **SilentTokenRefresh.ts** - Token Refresh Manager

```typescript
static async refresh(): Promise<boolean> {
  const authData = await AuthStorage.getAuthData();

  // Call backend refresh endpoint
  const response = await axios.post(
    `${ENV.EVENLY_BACKEND_URL}/auth/refresh-token`,
    { refreshToken: authData.refreshToken }
  );

  // Save new tokens
  await AuthStorage.saveAuthData(
    authData.user,
    response.data.accessToken,
    response.data.refreshToken,
    response.data.ssoToken
  );

  return true;
}
```

#### 2. **EvenlyApiClient.ts** - Axios Interceptor

**Request Interceptor**:
```typescript
// Automatically add Bearer token to every request
const authData = await AuthStorage.getAuthData();
config.headers['Authorization'] = `Bearer ${authData.accessToken}`;
```

**Response Interceptor**:
```typescript
// Detect 401 and refresh automatically
if (error.response?.status === 401) {
  // Refresh tokens
  const refreshed = await SilentTokenRefresh.refresh();

  if (refreshed) {
    // Retry failed request with new token
    const authData = await AuthStorage.getAuthData();
    originalRequest.headers['Authorization'] = `Bearer ${authData.accessToken}`;
    return axios(originalRequest);
  }
}
```

#### 3. **AuthContext.tsx** - Background Refresh Timer

```typescript
// Check and refresh every 15 minutes
useEffect(() => {
  if (!user) return;

  // Check immediately on mount
  SilentTokenRefresh.checkAndRefresh();

  // Then check every 15 minutes
  const interval = setInterval(() => {
    SilentTokenRefresh.checkAndRefresh();
  }, 15 * 60 * 1000);

  return () => clearInterval(interval);
}, [user]);
```

## How It Works - Step by Step

### Scenario 1: Token Expires During API Call

1. User opens app after 1 hour (accessToken expired)
2. App loads cached user data immediately (stays logged in)
3. App makes API call to fetch groups
4. Backend returns 401 (token expired)
5. **Interceptor catches 401**:
   - Calls `/auth/refresh-token` with `refreshToken`
   - Gets new `accessToken` + `refreshToken`
   - Stores new tokens in AsyncStorage
   - Retries the groups API call with new token
6. Groups load successfully
7. **User never sees any error!**

### Scenario 2: Proactive Refresh

1. User is actively using app
2. Background timer checks token every 15 minutes
3. Token expires in 3 minutes (less than 5-minute threshold)
4. **Proactively refreshes before expiry**:
   - Calls `/auth/refresh-token`
   - Gets new tokens
   - Stores in AsyncStorage
5. User continues using app without interruption
6. **No 401 errors ever occur!**

### Scenario 3: Refresh Token Expires (7 Days)

1. User hasn't opened app for 8 days
2. Both `accessToken` and `refreshToken` expired
3. User opens app
4. App loads cached user data (stays logged in)
5. App makes API call
6. Backend returns 401 (token expired)
7. Interceptor tries to refresh
8. Refresh fails (refreshToken also expired, returns 401)
9. **Interceptor keeps user logged in with cached data**:
   - User can still view groups, expenses (cached)
   - User can't make new changes (requires backend)
   - App shows offline mode indicator
10. **User is NOT logged out automatically!**
11. When user manually logs out and logs back in, fresh tokens are issued

## Benefits

✅ **Stay Logged In Forever** - Users never auto-logged out
✅ **Seamless Experience** - Refresh happens in background, user never notices
✅ **Offline Support** - Even if refresh fails, user stays logged in with cached data
✅ **Proactive Refresh** - Prevents 401 errors before they happen
✅ **Security** - Short-lived access tokens (30 min), refresh tokens rotated on every refresh
✅ **Standard Pattern** - Industry best practice for mobile apps

## Token Security

### Access Token (30 minutes)
- Short-lived for security
- Used for every API request
- Automatically refreshed before expiry

### Refresh Token (7 days)
- Longer-lived for convenience
- Only used to get new tokens
- Rotated on every refresh (backend generates new refreshToken)
- Stored in database, can be revoked if needed

### Token Rotation
Every refresh generates:
- New `accessToken` (30 min)
- New `refreshToken` (7 days)
- Old `refreshToken` is replaced in database

This means:
- After 7 days, user needs to login again (normal behavior)
- But with proactive refresh, user will keep getting new 7-day tokens
- As long as user opens app once every 7 days, they stay logged in forever!

## Debugging

### Check Token Expiry
```typescript
// Decode JWT in browser console or mobile debugger
const payload = JSON.parse(atob(accessToken.split('.')[1]));
console.log('Token expires at:', new Date(payload.exp * 1000));
```

### Check Refresh Timer
Look for these logs in mobile app console:
```
[SilentRefresh] Token OK - expires in 25 minutes
[SilentRefresh] Token expires in 3 minutes - refreshing now
[SilentRefresh] ✅ Session refreshed successfully
```

### Check 401 Retry
Look for these logs when token expires:
```
[EvenlyApiClient] Backend session expired - attempting silent refresh
[EvenlyApiClient] ✅ Silent refresh successful, retrying request
```

## Testing Checklist

- [ ] User logs in, gets accessToken + refreshToken
- [ ] Tokens stored in AsyncStorage
- [ ] API calls include Bearer token automatically
- [ ] After 30 minutes, token expires but user stays logged in
- [ ] 401 error triggers automatic refresh
- [ ] Failed request is retried with new token
- [ ] User never sees error, seamless experience
- [ ] Background timer refreshes proactively every 15 minutes
- [ ] After 7 days without app usage, user sees offline mode (not logged out)
- [ ] Manual logout clears all tokens properly

## Migration Notes

**Existing users**: On next app open after update:
- Old authentication still works
- On first API call, may get 401 (if old token expired)
- Automatic refresh will kick in
- User stays logged in seamlessly

**No breaking changes**: All backwards compatible!
