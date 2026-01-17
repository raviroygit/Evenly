# 🎉 Deep Linking Setup Complete!

Your Evenly app now has full deep linking support! Users can click email buttons and the app will open automatically if installed, or redirect to the store if not.

## ✅ What's Been Configured

### Backend (/evenly-backend)
- [x] Smart redirect endpoint: `/api/app/download`
- [x] Deep link detection HTML page
- [x] Email template with app download button
- [x] Invitation token passing
- [x] Device detection (Android/iOS/Desktop)

### Mobile App (/app)
- [x] URL scheme: `evenly`
- [x] Android intent filters
- [x] iOS associated domains
- [x] Deep link handler in `_layout.tsx`
- [x] Invitation acceptance screen: `/invitations/accept.tsx`

## 🚀 Quick Start - Testing

### 1. Rebuild the Mobile App (REQUIRED)

```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app

# For Android
npx expo prebuild --clean
npx expo run:android

# For iOS
npx expo prebuild --clean
npx expo run:ios
```

**⚠️ IMPORTANT:** You MUST rebuild after configuration changes!

### 2. Test Deep Link

**On Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "evenly://invitation/test123" \
  com.nxtgenaidev.evenly
```

**On iOS:**
```bash
xcrun simctl openurl booted "evenly://invitation/test123"
```

### 3. Test Full Email Flow

1. Send a group invitation from your app
2. Open email on mobile device
3. Click "Get the App" button
4. **With app installed:** App opens immediately ✅
5. **Without app:** Redirects to store → User installs → Opens app ✅

## 📱 How It Works

### User Flow:
```
Email → Click "Get the App" Button
  ↓
Backend serves smart redirect page
  ↓
JavaScript tries: evenly://invitation/{token}
  ↓
App Installed?
  ├─ YES → Opens app directly to invitation! 🎉
  └─ NO  → Wait 2.5s → Redirect to Play Store/App Store
```

### URL Formats Supported:
```
evenly://invitation/abc123         (Custom scheme - Android & iOS)
https://evenly.app/invitation/abc123  (Universal link - iOS preferred)
```

## 📂 Files Modified

### Backend:
- `src/templates/appRedirect.html` - Smart detection page
- `src/controllers/appRedirectController.ts` - Endpoint logic
- `src/routes/appRedirectRoutes.ts` - Routes
- `src/services/emailService.ts` - Pass tokens to email
- `src/services/groupInvitationService.ts` - Pass tokens
- `src/templates/groupInvitation.ejs` - Download button UI
- `src/server.ts` - Register routes

### Mobile App:
- `app.json` - URL scheme & intent filters
- `app/_layout.tsx` - Deep link handler
- `app/invitations/accept.tsx` - Invitation screen (NEW)

## 🧪 Testing Checklist

- [ ] Rebuild app with `npx expo prebuild --clean`
- [ ] Test custom scheme: `evenly://invitation/test`
- [ ] Test email button with app installed
- [ ] Test email button without app installed
- [ ] Test invitation acceptance flow
- [ ] Test on real Android device
- [ ] Test on real iOS device

## 📖 Documentation

Detailed guides created:

1. **Backend:**
   - `/evenly-backend/DEEP_LINKING_SETUP.md` - Full backend setup guide
   - `/evenly-backend/SMART_APP_DOWNLOAD_README.md` - Redirect system docs

2. **Mobile App:**
   - `/app/DEEP_LINKING_TESTING.md` - Complete testing guide

## 🎯 Next Steps

### 1. Test Locally
```bash
# Rebuild app
cd /path/to/app
npx expo prebuild --clean
npx expo run:android  # or run:ios

# Test deep link
adb shell am start -W -a android.intent.action.VIEW \
  -d "evenly://invitation/test123" \
  com.nxtgenaidev.evenly
```

### 2. Deploy Backend
```bash
cd /path/to/backend
npm run deploy
```

### 3. Build & Deploy App
```bash
# Android
npm run android:bundle  # For Play Store

# iOS
# Build in Xcode for App Store
```

## 🎨 Key Features

