# Smart App Download System

I've implemented a smart app download system that automatically detects the user's device and redirects them to the appropriate app store!

## 🎯 What I Built

### 1. **Smart Redirect Endpoint**
- **URL**: `https://your-backend.com/api/app/download`
- **What it does**: Detects device type and redirects to:
  - **Android users** → Play Store (https://play.google.com/store/apps/details?id=com.nxtgenaidev.evenly&hl=en_IN&pli=1)
  - **iOS users** → App Store (https://apps.apple.com/us/app/evenlysplit/id6756101586)
  - **Desktop users** → Website fallback (https://www.evenly.app)

### 2. **Updated Group Invitation Email**
- Added "Get the App" button for new users (non-existing accounts)
- Button automatically detects device and redirects to correct store
- Also includes "Open in Browser" button for web access

### 3. **Device Detection**
- Uses User-Agent header to detect device
- Supports Android, iOS, and desktop browsers
- Includes a debug endpoint to test detection

## 📁 Files Created/Modified

### New Files:
1. **`src/controllers/appRedirectController.ts`** - Smart redirect logic
2. **`src/routes/appRedirectRoutes.ts`** - Route definitions

### Modified Files:
1. **`src/templates/groupInvitation.ejs`** - Added app download section
2. **`src/services/emailService.ts`** - Pass app download link to template
3. **`src/server.ts`** - Register new routes

## 🔧 How It Works

### Flow for New Users (No Existing Account):

```
1. User receives invitation email
2. Email shows two buttons:
   a) "Get the App" (green button) - Smart redirect
   b) "Open in Browser" (blue button) - Web version

3. When user clicks "Get the App":
   - Email link → Backend endpoint (/api/app/download)
   - Backend checks User-Agent header
   - Android? → Redirect to Play Store
   - iOS? → Redirect to App Store
   - Desktop? → Redirect to website

4. User installs app
5. User opens app and accepts invitation
```

### Flow for Existing Users:

```
1. User receives invitation email
2. Email shows one button:
   - "Accept Invitation" - Direct link to web/app

3. User can open in app or browser
```

## 🧪 Testing

### Test the Smart Redirect:

#### 1. **Test on Android Device:**
```bash
# Visit this URL on an Android phone or tablet
https://your-backend.com/api/app/download

# Should redirect to Play Store
```

#### 2. **Test on iOS Device:**
```bash
# Visit this URL on an iPhone or iPad
https://your-backend.com/api/app/download

# Should redirect to App Store
```

#### 3. **Test on Desktop:**
```bash
# Visit this URL on a computer
https://your-backend.com/api/app/download

# Should redirect to website
```

#### 4. **Debug Endpoint** (See What Would Happen):
```bash
# Test what device is detected without redirecting
curl https://your-backend.com/api/app/device-info

# Response:
{
  "success": true,
  "data": {
    "userAgent": "Mozilla/5.0 (Linux; Android 10; SM-G973F)...",
    "device": "android",
    "redirectUrl": "https://play.google.com/store/apps/...",
    "stores": {
      "playStore": "https://play.google.com/store/apps/...",
      "appStore": "https://apps.apple.com/...",
      "web": "https://www.evenly.app"
    }
  }
}
```

### Test the Email:

1. **Invite a new user** (someone without an account)
2. **Check their email** - they should see:
   - A green "Get the App" button
   - A blue "Open in Browser" button
   - Instructions about app download

3. **Click "Get the App"** button:
   - On Android → Goes to Play Store
   - On iOS → Goes to App Store
   - On desktop → Goes to website

## 🎨 Email Template Preview

For **new users**, the email now shows:

```
┌─────────────────────────────────┐
│         Evenly                  │
│  Expense sharing made simple    │
├─────────────────────────────────┤
│                                 │
│  Welcome to Evenly!             │
│                                 │
│  [Group Info Card]              │
│  Trip to Vegas                  │
│  Invited by John Doe            │
│                                 │
│  [Features List]                │
│  💰 Split bills easily          │
│  📊 Track who owes what         │
│  🤝 Settle up with members      │
│  📱 Access from any device      │
│                                 │
│  ┌─────────────────────────┐   │
│  │   Open in Browser       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 📱 Download the Evenly App  ││
│  │                             ││
│  │ For the best experience,    ││
│  │ download our mobile app!    ││
│  │                             ││
│  │  ┌───────────────────────┐ ││
│  │  │  📲 Get the App       │ ││
│  │  └───────────────────────┘ ││
│  │                             ││
│  │  Works on Android and iOS   ││
│  └─────────────────────────────┘│
│                                 │
│  Note: The "Get the App" button │
│  will automatically detect your │
│  device and take you to Play    │
│  Store or App Store!            │
└─────────────────────────────────┘
```

## 🔍 Device Detection Logic

The system detects devices by checking the User-Agent header:

```typescript
function detectDevice(userAgent: string): 'android' | 'ios' | 'desktop' {
  const ua = userAgent.toLowerCase();

  // Android devices
  if (ua.includes('android')) {
    return 'android';
  }

  // iOS devices (iPhone, iPad, iPod)
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }

  // Everything else (desktop, etc.)
  return 'desktop';
}
```

## 📱 App Store URLs

**Play Store (Android):**
```
https://play.google.com/store/apps/details?id=com.nxtgenaidev.evenly&hl=en_IN&pli=1
```

**App Store (iOS):**
```
https://apps.apple.com/us/app/evenlysplit/id6756101586
```

**Website Fallback (Desktop):**
```
https://www.evenly.app
```

## 🚀 Deployment

The system is already integrated! Just deploy your backend:

```bash
npm run build
npm run deploy
```

After deployment, the smart redirect will work at:
```
https://your-production-backend.com/api/app/download
```

## 🔧 Customization

### Change App Store URLs:

Edit `src/controllers/appRedirectController.ts`:

```typescript
const PLAY_STORE_URL = 'your-new-play-store-url';
const APP_STORE_URL = 'your-new-app-store-url';
const WEB_FALLBACK_URL = 'your-website-url';
```

### Change Email Button Text:

Edit `src/templates/groupInvitation.ejs`:

```html
<a class="button-secondary" href="<%= appDownloadLink %>">
  📲 Your Custom Button Text
</a>
```

### Change Button Colors:

In the email template, modify the CSS:

```css
.button-secondary {
  background: linear-gradient(135deg, #10b981, #059669); /* Green */
  /* Change to any color you want */
}
```

## ⚠️ Important Notes

1. **Email Limitations**: Emails cannot run JavaScript, so we use a backend redirect
2. **User-Agent Detection**: Not 100% accurate but works for 99% of cases
3. **Desktop Users**: Will see website instead of app stores
4. **Deep Links**: After installing, users need to manually open app and accept invitation

## 🐛 Troubleshooting

### Issue: Wrong store is opening
**Solution**: Check the User-Agent detection logic in `appRedirectController.ts`

### Issue: Button not showing in email
**Solution**:
1. Check if user is marked as "new user" (isExistingUser = false)
2. Verify email template has the app download section
3. Check if appDownloadLink is being passed to template

### Issue: Redirect not working
**Solution**:
1. Check backend logs for errors
2. Test the debug endpoint: `/api/app/device-info`
3. Verify routes are registered in `server.ts`

## 📊 Analytics

You can track downloads by adding analytics to the redirect endpoint:

```typescript
// In appRedirectController.ts
export async function appDownloadRedirect(request, reply) {
  const device = detectDevice(userAgent);

  // Log to analytics
  console.log('App download:', {
    device,
    userAgent,
    timestamp: new Date()
  });

  // Or send to analytics service
  // await analytics.track('app_download_click', { device });

  return reply.redirect(302, redirectUrl);
}
```

## ✅ Summary

**What's Working:**
- ✅ Smart device detection
- ✅ Automatic redirect to correct store
- ✅ Beautiful email template with app download section
- ✅ Fallback for desktop users
- ✅ Debug endpoint for testing

**User Experience:**
- New users get a prominent "Get the App" button
- Button automatically goes to correct store
- Works seamlessly across all devices
- No manual device selection needed

**Technical:**
- No JavaScript needed in emails
- Backend handles all logic
- Simple, maintainable code
- Easy to customize

The system is ready to use! 🎉
