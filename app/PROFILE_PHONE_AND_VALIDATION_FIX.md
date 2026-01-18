# Profile Phone Number Display and Validation Fixes

**Date**: 2026-01-18
**Status**: ✅ COMPLETED

## Issues Fixed

### 1. Phone Number Not Displaying in Profile ❌ → ✅
**Problem**: User has phone number in database but it's not showing in the profile screen.

**Root Cause**: The `AuthService.getCurrentUser()` method was not including `phoneNumber` field when returning the user object.

**Solution**: Added `phoneNumber` to the user object in `AuthService.getCurrentUser()` method.

**File Modified**: `app/src/services/AuthService.ts:168`

```typescript
// Before (Missing phoneNumber)
return {
  id: response.user.id,
  email: response.user.email,
  name: response.user.name,
  stats: { groups: 0, totalSpent: 0, owed: 0 },
};

// After (Fixed - includes phoneNumber)
return {
  id: response.user.id,
  email: response.user.email,
  name: response.user.name,
  phoneNumber: response.user.phoneNumber,
  stats: { groups: 0, totalSpent: 0, owed: 0 },
};
```

---

### 2. Phone Number Not Pre-filled in Personal Info Modal ❌ → ✅
**Problem**: When editing personal info, phone number field was empty even though user has one.

**Root Cause**: Since `AuthService.getCurrentUser()` wasn't returning `phoneNumber`, the AuthContext didn't have it, so the modal couldn't pre-fill it.

**Solution**: Fixed by including `phoneNumber` in `getCurrentUser()` (same fix as issue #1). The modal already had the code to pre-fill (line 27 in PersonalInfoModal.tsx).

**Files Verified**:
- `app/src/components/modals/PersonalInfoModal.tsx:20, 27` - Already handles phoneNumber correctly
- `app/src/contexts/AuthContext.tsx:9` - User interface includes phoneNumber
- `app/src/types/index.ts:5` - User type includes phoneNumber

---

### 3. Missing Input Validation ❌ → ✅
**Problem**: No validation for email and phone number fields in Personal Info modal.

**Solution**: Added comprehensive validation for all fields in `PersonalInfoModal.tsx`.

**File Modified**: `app/src/components/modals/PersonalInfoModal.tsx`

**Validation Added**:

#### Name Validation:
- **Required**: Name cannot be empty
- **Min Length**: Must be at least 2 characters
- **Error Messages**:
  - "Name is required"
  - "Name must be at least 2 characters"

#### Email Validation:
- **Required**: Email cannot be empty
- **Format**: Must match email regex pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- **Error Messages**:
  - "Email is required"
  - "Please enter a valid email address"

#### Phone Number Validation:
- **Optional**: Phone number is not required
- **Format (if provided)**: Must match phone regex pattern
  - Supports formats: `+1234567890`, `123-456-7890`, `(123) 456-7890`, etc.
- **Regex**: `^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$`
- **Error Message**: "Please enter a valid phone number"

**Validation Functions Added**:
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};
```

---

### 4. No Visual Error Feedback ❌ → ✅
**Problem**: No error messages displayed when validation fails.

**Solution**: Added error state and visual feedback for each input field.

**Changes Made**:

1. **Error State**: Added `errors` state to track validation errors
   ```typescript
   const [errors, setErrors] = useState<{ name?: string; email?: string; phoneNumber?: string }>({});
   ```

2. **Red Border on Error**: Input containers show red border when validation fails
   ```typescript
   borderColor: errors.name ? '#FF3B30' : colors.border
   ```

3. **Error Text Display**: Shows error message below each invalid field
   ```typescript
   {errors.name && (
     <Text style={styles.errorText}>{errors.name}</Text>
   )}
   ```

4. **Clear Error on Change**: Error clears when user starts typing
   ```typescript
   onChangeText={(text) => {
     setName(text);
     if (errors.name) setErrors({ ...errors, name: undefined });
   }}
   ```

5. **Error Style**: Added red error text styling
   ```typescript
   errorText: {
     fontSize: 12,
     color: '#FF3B30',
     marginTop: 4,
   }
   ```

---

### 5. Login Screen Navigation Issue (Already Fixed) ✅
**Problem Reported**: User mentioned app navigates to OTP page even when API fails.

**Verification**: Checked `LoginScreen.tsx` - It already has proper validation:
- Email validation before requesting OTP (lines 29-36)
- Only navigates to OTP page if `result.success === true` (line 44-45)
- Shows error message if API fails (line 48)
- Has comprehensive error handling (lines 50-63)

**Status**: No changes needed - working as expected.

---

## Complete Code Changes

### 1. AuthService.ts (app/src/services/AuthService.ts)

**Line 168**: Added `phoneNumber` field to user object

```typescript
async getCurrentUser(): Promise<User | null> {
  try {
    const { data: response } = await this.makeRequest('/auth/me', {});
    if (response.success && response.user) {
      await this.syncUserWithEvenlyBackend(response.user);

      return {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        phoneNumber: response.user.phoneNumber,  // ← ADDED
        stats: { groups: 0, totalSpent: 0, owed: 0 },
      };
    }
    return null;
  } catch (error) {
    console.error('Get current user failed:', error);
    return null;
  }
}
```

---

### 2. PersonalInfoModal.tsx (app/src/components/modals/PersonalInfoModal.tsx)

**Added Validation (Lines 23-43)**:
```typescript
const [errors, setErrors] = useState<{ name?: string; email?: string; phoneNumber?: string }>({});

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};
```

**Updated handleSave with Validation (Lines 45-86)**:
```typescript
const handleSave = async () => {
  let payload: { name?: string; email?: string; phoneNumber?: string } = {};
  const newErrors: { name?: string; email?: string; phoneNumber?: string } = {};

  try {
    setSaving(true);
    setErrors({});

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone number (optional)
    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone && !validatePhoneNumber(trimmedPhone)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Stop if validation errors exist
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    // Build payload
    if (trimmedName && trimmedName !== user?.name) payload.name = trimmedName;
    if (trimmedEmail && trimmedEmail !== user?.email) payload.email = trimmedEmail;
    if (trimmedPhone && trimmedPhone !== user?.phoneNumber) payload.phoneNumber = trimmedPhone;

    // ... rest of save logic
  }
};
```

**Updated Input Fields with Error Display (Lines 165-234)**:
```typescript
<View style={styles.inputGroup}>
  <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
  <View style={[styles.inputContainer, {
    backgroundColor: colors.background,
    borderColor: errors.name ? '#FF3B30' : colors.border  // ← Red border on error
  }]}>
    <TextInput
      style={[styles.input, { color: colors.foreground }]}
      value={name}
      onChangeText={(text) => {
        setName(text);
        if (errors.name) setErrors({ ...errors, name: undefined });  // ← Clear error
      }}
      placeholder="Enter your name"
      placeholderTextColor={colors.mutedForeground}
      autoCapitalize="words"
    />
  </View>
  {errors.name && (
    <Text style={styles.errorText}>{errors.name}</Text>  // ← Error message
  )}