✅ **Smart Detection** - Tries to open app first, falls back to store
✅ **Device Detection** - Automatic Android/iOS/Desktop detection
✅ **Beautiful UI** - Loading screen with gradient and animations
✅ **Token Passing** - Deep link includes invitation token
✅ **Auto-Navigation** - Opens directly to invitation screen
✅ **Error Handling** - Graceful fallbacks if anything fails
✅ **Timeout Logic** - 2.5s for Android, 3s for iOS
✅ **Universal Links** - iOS preferred method supported
✅ **Intent Filters** - Android deep link support
✅ **Offline Fallback** - Manual store button after 5s

## 🔗 Email Button Behavior

### For New Users (No Existing Account):
```
┌─────────────────────────────────┐
│  📱 Download the Evenly App     │
│  For the best experience!       │
│                                 │
│  ┌───────────────────────────┐ │
│  │  📲 Get the App           │ │ ← Smart redirect
│  └───────────────────────────┘ │
│                                 │
│  Works on both Android & iOS    │
└─────────────────────────────────┘
```

### For Existing Users:
```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐ │
│  │  Accept Invitation        │ │ ← Direct link
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

## 🛠️ Customization

### Change App Store URLs:
Edit `src/controllers/appRedirectController.ts`:
```typescript
const PLAY_STORE_URL = 'your-play-store-url';
const APP_STORE_URL = 'your-app-store-url';
```

### Change URL Scheme:
1. Edit `app.json`: `"scheme": "yourapp"`
2. Edit `appRedirect.html`: Update deep link URLs
3. Rebuild: `npx expo prebuild --clean`

### Customize Colors:
Edit `app/invitations/accept.tsx` - All styles at bottom

## 🐛 Troubleshooting

### App doesn't open from link:
```bash
# 1. Check if app rebuilt
npx expo prebuild --clean

# 2. Verify scheme in app.json
cat app.json | grep scheme

# 3. Test with ADB
adb shell am start -W -a android.intent.action.VIEW \
  -d "evenly://invitation/test" com.nxtgenaidev.evenly
```

### Deep link opens app but doesn't navigate:
- Check console logs in `_layout.tsx`
- Verify invitation screen exists
- Check router configuration

### Email button goes to wrong store:
- Check User-Agent detection in backend
- Test device info endpoint: `/api/app/device-info`

## 📊 Flow Diagram

```
User Opens Email
       ↓
Clicks "Get the App"
       ↓
Backend: /api/app/download?token=abc123
       ↓
Serves appRedirect.html
       ↓
JavaScript Detects Device
       ↓
   [Android]              [iOS]
       ↓                     ↓
evenly://invitation/   evenly://invitation/
   abc123                 abc123
       ↓                     ↓
   App Opens?           App Opens?
   ├─ Yes → Navigate   ├─ Yes → Navigate
   └─ No → Play Store  └─ No → App Store
```

## ✨ User Experience

**Before:** Users click email → Go to store → Download → Open app → Manually find invitation

**After:** Users click email → App opens directly to invitation! 🎉

Or if not installed: Click email → Go to store → Download → Open app (invitation waiting)

## 📝 Technical Details

### Backend Endpoint:
- URL: `POST /api/app/download?token={invitation_token}`
- Response: HTML page with JavaScript detection
- Timeout: 2.5s (Android), 3s (iOS)

### Deep Link Handler:
- Location: `app/_layout.tsx`
- Listens: `expo-linking` events
- Parses: URL hostname and path
- Navigates: `router.push('/invitations/accept?token={token}')`

### Invitation Screen:
- Location: `app/invitations/accept.tsx`
- Fetches: Invitation details from API
- Actions: Accept, Decline
- Auth Check: Redirects to login if needed

## 🎯 Success Criteria

Your deep linking is working when:

✅ Android: Click link → App opens → Shows invitation
✅ iOS: Click link → App opens → Shows invitation
✅ Without app: Click link → Store opens
✅ Email flow: Click button → App opens (or store)
✅ Token parsing: Invitation details load correctly
✅ Navigation: Auto-navigate to group after acceptance

## 🚢 Ready to Ship!

Everything is configured and ready. Just:

1. Rebuild app: `npx expo prebuild --clean`
2. Test flows above
3. Deploy backend: `npm run deploy`
4. Build app for stores
5. Submit to Play Store / App Store

Your users will love the seamless experience! 🎉

---

**Need Help?** Check the detailed guides:
- `DEEP_LINKING_TESTING.md` - Complete testing guide
- `DEEP_LINKING_SETUP.md` - Technical details

**Questions?** All code includes extensive console logging for debugging!
