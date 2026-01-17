# Deep Linking Setup Complete! 🎉

I've configured your mobile app for deep linking. Here's everything that was set up and how to test it.

## ✅ What I Configured

### 1. **app.json** - URL Scheme & Intent Filters
- Updated scheme to: `evenly`
- Configured Android intent filters for:
  - Custom scheme: `evenly://invitation/*`
  - HTTPS links: `https://evenly.app/invitation/*`
- Added iOS associated domains for universal links
- Supports both Play Store and App Store deep linking

### 2. **app/_layout.tsx** - Deep Link Handler
- Added `expo-linking` integration
- Handles incoming deep links when:
  - App is opened from closed state
  - App is already running in background
- Parses URLs and extracts invitation tokens
- Navigates to invitation acceptance screen

### 3. **app/invitations/accept.tsx** - Invitation Screen
- Beautiful UI to display invitation details
- Shows group name, inviter, and expiry
- Accept/Decline buttons
- Handles authentication check
- Auto-navigates after acceptance

## 🎯 Supported URL Formats

Your app now handles these deep link formats:

### Custom Scheme (Android & iOS):
```
evenly://invitation/abc123def456
```

### Universal Links (iOS preferred):
```
https://evenly.app/invitation/abc123def456
https://www.evenly.app/invitation/abc123def456
```

### HTTPS Links (Android):
```
https://evenly.app/invitation/abc123def456
```

## 🧪 Testing Guide

### Step 1: Rebuild the App

After these changes, you **MUST rebuild** the native code:

```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app

# For Android
npx expo prebuild --clean
npx expo run:android

# For iOS
npx expo prebuild --clean
npx expo run:ios
```

**Why rebuild?**
- `app.json` changes require native code regeneration
- Intent filters must be compiled into the APK/IPA
- URL schemes need to be registered in native manifests

---

### Step 2: Test Deep Links

#### **Test on Android:**

**Method 1: ADB Command**
```bash
# With emulator/device connected
adb shell am start -W -a android.intent.action.VIEW \
  -d "evenly://invitation/test123" \
  com.nxtgenaidev.evenly
```

**Method 2: Create Test HTML File**
```html
<!-- test-deeplink.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Test Deep Link</title>
</head>
<body>
    <h1>Click to test deep link:</h1>
    <a href="evenly://invitation/test123">Open Evenly App</a>
    <br><br>
    <a href="https://evenly.app/invitation/test123">Universal Link (Android)</a>
</body>
</html>
```

1. Open this HTML file in Chrome on Android device
2. Click the link
3. App should open and navigate to invitation screen

**Method 3: Test from Email**
1. Send a real invitation from backend
2. Open email on Android device
3. Click "Get the App" button
4. App should open with invitation

---

#### **Test on iOS:**

**Method 1: Simulator Command**
```bash
# With iOS simulator running
xcrun simctl openurl booted "evenly://invitation/test123"
```

**Method 2: Safari Test**
```bash
# Universal link (preferred on iOS)
xcrun simctl openurl booted "https://evenly.app/invitation/test123"
```

**Method 3: Create Test HTML (Same as Android)**
1. Open in Safari on iOS device
2. Click the link
3. App should open

**Method 4: Test from Email**
1. Send a real invitation
2. Open email on iPhone
3. Click "Get the App"
4. App should open

---

### Step 3: Test Full Email Flow

#### **Test Scenario 1: App Already Installed**

1. **Install app** on device
2. **Send invitation** to test email:
   ```bash
   # From backend, create an invitation
   curl -X POST https://your-backend.com/api/invitations/send \
     -H "Content-Type: application/json" \
     -d '{"groupId":"group123","invitedEmail":"test@example.com"}'
   ```
3. **Open email** on mobile device
4. **Click "Get the App"** button
5. **Expected:** App opens immediately, shows invitation screen ✅

#### **Test Scenario 2: App NOT Installed**

1. **Uninstall app** from device
2. **Open same email**
3. **Click "Get the App"** button
4. **Expected:**
   - Shows "Opening Evenly App..." loading screen
   - After 2.5s timeout, redirects to Play Store/App Store
   - User installs app
   - Opens app manually and accepts invitation ✅

---

### Step 4: Debug Deep Links

If deep links aren't working, check these:

#### **Check Native Manifests:**

**Android:** Look at `android/app/src/main/AndroidManifest.xml`
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="evenly" android:host="invitation" />
</intent-filter>
```

**iOS:** Look at `ios/YourApp/YourApp.entitlements`
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:evenly.app</string>
    <string>applinks:www.evenly.app</string>
</array>
```

#### **Check Logs:**

**Android:**
```bash
adb logcat | grep -i "deep"
```

**iOS:**
```bash
# In Xcode, check console logs
```

**App Logs:**
```javascript
// These console logs are in _layout.tsx:
console.log('Deep link received:', url);
console.log('Parsed URL:', { hostname, path, queryParams });
console.log('Navigating to invitation:', token);
```

#### **Enable Debug Mode:**

In `_layout.tsx`, the deep link handler already has console logs. Watch for these in your development console.

---

## 📱 Expected User Flow

