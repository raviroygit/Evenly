# Mobile App: Bearer Token Authentication

## Overview
The mobile app now uses **Bearer token authentication** instead of cookie-based authentication. This fixes the session expired/logout issues that were caused by cookie domain restrictions not working properly in mobile apps.

## Changes Made

### 1. **EvenlyApiClient.ts** - Request Interceptor
**Before**: Used `Cookie: sso_token=...` header
```typescript
config.headers['Cookie'] = `sso_token=${ssoToken}`;
```

**After**: Uses `Authorization: Bearer <accessToken>` header
```typescript
config.headers['Authorization'] = `Bearer ${accessToken}`;
```

**Why**: Mobile apps (React Native/Expo) don't handle HTTP-only cookies with domain restrictions well. Bearer tokens are the standard for mobile authentication.

### 2. **EvenlyApiClient.ts** - Response Interceptor
Updated the 401 retry logic to use the new `accessToken` instead of `ssoToken` when retrying failed requests after token refresh.

### 3. **storage.ts** - Validation
**Before**: Checked for `ssoToken` presence
```typescript
if (!data.ssoToken) {
  console.warn('[AuthStorage] No ssoToken found in stored data');
  return null;
}
```

**After**: Checks for `accessToken` presence
```typescript
if (!data.accessToken) {
  console.warn('[AuthStorage] No accessToken found in stored data');
  return null;
}
```

### 4. **AuthContext.tsx**
- Updated to check for `accessToken` instead of `ssoToken`
- Removed `ssoToken` parameter from `getCurrentUser()` calls
- Interceptor now automatically adds Bearer token to all requests

### 5. **AuthService.ts**
- Removed `ssoToken` parameter from `getCurrentUser()` method
- Removed `ssoToken` parameter from `syncUserWithEvenlyBackend()` method
- Updated `makeRequest()` to not require `ssoToken` parameter
- All authentication is now handled automatically by the Axios interceptor

## How It Works

### Authentication Flow
1. User logs in with email/OTP
2. Backend returns `accessToken`, `refreshToken`, and `ssoToken` in response body
3. Mobile app stores all tokens in AsyncStorage
4. **Axios interceptor automatically adds `Authorization: Bearer <accessToken>` to every request**
5. No need to manually pass tokens to API methods

### Token Refresh
- When backend returns 401 (session expired), the interceptor automatically:
  1. Calls token refresh endpoint using `refreshToken`
  2. Gets new `accessToken`
  3. Stores new tokens in AsyncStorage
  4. Retries the failed request with new token
  5. User stays logged in without interruption

### Backward Compatibility
- `ssoToken` is still stored for backward compatibility
- But it's no longer used for authentication in mobile app
- Backend still accepts Bearer tokens via `validateAuth()` helper (added earlier)

## Benefits

✅ **No more session expired issues** - Mobile apps work properly with Bearer tokens
✅ **Standard mobile auth pattern** - Industry best practice
✅ **Simpler code** - No need to pass tokens manually, interceptor handles it
✅ **Better security** - No cookie domain restrictions to worry about
✅ **Seamless refresh** - Token refresh happens automatically in background

## Testing

Test the following scenarios to verify everything works:

1. **Login Flow**
   - User logs in with email/OTP
   - Access token is stored
   - User stays logged in after closing app

2. **API Calls**
   - All API calls work without passing tokens manually
   - Bearer token is automatically added to headers

3. **Token Refresh**
   - After 24 hours, token expires
   - App automatically refreshes using refresh token
   - User stays logged in without interruption

4. **Logout**
   - User logs out
   - All tokens are cleared from storage
   - User is redirected to login screen

## Migration Notes

**Existing users**: No migration needed. On next login:
- Old `ssoToken`-based storage will be replaced
- New `accessToken` will be used for all requests
- Users will stay logged in seamlessly

**Developers**:
- No need to pass `ssoToken` to API methods anymore
- Interceptor handles authentication automatically
- Just call API methods directly (e.g., `evenlyApiClient.get('/groups')`)
