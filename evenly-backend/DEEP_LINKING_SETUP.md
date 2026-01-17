# Deep Linking Setup Guide

I've implemented a **smart app detection system** that tries to open your installed app first, then falls back to the app store if not installed.

## 🎯 How It Works

### User Flow:
```
1. User clicks "Get the App" button in email
   ↓
2. Opens smart redirect page (HTML)
   ↓
3. Attempts to open app with deep link
   ↓
4a. App installed? → Opens app directly with invitation! ✅
4b. App NOT installed? → Redirects to store to download ✅
```

### Technical Flow:
```
Email Button
   ↓
/api/app/download?token=abc123
   ↓
Serves appRedirect.html (JavaScript detects device)
   ↓
Tries: evenly://invitation/abc123 (Android)
   or: evenly://invitation/abc123 (iOS custom scheme)
   or: https://evenly.app/invitation/abc123 (iOS universal link)
   ↓
If app opens: Success! User sees invitation
If app doesn't open (2.5s timeout): Redirect to store
```

## 🔧 What I've Built (Backend Complete ✅)

### 1. Smart Redirect Endpoint
- **URL**: `/api/app/download?token={invitation_token}`
- **File**: `src/controllers/appRedirectController.ts`
- Detects device type
- Serves smart HTML page
- Passes invitation token

### 2. Smart Redirect HTML Page
- **File**: `src/templates/appRedirect.html`
- Attempts to open app via deep link
- Detects if app opened (visibility/blur events)
- Falls back to store after timeout
- Beautiful loading UI

### 3. Updated Email Template
- Passes invitation token to download link
- Link format: `https://your-backend.com/api/app/download?token=abc123`

### 4. Email Service Integration
- Updated `sendGroupInvitationEmail()` to accept token
- Token automatically included in download link

## 📱 What You Need to Configure (Mobile App Side)

### For Android (React Native + Expo)

#### 1. **Configure URL Scheme in `app.json`:**

```json
{
  "expo": {
    "scheme": "evenly",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "evenly",
              "host": "invitation",
              "pathPrefix": "/"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    }
  }
}
```

This allows URLs like `evenly://invitation/abc123` to open your app.

#### 2. **Handle Deep Links in App:**

In your root `_layout.tsx` or navigation setup:

```typescript
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);

    // Parse URL: evenly://invitation/abc123
    const { hostname, path } = Linking.parse(url);

    if (hostname === 'invitation' && path) {
      // Extract token from path (remove leading slash)
      const token = path.substring(1);
      console.log('Invitation token:', token);

      // Navigate to invitation acceptance screen
      router.push(`/invitations/${token}`);
    }
  };

  return (
    // Your app layout
  );
}
```

#### 3. **Test Android Deep Link:**

```bash
# Test on Android emulator or device
adb shell am start -W -a android.intent.action.VIEW \
  -d "evenly://invitation/test123" \
  com.nxtgenaidev.evenly
```

---

### For iOS (React Native + Expo)

#### 1. **Configure URL Scheme in `app.json`:**

```json
{
  "expo": {
    "scheme": "evenly",
    "ios": {
      "bundleIdentifier": "com.nxtgenaidev.evenly",
      "associatedDomains": [
        "applinks:evenly.app",
        "applinks:www.evenly.app"
      ]
    }
  }
}
```

#### 2. **Set Up Universal Links (Optional but Recommended):**

Universal links are iOS's preferred method (more reliable than custom schemes).

**a) Create `apple-app-site-association` file:**

On your **website** (`https://evenly.app`), create this file at the root:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.nxtgenaidev.evenly",
        "paths": [
          "/invitation/*"
        ]
      }
    ]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

**b) Serve the file:**
- Must be at: `https://evenly.app/.well-known/apple-app-site-association`
- Must be served with `Content-Type: application/json`
- Must be accessible without authentication

**c) Update backend redirect HTML:**

The HTML already tries both:
- Custom scheme: `evenly://invitation/abc123`
- Universal link: `https://evenly.app/invitation/abc123`

#### 3. **Handle Deep Links (Same as Android):**

Use the same code as Android section above.

#### 4. **Test iOS Deep Link:**

```bash
# Test custom scheme
xcrun simctl openurl booted "evenly://invitation/test123"

# Test universal link (must have real domain)
xcrun simctl openurl booted "https://evenly.app/invitation/test123"
```

---

## 🧪 Testing the Full Flow

### 1. **Test with App Installed:**

```bash
# 1. Install your app on device/emulator
# 2. Visit this URL in mobile browser:
https://your-backend.com/api/app/download?token=test123

# Expected behavior:
# - Shows "Opening Evenly App..." loading screen
# - After 0.5s, attempts to open app
# - App opens and navigates to invitation
```

### 2. **Test WITHOUT App Installed:**

```bash
# 1. Uninstall app
# 2. Visit same URL
https://your-backend.com/api/app/download?token=test123

# Expected behavior:
# - Shows "Opening Evenly App..." loading screen
# - After 2.5s timeout, shows "App Not Installed"
# - Redirects to Play Store (Android) or App Store (iOS)
```