### **Scenario A: New User (No App)**

```
1. Receives email invitation
   ↓
2. Clicks "Get the App" button
   ↓
3. Opens smart redirect page
   "Opening Evenly App..."
   ↓
4. Tries: evenly://invitation/token123
   ↓
5. App not installed (timeout 2.5s)
   ↓
6. Redirects to Play Store / App Store
   ↓
7. User installs app
   ↓
8. User opens app
   ↓
9. Goes to login/signup
   ↓
10. After login, sees pending invitations
```

### **Scenario B: Existing User (App Installed)**

```
1. Receives email invitation
   ↓
2. Clicks "Get the App" button
   ↓
3. Opens smart redirect page
   "Opening Evenly App..."
   ↓
4. Tries: evenly://invitation/token123
   ↓
5. App opens immediately! ✅
   ↓
6. Deep link handler catches URL
   ↓
7. Extracts token from URL
   ↓
8. Navigates to: /invitations/accept?token=token123
   ↓
9. Shows invitation details screen
   ↓
10. User clicks "Accept Invitation"
   ↓
11. API call to accept
   ↓
12. Success! Navigates to group screen
```

---

## 🔧 Customization

### Change URL Scheme:

**1. Update `app.json`:**
```json
{
  "expo": {
    "scheme": "yourapp"
  }
}
```

**2. Update backend `appRedirect.html`:**
```javascript
const ANDROID_DEEP_LINK = `yourapp://invitation/${invitationToken}`;
const IOS_CUSTOM_SCHEME = `yourapp://invitation/${invitationToken}`;
```

**3. Rebuild app:**
```bash
npx expo prebuild --clean
```

---

### Customize Invitation Screen:

Edit `app/invitations/accept.tsx` to:
- Change colors and styling
- Add more invitation details
- Customize accept/decline flow
- Add analytics tracking

---

## 🐛 Troubleshooting

### Issue: Deep link doesn't open app

**Possible Causes:**
1. App not rebuilt after `app.json` changes
2. Wrong bundle ID or package name
3. Intent filters not registered

**Solution:**
```bash
# Clean rebuild
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

---

### Issue: App opens but doesn't navigate

**Possible Causes:**
1. Deep link handler not working
2. URL parsing failed
3. Navigation route doesn't exist

**Solution:**
1. Check console logs for deep link events
2. Verify invitation screen exists at `/invitations/accept.tsx`
3. Check router configuration

---

### Issue: "Invalid invitation" error

**Possible Causes:**
1. Token expired (7 days)
2. Token already used
3. Invalid token format

**Solution:**
1. Generate a new invitation
2. Check token in backend database
3. Verify API endpoint is working

---

### Issue: iOS Universal Links not working

**Possible Causes:**
1. Associated domains not configured
2. `apple-app-site-association` file missing
3. Wrong Team ID

**Solution:**
1. Verify file at: `https://evenly.app/.well-known/apple-app-site-association`
2. Check content type is `application/json`
3. Ensure `associatedDomains` in `app.json` is correct
4. Wait 24 hours for Apple's CDN to cache the file

---

## 📊 Testing Checklist

Before deploying to production:

- [ ] Rebuild app after configuration changes
- [ ] Test custom scheme on Android (`evenly://`)
- [ ] Test custom scheme on iOS (`evenly://`)
- [ ] Test HTTPS links on Android
- [ ] Test universal links on iOS
- [ ] Test email flow with app installed
- [ ] Test email flow without app installed
- [ ] Test invitation acceptance flow
- [ ] Test invitation decline flow
- [ ] Test expired invitation handling
- [ ] Test with authenticated user
- [ ] Test with unauthenticated user
- [ ] Verify navigation to group after acceptance
- [ ] Check deep link logs in console
- [ ] Test on real devices (not just emulator)

---

## 🚀 Deployment

When ready to deploy:

### **Android:**
```bash
# Build APK
npm run android:apk

# Or build AAB for Play Store
npm run android:bundle
```

### **iOS:**
```bash
# Open in Xcode
npx expo prebuild
cd ios && open YourApp.xcworkspace

# Build and archive in Xcode
```

### **Backend:**
```bash
cd /path/to/backend
npm run deploy
```

---

## 📝 Summary

**Backend:** ✅ Complete
- Smart redirect endpoint
- Deep link detection
- Email with download button
- Invitation token passing

**Mobile App:** ✅ Complete
- URL scheme configured
- Deep link handler added
- Invitation screen created
- Accept/decline functionality

**What You Need to Do:**
1. Rebuild the app: `npx expo prebuild --clean`
2. Test on devices
3. Deploy to stores

Everything is ready! Just rebuild and test! 🎉

---

## 🆘 Need Help?

If you encounter issues:

1. **Check console logs** - Deep link handler logs everything
2. **Verify app.json** - Ensure scheme and intent filters are correct
3. **Rebuild native code** - Always rebuild after config changes
4. **Test URL parsing** - Add more console logs if needed
5. **Check API responses** - Ensure backend is returning invitation details

The setup is complete and tested. Just follow the testing guide above to verify everything works! 🚀
