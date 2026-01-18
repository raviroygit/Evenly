# Personal Info Update & Phone Number Feature - Fix Summary

## Issues Fixed

### 1. Session Expired Error When Updating Personal Info (CRITICAL)

**Problem**: Users couldn't update their name or email for 2 days. The app showed "Session Expired - Please log out and log back in" error whenever they tried to save changes in the Personal Info modal.

**Root Cause**: PersonalInfoModal was doing a manual session test using cookie-based authentication (`sso_token` cookie) before calling the update API. This manual test failed because:
- Cookies don't work properly in React Native's fetch API
- The backend session might have expired (24-hour sessions)
- The test was unnecessary since the actual update API call uses Bearer token authentication

**Solution**: Removed the manual cookie-based session test (lines 55-77 in PersonalInfoModal.tsx). The `updateCurrentUser` API call already uses Bearer token authentication via `EvenlyApiClient`, which handles authentication automatically and properly.

### 2. Phone Number Not Displayed in Profile

**Problem**: User's phone number wasn't shown anywhere in the profile screen, even if they had one.

**Solution**: Added phone number display below email in the profile card. Phone number shows only if the user has one set (conditional rendering).

### 3. Phone Number Not Editable

**Problem**: Users couldn't add or update their phone number in the Personal Info modal.

**Solution**: Added phone number input field to the Personal Info modal, allowing users to add/edit their phone number alongside name and email.

---

## Changes Made

### File 1: PersonalInfoModal.tsx (`app/src/components/modals/PersonalInfoModal.tsx`)

#### A. Added Phone Number State (Lines 19-22, 24-30)

**Before**:
```typescript
const [name, setName] = useState(user?.name || '');
const [email, setEmail] = useState(user?.email || '');

useEffect(() => {
  if (visible) {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }
}, [visible, user?.name, user?.email]);
```

**After**:
```typescript
const [name, setName] = useState(user?.name || '');
const [email, setEmail] = useState(user?.email || '');
const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

useEffect(() => {
  if (visible) {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
  }
}, [visible, user?.name, user?.email, user?.phoneNumber]);
```

#### B. Removed Manual Cookie-Based Session Test (Lines 32-61)

**Before** (Lines 32-78):
```typescript
const handleSave = async () => {
  let payload: { name?: string; email?: string } = {};

  try {
    setSaving(true);

    // Build payload
    if (name && name !== user?.name) payload.name = name.trim();
    if (email && email !== user?.email) payload.email = email.trim();

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    // ❌ REMOVED: Manual session test with cookies
    console.log('[PersonalInfoModal] Testing session before update...');
    try {
      const testResponse = await fetch(`${ENV.EVENLY_BACKEND_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Cookie': `sso_token=${(await AuthStorage.getAuthData())?.ssoToken}`,
          'Content-Type': 'application/json',
        },
      });
      const testData = await testResponse.json();

      if (!testData.success) {
        Alert.alert('Session Expired', 'Please log out and log back in.');
        return;
      }
    } catch (testError) {
      console.error('[PersonalInfoModal] Session test failed:', testError);
    }
    // ❌ END OF REMOVED CODE

    const result = await EvenlyBackendService.updateCurrentUser(payload);
    // ... rest of code
  }
}
```

**After** (Lines 32-61):
```typescript
const handleSave = async () => {
  let payload: { name?: string; email?: string; phoneNumber?: string } = {};

  try {
    setSaving(true);

    // Build payload
    if (name && name !== user?.name) payload.name = name.trim();
    if (email && email !== user?.email) payload.email = email.trim();
    if (phoneNumber && phoneNumber !== user?.phoneNumber) payload.phoneNumber = phoneNumber.trim();

    console.log('[PersonalInfoModal] Preparing update:', {
      originalName: user?.name,
      newName: name,
      originalEmail: user?.email,
      newEmail: email,
      originalPhone: user?.phoneNumber,
      newPhone: phoneNumber,
      payload: payload
    });

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    // ✅ Direct API call - Bearer token auth handled automatically by EvenlyApiClient
    const result = await EvenlyBackendService.updateCurrentUser(payload);
    // ... rest of code
  }
}
```

**Key Changes**:
- Removed 23 lines of unnecessary manual session testing
- Added phoneNumber to payload type and building logic
- Direct API call now succeeds because EvenlyApiClient uses Bearer token automatically

#### C. Updated setUser to Include Phone Number (Lines 70-83)

**Before**:
```typescript
if (result.success) {
  const updated = result.data?.user;
  if (updated) {
    setUser({ id: updated.id, email: updated.email, name: updated.name });
  } else if (user) {
    setUser({ ...user, ...payload });
  }
}
```

**After**:
```typescript
if (result.success) {
  const updated = result.data?.user;
  if (updated) {
    setUser({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phoneNumber: updated.phoneNumber
    });
  } else if (user) {
    setUser({ ...user, ...payload });
  }
}
```

#### D. Added Phone Number Input Field (Lines 150-163)

**Added After Email Input**:
```tsx
<View style={styles.inputGroup}>
  <Text style={[styles.label, { color: colors.foreground }]}>Phone Number</Text>
  <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
    <TextInput
      style={[styles.input, { color: colors.foreground }]}
      value={phoneNumber}
      onChangeText={setPhoneNumber}
      placeholder="Enter your phone number"
      placeholderTextColor={colors.mutedForeground}
      keyboardType="phone-pad"
      autoCapitalize="none"
    />
  </View>
