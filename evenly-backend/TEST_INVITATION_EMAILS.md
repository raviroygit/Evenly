# Testing Group Invitation Emails - Step by Step Guide

## Current Status ✅

**Email Configuration**: ✅ Working (Test email sent successfully!)
- SMTP Host: smtp.zoho.in
- SMTP Port: 465
- Email: no-reply@nxtgenaidev.com
- Password: Verified and working

**Code Changes**: ✅ Complete
- Email service now throws errors properly
- Better logging for debugging
- API response includes email status

**Problem**: Server needs to be restarted to use new code changes

---

## Step 1: Restart Evenly Backend Server

### If Running Locally:

```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/evenly-backend

# Stop any existing process
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Start development server
npm run dev
```

**Wait for**:
```
Server running on http://0.0.0.0:3002
Database connected
```

### If Deployed to Google Cloud Run:

```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/evenly-backend

# Deploy updated code
gcloud run deploy evenly-backend \
  --source . \
  --region us-central1 \
  --project nextgen-ai-dev
```

---

## Step 2: Test Group Invitation Email

### Using Mobile App:

1. **Login to mobile app**
2. **Create or open a group**
3. **Tap "Invite Members"**
4. **Enter email**: `ravi140398@gmail.com` (or any test email)
5. **Send invitation**

**Expected Results**:

✅ **Success** - You should see:
- "Invitation sent successfully"
- Email arrives in inbox within 1-2 minutes

❌ **If Email Fails** - You should see:
- Warning message: "Email failed to send"
- Option to copy/share invitation link manually

### Using API Directly:

```bash
# Get auth token first
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'

# Send invitation
curl -X POST http://localhost:3002/api/groups/GROUP_ID/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invitedEmail": "ravi140398@gmail.com"}'
```

**Expected Response**:

✅ **Success**:
```json
{
  "success": true,
  "data": {
    "id": "inv_xxx",
    "invitedEmail": "ravi140398@gmail.com",
    "emailSent": true,
    "token": "abc123"
  },
  "message": "Invitation sent successfully"
}
```

❌ **If Email Failed**:
```json
{
  "success": true,
  "data": {
    "id": "inv_xxx",
    "invitedEmail": "ravi140398@gmail.com",
    "emailSent": false,
    "emailError": "SMTP_AUTH_FAILED: ...",
    "token": "abc123"
  },
  "message": "Invitation created but email failed to send",
  "warning": "Email delivery failed - share link manually"
}
```

---

## Step 3: Check Server Logs

### What to Look For:

**✅ Email Success**:
```
✅ Invitation email sent successfully to ravi140398@gmail.com
```

**❌ Email Failure**:
```
💥 FAILED to send invitation email to ravi140398@gmail.com
🚨 SMTP authentication failed!
⚠️  IMPORTANT: Invitation created but email NOT sent!
⚠️  Or manually share this link: https://...
```

### Where to Check Logs:

**Local Server**: Check terminal where `npm run dev` is running

**Google Cloud Run**:
```bash
gcloud run services logs read evenly-backend \
  --region us-central1 \
  --project nextgen-ai-dev \
  --limit 50
```

---

## Step 4: Verify Email Received

### Check Inbox:

1. **Go to**: Gmail inbox for test email
2. **Look for**: Email from "Evenly <no-reply@nxtgenaidev.com>"
3. **Subject**: "You've been invited to join [Group Name] on Evenly"
4. **Content Should Have**:
   - Group name
   - Inviter name
   - "Accept Invitation" button
   - App download link

### Check Spam Folder:

If email not in inbox, **check spam folder** first!

### Email Not Arriving?

If no email after 5 minutes:
1. Check server logs for error messages
2. Verify email address is correct
3. Try sending to different email (Gmail, Outlook, Yahoo)
4. Check Zoho account status at mail.zoho.in

---

## Troubleshooting

### Issue 1: "Module not found" or "Cannot find package"

**Solution**: Install dependencies
```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/evenly-backend
npm install
```

### Issue 2: "Port 3002 already in use"

**Solution**: Kill existing process
```bash
lsof -ti:3002 | xargs kill -9
npm run dev
```

### Issue 3: "Database connection failed"

**Solution**: Check EVENLY_DATABASE_URL in .env
```bash
# Test database connection
psql "postgresql://neondb_owner:npg_iZpsY7tNer3a@ep-little-king-ad1lt01t-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Issue 4: Still No Emails After Restart

**Check Email Template Exists**:
```bash
ls -la /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/evenly-backend/src/templates/
```

Should have: `groupInvitation.ejs`

**Test Email Directly**:
```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/evenly-backend
node test-email.js
```

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Server restarted with new code
- [ ] Server logs show "Server running on..."
- [ ] Can login to mobile app
- [ ] Can create/open a group
- [ ] Can send invitation to registered user
- [ ] Can send invitation to unregistered user
- [ ] Email arrives in inbox (check within 2 minutes)
- [ ] Email has correct content (group name, inviter, link)
- [ ] Clicking link in email works
- [ ] Server logs show "✅ Invitation email sent successfully"
- [ ] No error messages in server logs

---

## Summary

**What Was Fixed**:
1. ✅ Email service now throws errors (was silently failing)
2. ✅ Better error logging (can see exactly what's wrong)
3. ✅ API returns email status (frontend knows if email sent)
4. ✅ Manual invitation link provided (can share if email fails)

**What You Need to Do**:
1. 🔄 Restart evenly-backend server
2. 📧 Send a test invitation
3. 📬 Check email inbox
4. ✅ Verify email received

**If Still Having Issues**:
- Check server logs for specific error message
- Share the error message so I can help debug
- Can use manual invitation link as workaround

---

## Quick Test Script

Run this to test everything at once:

```bash
#!/bin/bash
echo "🧪 Testing Evenly Backend Email Service"
echo ""

cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/evenly-backend

echo "1️⃣ Testing email credentials..."
node test-email.js
echo ""

echo "2️⃣ Checking if server is running..."
if lsof -ti:3002 > /dev/null 2>&1; then
  echo "✅ Server is running on port 3002"
else
  echo "❌ Server is NOT running"
  echo "   Run: npm run dev"
fi
echo ""

echo "✅ Test complete!"
echo "Now send a test invitation from the mobile app"
```

Save as `test-all.sh`, make executable: `chmod +x test-all.sh`, then run: `./test-all.sh`
