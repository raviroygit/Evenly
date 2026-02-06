# Debug Steps for "Not Getting Any Data"

## Quick Check
Open the app and check the console logs in Expo. Look for:
1. "No organization ID set" - means organization context is missing
2. API errors (401, 403, 404, 500)
3. Network errors

## Common Causes & Fixes

### 1. Organization ID Not Set
**Symptom**: Console shows "No organization ID set"
**Fix**: Clear app data and re-login
```bash
# Clear Expo cache and restart
npx expo start --clear
```

### 2. Cache Issues After Fixes
**Symptom**: Loading spinners show briefly then nothing appears
**Cause**: Our safety fixes default to empty arrays when data is invalid
**Fix**: Pull to refresh on each screen to reload data

### 3. API Errors
**Symptom**: Blank screens, no error messages
**Check**: Console logs for API errors
**Fix**: Verify backend is running and accessible

### 4. Auth Token Issues
**Symptom**: 401 errors in console
**Fix**: Logout and login again

## Step-by-Step Debugging

1. **Check if you're logged in**
   - Go to Profile tab
   - If you see user info, you're logged in
   - If not, login again

2. **Check organization context**
   - Open React Native debugger console
   - Look for "No organization ID set" warnings
   - If present, logout and login again

3. **Force refresh all data**
   - Go to Home tab
   - Pull down to refresh
   - Go to Groups tab
   - Pull down to refresh
   - Go to Profile tab
   - Pull down to refresh

4. **Check backend connectivity**
   - Verify EXPO_PUBLIC_EVENLY_BACKEND_URL in .env
   - Ensure backend is running
   - Check network connectivity

5. **Clear everything and start fresh**
   ```bash
   # In terminal
   npx expo start --clear
   
   # In app: Logout, close app, reopen, login
   ```

## Expected Behavior After Fixes

- Home screen should show:
  - Groups summary card (may show 0 groups initially)
  - Khata summary card
  - Recent activity (may be empty)
  
- If truly no data exists:
  - Create a test group
  - Add a test expense
  - Data should appear immediately

## If Still No Data

The issue might be:
1. Backend API changed response format
2. Organization not created/linked for user
3. Database is empty for this organization

Let me know what you see in the console!