### 3. **Test Email Flow:**

```bash
# 1. Send group invitation to test email
# 2. Open email on mobile device
# 3. Click "Get the App" button

# With app installed:
# - Opens app directly
# - Shows invitation acceptance screen

# Without app installed:
# - Shows loading screen
# - Redirects to store
```

---

## 🔍 Deep Link URL Formats

Your app should handle these URL formats:

### Custom Scheme (Android & iOS):
```
evenly://invitation/{token}
```

### Universal Link (iOS only):
```
https://evenly.app/invitation/{token}
```

### Examples:
```
evenly://invitation/abc123def456
https://evenly.app/invitation/abc123def456
```

---

## 📝 App Routing Structure

Create this screen in your mobile app:

```
/app/(tabs)/invitations/[token].tsx
```

Example implementation:

```typescript
// app/(tabs)/invitations/[token].tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch invitation details from API
    fetchInvitation(token);
  }, [token]);

  const fetchInvitation = async (token: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/invitations/validate/${token}`
      );
      const data = await response.json();
      setInvitation(data);
    } catch (error) {
      console.error('Failed to fetch invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    // Call your accept invitation API
    // Navigate to group screen
  };

  if (loading) {
    return <Text>Loading invitation...</Text>;
  }

  if (!invitation) {
    return <Text>Invalid invitation</Text>;
  }

  return (
    <View>
      <Text>You're invited to join {invitation.groupName}!</Text>
      <Button title="Accept Invitation" onPress={acceptInvitation} />
    </View>
  );
}
```

---

## 🚀 Deployment Checklist

### Backend (Already Done ✅):
- [x] Smart redirect endpoint
- [x] HTML template with detection logic
- [x] Email template with download button
- [x] Invitation token passing

### Mobile App (Your Todo):
- [ ] Configure URL scheme in `app.json`
- [ ] Add deep link handling in `_layout.tsx`
- [ ] Create invitation screen (`/invitations/[token].tsx`)
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] (Optional) Set up iOS Universal Links
- [ ] Test full email → app flow

### Website (Optional for Universal Links):
- [ ] Create `apple-app-site-association` file
- [ ] Serve at `https://evenly.app/.well-known/apple-app-site-association`
- [ ] Verify file is accessible

---

## 🐛 Troubleshooting

### Issue: App doesn't open, goes straight to store

**Possible Causes:**
1. URL scheme not configured in `app.json`
2. Deep link handler not implemented
3. Wrong bundle ID / package name

**Solution:**
- Verify `expo.scheme` in `app.json`
- Check deep link handler in `_layout.tsx`
- Ensure app is installed on device

---

### Issue: App opens but doesn't navigate to invitation

**Possible Causes:**
1. Deep link handler not parsing URL correctly
2. Invitation screen doesn't exist
3. Router navigation failing

**Solution:**
- Add console logs to `handleDeepLink` function
- Verify invitation screen route exists
- Check router setup

---

### Issue: iOS Universal Links not working

**Possible Causes:**
1. `apple-app-site-association` file not found
2. File served with wrong content type
3. Associated domains not configured

**Solution:**
- Verify file at `https://evenly.app/.well-known/apple-app-site-association`
- Check file returns `Content-Type: application/json`
- Verify `associatedDomains` in `app.json`
- Check Apple Developer Team ID

---

### Issue: Loading screen stuck, never redirects

**Possible Causes:**
1. JavaScript error in HTML template
2. Timeout not firing
3. Network issue

**Solution:**
- Open browser console (desktop) to check for errors
- Verify timeouts are set correctly
- Check network connection

---

## 📊 Detection Timeouts

The system uses these timeouts:

| Platform | Timeout | Reason |
|----------|---------|--------|
| Android | 2.5s | Intent system is fast |
| iOS | 3.0s | Universal links need more time |
| All | 5.0s | Show manual button as fallback |

You can adjust these in `appRedirect.html` if needed.

---

## 🎨 Customization

### Change Deep Link URL Scheme:

**1. Update `appRedirect.html`:**
```javascript
const ANDROID_DEEP_LINK = `yourapp://invitation/${invitationToken}`;
const IOS_CUSTOM_SCHEME = `yourapp://invitation/${invitationToken}`;
```

**2. Update `app.json`:**
```json
{
  "expo": {
    "scheme": "yourapp"
  }
}
```

---

## ✅ Summary

**Backend (Complete):**
- Smart detection system
- Deep link attempts
- Automatic fallback to stores
- Beautiful loading UI
- Invitation token passing

**Mobile App (Needs Configuration):**
- Add URL scheme to `app.json`
- Implement deep link handler
- Create invitation screen
- Test on devices

Once you configure the mobile app side, the full flow will work:
1. ✅ User clicks email button
2. ✅ Backend serves smart redirect page
3. ⏳ Page tries to open app (you configure this)
4. ✅ Fallback to store if app not installed

The hard part is done! Just configure the mobile app deep linking and you're ready to go! 🎉
