# Khata Debugging - Complete Instructions

## ✅ What I Did

I've added **comprehensive debug logging** to the mobile app to identify why Khata data isn't showing.

### Changes Made:
1. **BooksScreen.tsx** - Added detailed console logs:
   - When component renders
   - When useEffect triggers
   - When API calls are made
   - API response data
   - Any errors

2. **EvenlyBackendService.ts** - Added API call logging:
   - When getKhataCustomers is called
   - When getKhataFinancialSummary is called
   - API responses

3. **Fixed Bug**: Swapped totalGive and totalGet labels (they were reversed!)

4. **Force Cache Bypass**: Set `cacheTTLMs: 0` to always fetch fresh data

---

## 📱 How to Rebuild and Test

### Step 1: Pull Latest Code

```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app
git pull origin main
```

### Step 2: Clear Cache and Rebuild

```bash
# Clear all caches
rm -rf node_modules
npm install

# For iOS
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Rebuild
npm run ios
# OR
npm run android
```

### Step 3: Open Console for Logs

**If using Expo**:
```bash
npm start
# Press 'j' to open Chrome debugger
# Console tab will show all logs
```

**If using React Native**:
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### Step 4: Test Khata Tab

1. **Login** with `demo@nxtgenaidev.com` / OTP: `123456`
2. **Navigate to Khata tab** (Books tab)
3. **Watch the console** - you should see logs like:

```
🔵 [BooksScreen] Component rendering...
🎯 [BooksScreen] useEffect triggered - calling loadCustomers
📒 [BooksScreen] loadCustomers called, isRefresh: false
📒 [BooksScreen] Params - search: , filter: all, sort: most-recent
📒 [BooksScreen] Making API calls to backend...
🔷 [EvenlyBackendService] getKhataCustomers called with options: { filterType: 'all', sortType: 'most-recent', cacheTTLMs: 0 }
🔷 [EvenlyBackendService] Calling endpoint: /khata/customers?filterType=all&sortType=most-recent
[EvenlyApiClient] Organization ID: 696fc87397e67400b0335682
[ios] ✅ Added organization ID header
✅ [EvenlyBackendService] getKhataCustomers response - count: 4
✅ [BooksScreen] API Response - Customers count: 4
✅ [BooksScreen] API Response - First customer: { name: 'Rajesh Kumar', ... }
✅ [BooksScreen] State updated - Customers: 4
🏁 [BooksScreen] loadCustomers finished
```

---

## 🔍 What to Look For

### ✅ GOOD - Everything Working:
```
🔵 [BooksScreen] Component rendering...
🎯 [BooksScreen] useEffect triggered
📒 [BooksScreen] Making API calls to backend...
✅ [BooksScreen] API Response - Customers count: 4
```
→ **If you see this**: API working! Data should show in UI.

### ❌ BAD - Component Not Rendering:
```
(No logs at all)
```
→ **Issue**: BooksScreen component not rendering
→ **Fix**: Check routing, tab navigation

### ❌ BAD - useEffect Not Triggering:
```
🔵 [BooksScreen] Component rendering...
(No useEffect log)
```
→ **Issue**: useEffect not running
→ **Fix**: React hooks issue or component lifecycle problem

### ❌ BAD - API Not Called:
```
🔵 [BooksScreen] Component rendering...
🎯 [BooksScreen] useEffect triggered
📒 [BooksScreen] loadCustomers called
(No EvenlyBackendService logs)
```
→ **Issue**: API methods not being reached
→ **Fix**: Check imports, method signatures

### ❌ BAD - No Organization ID:
```
⚠️ [EvenlyApiClient] No organization ID available
```
→ **Issue**: Organization context not set after login
→ **Fix**: Check AuthContext, login flow

### ❌ BAD - API Returns Empty:
```
✅ [EvenlyBackendService] getKhataCustomers response - count: 0
```
→ **Issue**: Backend returning empty array
→ **Fix**: Backend organization context issue

### ❌ BAD - API Error:
```
❌ [BooksScreen] Error loading customers: [error]
```
→ **Issue**: API call failed
→ **Fix**: Check error details, network, authentication

---

## 📊 Next Steps Based on Logs