</View>
```

---

### File 2: GlassProfileCard.tsx (`app/src/components/ui/GlassProfileCard.tsx`)

#### A. Added phoneNumber Prop (Line 16)

**Before**:
```typescript
interface GlassProfileCardProps {
  name: string;
  email: string;
  initials: string;
  stats: ProfileStats;
  // ... other props
}
```

**After**:
```typescript
interface GlassProfileCardProps {
  name: string;
  email: string;
  phoneNumber?: string;  // NEW
  initials: string;
  stats: ProfileStats;
  // ... other props
}
```

#### B. Destructured phoneNumber (Line 30)

**Before**:
```typescript
export const GlassProfileCard: React.FC<GlassProfileCardProps> = ({
  name,
  email,
  initials,
  // ... other props
}) => {
```

**After**:
```typescript
export const GlassProfileCard: React.FC<GlassProfileCardProps> = ({
  name,
  email,
  phoneNumber,  // NEW
  initials,
  // ... other props
}) => {
```

#### C. Display Phone Number Below Email (Lines 93-97)

**Before**:
```tsx
<Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
  {email}
</Text>

<View style={styles.statsContainer}>
```

**After**:
```tsx
<Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
  {email}
</Text>
{phoneNumber && (
  <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
    {phoneNumber}
  </Text>
)}

<View style={styles.statsContainer}>
```

#### D. Updated Styles (Lines 173-184)

**Before**:
```typescript
userEmail: {
  fontSize: 16,
  fontWeight: '400',
  textAlign: 'center',
  marginBottom: 20,  // Large gap before stats
},
```

**After**:
```typescript
userEmail: {
  fontSize: 16,
  fontWeight: '400',
  textAlign: 'center',
  marginBottom: 4,  // Small gap before phone
},
userPhone: {
  fontSize: 14,
  fontWeight: '400',
  textAlign: 'center',
  marginBottom: 20,  // Large gap before stats
},
```

---

### File 3: UserProfile.tsx (`app/src/components/features/profile/UserProfile.tsx`)

**Before**:
```typescript
return (
  <GlassProfileCard
    name={user.name}
    email={user.email}
    initials={initials}
    stats={stats}
    onThemeToggle={onThemeToggle}
  />
);
```

**After**:
```typescript
return (
  <GlassProfileCard
    name={user.name}
    email={user.email}
    phoneNumber={user.phoneNumber}  // NEW
    initials={initials}
    stats={stats}
    onThemeToggle={onThemeToggle}
  />
);
```

---

### File 4: User Types (`app/src/types/index.ts`)

**Before**:
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  stats: UserStats;
}
```

**After**:
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;  // NEW
  avatar?: string;
  stats: UserStats;
}
```

---

### File 5: AuthContext.tsx (`app/src/contexts/AuthContext.tsx`)

**Before**:
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
}
```

**After**:
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  phoneNumber?: string;  // NEW
}
```

---

### File 6: EvenlyBackendService.ts (`app/src/services/EvenlyBackendService.ts`)

**Before**:
```typescript
static async updateCurrentUser(update: { name?: string; email?: string }): Promise<ApiResponse<any>> {
```

**After**:
```typescript
static async updateCurrentUser(update: { name?: string; email?: string; phoneNumber?: string }): Promise<ApiResponse<any>> {
```

---

## Why The Manual Session Test Failed

### The Problem:
PersonalInfoModal was doing this before updating:

```typescript
const testResponse = await fetch(`${ENV.EVENLY_BACKEND_URL}/auth/me`, {
  method: 'GET',
  headers: {
    'Cookie': `sso_token=${(await AuthStorage.getAuthData())?.ssoToken}`,
    'Content-Type': 'application/json',
  },
});
```

### Why It Failed:

1. **React Native Fetch + Cookies Don't Mix**:
   - React Native's `fetch` doesn't automatically send cookies
   - Manually setting `Cookie` header doesn't work the same as browser cookies
   - Cookie-based auth is unreliable in mobile environments

2. **Backend Session Expiry**:
   - Backend sessions expire after 24 hours
   - The `ssoToken` in storage might be stale
   - Manual test would fail even if Bearer token is valid

3. **Unnecessary Validation**:
   - The actual `updateCurrentUser` API call uses Bearer token via `EvenlyApiClient`
   - `EvenlyApiClient` automatically attaches `Authorization: Bearer <token>` header
   - If the token is invalid, the API call itself will fail (no need for pre-check)

### The Fix:

Just call the API directly. If authentication fails, the error handling will catch it:

```typescript
// ✅ This works - EvenlyApiClient handles Bearer token automatically
const result = await EvenlyBackendService.updateCurrentUser(payload);
```

---

## Authentication Flow Clarification

### How Mobile App Authentication Works:

1. **User logs in** → Backend returns `accessToken` and `refreshToken`
2. **Tokens stored** in secure storage via `AuthStorage`
3. **EvenlyApiClient interceptor** automatically reads `accessToken` and adds it to every request:
   ```typescript
   config.headers['Authorization'] = `Bearer ${accessToken}`;
   ```
4. **All API calls** use this Bearer token automatically - no manual setup needed
5. **If token expires** → Interceptor automatically tries to refresh using `refreshToken`
6. **If refresh fails** → User stays logged in with cached data (offline mode)

### Cookie vs Bearer Token:

| Method | Use Case | Works in Mobile? |
|--------|----------|------------------|
| **Cookie (sso_token)** | Web browser sessions | ❌ Unreliable in React Native |
| **Bearer Token** | Mobile API calls | ✅ Recommended for mobile apps |

**Bottom Line**: Mobile apps should use Bearer tokens, not cookies.

---

## Testing

### Test Case 1: Update Name Only
1. Open Profile → Personal Information
2. Change name from "John Doe" to "Jane Doe"
3. Click "Save Changes"
4. **Expected**: Success message, profile updates immediately
5. **Before Fix**: "Session Expired" error
6. **After Fix**: ✅ Success

### Test Case 2: Update Email Only
1. Open Profile → Personal Information
2. Change email
3. Click "Save Changes"
4. **Expected**: Success message, profile updates
5. **Before Fix**: "Session Expired" error
6. **After Fix**: ✅ Success

### Test Case 3: Add Phone Number
1. Open Profile → Personal Information
2. Enter phone number (e.g., "+1234567890")
3. Click "Save Changes"
4. **Expected**: Success, phone number appears in profile below email
5. **Before Fix**: Field didn't exist
6. **After Fix**: ✅ Success, phone displays in profile

### Test Case 4: Update All Fields
1. Open Profile → Personal Information
2. Change name, email, and phone
3. Click "Save Changes"
4. **Expected**: All fields update successfully
5. **After Fix**: ✅ Success

### Test Case 5: Profile Display
1. Go to Profile screen
2. **Expected Layout**:
   ```
   [Avatar]
   John Doe
   john@example.com
   +1234567890          ← Phone appears here if set

   [Stats: Groups, Total Spent, Owed]
   ```
3. **Before Fix**: Phone number not shown
4. **After Fix**: ✅ Phone number displays below email

---

## Visual Changes

### Personal Info Modal

**Before**:
```
┌────────────────────────────┐
│ Edit Personal Info         │
├────────────────────────────┤
│ Full Name                  │
│ [John Doe              ]   │
│                            │
│ Email                      │
│ [john@example.com      ]   │
│                            │
│ [Cancel]  [Save Changes]   │
└────────────────────────────┘
```

**After**:
```
┌────────────────────────────┐
│ Edit Personal Info         │
├────────────────────────────┤
│ Full Name                  │
│ [John Doe              ]   │
│                            │
│ Email                      │
│ [john@example.com      ]   │
│                            │
│ Phone Number           ← NEW│
│ [+1234567890           ]   │
│                            │
│ [Cancel]  [Save Changes]   │
└────────────────────────────┘
```

### Profile Screen

**Before**:
```
┌────────────────────────────┐
│         [Avatar]           │
│        John Doe            │
│    john@example.com        │
│                            │
│  [Groups] [Spent] [Owed]   │
└────────────────────────────┘
```

**After**:
```
┌────────────────────────────┐
│         [Avatar]           │
│        John Doe            │
│    john@example.com        │
│     +1234567890        ← NEW│
│                            │
│  [Groups] [Spent] [Owed]   │
└────────────────────────────┘
```

---

## Summary

✅ **Fixed**: Session expired error when updating personal info (2-day critical bug)
✅ **Added**: Phone number input field in Personal Info modal
✅ **Added**: Phone number display in Profile screen below email
✅ **Improved**: Removed 23 lines of unnecessary manual session testing code
✅ **Cleaner**: Direct API calls using proper Bearer token authentication
✅ **Types**: Updated all TypeScript interfaces to include phoneNumber

**Root Cause**: Manual cookie-based session test was failing in React Native environment
**Solution**: Use Bearer token authentication (already implemented in EvenlyApiClient)
**Result**: Users can now successfully update their personal information

---

## Files Modified

1. `app/src/components/modals/PersonalInfoModal.tsx`
   - Removed manual cookie-based session test
   - Added phone number state and input field
   - Updated payload and setUser to include phoneNumber

2. `app/src/components/ui/GlassProfileCard.tsx`
   - Added phoneNumber prop
   - Display phone number below email (conditional)
   - Updated styles

3. `app/src/components/features/profile/UserProfile.tsx`
   - Pass phoneNumber to GlassProfileCard

4. `app/src/types/index.ts`
   - Added phoneNumber to User interface

5. `app/src/contexts/AuthContext.tsx`
   - Added phoneNumber to User interface

6. `app/src/services/EvenlyBackendService.ts`
   - Updated updateCurrentUser to accept phoneNumber parameter

---

**Date**: 2026-01-18
**Status**: Complete ✅
**Bug Severity**: Critical (users blocked from updating profile for 2 days)
**Resolution Time**: Same day
