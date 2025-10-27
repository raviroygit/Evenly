# reCAPTCHA Setup Guide for Evenly Web

## Problem Fixed ✅
The red warning text "This reCAPTCHA is for testing purposes only" has been removed by:
- Removing the test reCAPTCHA key
- Making CAPTCHA optional and only showing when properly configured
- Adding a development notice instead of showing the ugly test CAPTCHA

## Current State
- ✅ **No more red warning text**
- ✅ **Form works without CAPTCHA** (for development)
- ✅ **Clean, professional appearance**
- ✅ **Easy to enable CAPTCHA when ready**

## How to Enable Production reCAPTCHA

### Step 1: Get reCAPTCHA Keys
1. Go to https://www.google.com/recaptcha/admin
2. Click "Create" to add a new site
3. Fill in the form:
   - **Label**: "Evenly Web Support Form"
   - **reCAPTCHA type**: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - `yourdomain.com` (for production)
     - `www.yourdomain.com` (if you use www)
4. Accept the Terms of Service
5. Click "Submit"

### Step 2: Configure Environment Variables
Add to your `.env.local` file:
```bash
# Enable reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_ENABLED=true
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

### Step 3: Update Backend (if needed)
If your backend needs to verify the CAPTCHA token, you'll also need the **Secret Key** from reCAPTCHA admin panel.

## Benefits of This Approach
- ✅ **No ugly test warnings**
- ✅ **Professional appearance**
- ✅ **Easy to enable/disable**
- ✅ **Works in development and production**
- ✅ **Proper error handling**

## Testing
- **Without CAPTCHA**: Form works normally, shows development notice
- **With CAPTCHA**: Form requires CAPTCHA verification before submission
- **Production**: Clean, professional CAPTCHA widget

The form now looks professional and works perfectly! 🎉