### Scenario 1: Logs Show "count: 4" but UI shows no data

**Means**: API works, data received, but not rendering

**Check**:
1. Is `customers.length === 0` ? (Should be 4)
2. Is the FlatList/map rendering correctly?
3. Any conditional rendering blocking the list?

**Debug**: Add log before return statement:
```typescript
console.log('🎨 [BooksScreen] About to render customers:', customers.length);
return (
  // ... JSX
)
```

---

### Scenario 2: Logs Show "count: 0" (empty response)

**Means**: Backend organization context issue

**Fix Options**:

**A. Resync demo user:**
```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/nxgenaidev_auth
npm run script:add-demo
npm run script:seed-demo
```

**B. Check backend logs:**
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=evenly-backend' --limit 50 --format json
```

Look for:
```
⚠️ OrganizationContext: No organization ID provided
[KhataService] No organizationId provided, returning empty
```

---

### Scenario 3: No Organization ID in logs

**Means**: Mobile app didn't set organization after login

**Check**: `AuthContext.tsx` after login:
```typescript
// Should have:
evenlyApiClient.setOrganizationId(user.currentOrganization?.id);
```

**Temp Fix**: Manually set after login:
```typescript
import { evenlyApiClient } from '../services/EvenlyApiClient';

// After successful login:
evenlyApiClient.setOrganizationId('696fc87397e67400b0335682');
```

---

### Scenario 4: Component not rendering at all

**Check routing**: Verify `/tabs/books` route exists:
```bash
ls -la /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app/app/tabs/books/
```

Should see `index.tsx` that renders `<BooksScreen />`

---

## 🎯 Action Plan

1. **Rebuild app** with new logging code
2. **Open Khata tab** and **watch console carefully**
3. **Copy ALL console logs** (from opening tab)
4. **Share logs with me** - I'll identify exact issue

---

## 📋 Quick Commands

```bash
# Rebuild iOS
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app
npm install
cd ios && pod install && cd ..
npm run ios

# Rebuild Android
npm install
npm run android

# View iOS logs
npx react-native log-ios

# View Android logs
npx react-native log-android

# Or use Expo
npm start
# Press 'j' for debugger
```

---

## ✅ Expected Logs (When Working)

When everything is working correctly, opening Khata tab should show:

```
🔵 [BooksScreen] Component rendering...
🎯 [BooksScreen] useEffect triggered - calling loadCustomers
📒 [BooksScreen] loadCustomers called, isRefresh: false
📒 [BooksScreen] Params - search: , filter: all, sort: most-recent
📒 [BooksScreen] Making API calls to backend...
🔷 [EvenlyBackendService] getKhataCustomers called with options: {...}
🔷 [EvenlyBackendService] Calling endpoint: /khata/customers?...
🏢 [EvenlyApiClient] Organization ID: 696fc87397e67400b0335682
[ios] ✅ Added organization ID header
✅ [EvenlyBackendService] getKhataCustomers response - count: 4
🔷 [EvenlyBackendService] getKhataFinancialSummary called
✅ [EvenlyBackendService] getKhataFinancialSummary response: { totalGive: '55000.00', totalGet: '10000.00' }
✅ [BooksScreen] API Response - Customers count: 4
✅ [BooksScreen] API Response - First customer: {
  id: '922ee090-...',
  name: 'Rajesh Kumar',
  balance: '-35000.00',
  type: 'give',
  ...
}
✅ [BooksScreen] API Response - Summary: { totalGive: '55000.00', totalGet: '10000.00' }
✅ [BooksScreen] State updated - Customers: 4
🏁 [BooksScreen] loadCustomers finished
```

And you should see 4 customers in the UI!

---

## 🚨 What to Share With Me

After you rebuild and test, please share:

1. **All console logs** from opening Khata tab (copy entire output)
2. **Screenshot** of Khata tab UI
3. **Tell me**:
   - Did you see the 🔵 component rendering log?
   - Did you see the API call logs?
   - What was the customer count?
   - Any error messages?

With these logs, I can pinpoint the **exact issue**! 🎯

---

**Last Updated**: January 21, 2026
**Commit**: 7db42586