</View>

{/* Email and Phone inputs follow same pattern */}
```

**Added Error Text Style (Line 267-271)**:
```typescript
errorText: {
  fontSize: 12,
  color: '#FF3B30',
  marginTop: 4,
},
```

---

## Testing Checklist

### Phone Number Display
- [x] Login with account that has phone number
- [x] Check profile screen shows phone number below email
- [x] Verify phone number appears in profile card
- [ ] Test with account that doesn't have phone number (should not show field)

### Personal Info Modal
- [x] Open personal info modal
- [x] Verify all fields (name, email, phone) are pre-filled
- [ ] Test name validation:
  - [ ] Try to save empty name → Error: "Name is required"
  - [ ] Try to save 1 character name → Error: "Name must be at least 2 characters"
  - [ ] Save valid name → Success
- [ ] Test email validation:
  - [ ] Try to save empty email → Error: "Email is required"
  - [ ] Try to save invalid email (no @) → Error: "Please enter a valid email address"
  - [ ] Try to save invalid email (no domain) → Error: "Please enter a valid email address"
  - [ ] Save valid email → Success
- [ ] Test phone validation:
  - [ ] Leave phone empty → No error (optional field)
  - [ ] Enter invalid phone (letters) → Error: "Please enter a valid phone number"
  - [ ] Enter valid phone (+1234567890) → Success
  - [ ] Enter valid phone (123-456-7890) → Success
  - [ ] Enter valid phone ((123) 456-7890) → Success
- [ ] Test error clearing:
  - [ ] Trigger validation error
  - [ ] Start typing in field
  - [ ] Verify error message disappears
  - [ ] Verify red border disappears
- [ ] Test save button:
  - [ ] Disabled while saving
  - [ ] Shows "Saving..." text
  - [ ] Re-enables after completion

### Login Screen
- [x] Verify email validation works
- [x] Verify OTP page only shows on success
- [x] Verify error shown on API failure
- [x] No changes needed - already working

---

## Files Modified

1. **app/src/services/AuthService.ts**
   - Added `phoneNumber` to user object in `getCurrentUser()` method
   - **Lines changed**: 168

2. **app/src/components/modals/PersonalInfoModal.tsx**
   - Added `errors` state for validation feedback
   - Added `validateEmail()` function
   - Added `validatePhoneNumber()` function
   - Updated `handleSave()` with validation logic
   - Updated all input fields with error borders and messages
   - Added `errorText` style
   - **Lines changed**: 23, 34-43, 45-86, 165-234, 267-271

---

## Summary

✅ **Phone number now displays in profile** - Fixed by adding `phoneNumber` to `AuthService.getCurrentUser()`
✅ **Phone number pre-fills in edit modal** - Works automatically after fixing getCurrentUser
✅ **Email validation added** - Required field with format validation
✅ **Phone validation added** - Optional field with format validation (if provided)
✅ **Name validation added** - Required field with minimum length
✅ **Visual error feedback** - Red borders, error messages, clear-on-type
✅ **Login screen verified** - Already has proper validation and error handling

All user-reported issues have been fixed!
