# Email Invitation Fix for Unregistered Users

## Problem
Unregistered users were not receiving group invitation emails. The email service was silently failing without notifying the system or users.

## Root Cause
The `emailService.ts` was catching all errors and returning without throwing, making it impossible to know when emails failed to send. This meant:
1. Email credentials could be misconfigured
2. SMTP could be failing
3. Invitations were created but emails weren't sent
4. Nobody knew there was a problem!

## Changes Made

### 1. **emailService.ts** - Email Service Now Throws Errors

**Before**: Errors were caught and logged, but never thrown
```typescript
catch (error: any) {
  console.warn('Email sending failed...');
  return; // Silently fail
}
```

**After**: Errors are thrown so system knows email failed
```typescript
catch (error: any) {
  console.error('💥 Error sending email:', error);

  if (error.code === 'EAUTH' || error.responseCode === 535) {
    console.error('🚨 SMTP authentication failed!');
    console.error('Current email config:', { host, port, user, secure });
    throw new Error(`SMTP_AUTH_FAILED: Cannot send email to ${to}`);
  }

  throw new Error(`EMAIL_SEND_FAILED: ${error.message}`);
}
```

**Benefits**:
- System now knows when emails fail
- SMTP auth errors are caught immediately
- Detailed error logging for debugging

### 2. **groupInvitationService.ts** - Better Error Handling

**Added**:
- Email status tracking (`emailSent` boolean)
- Email error tracking (`emailError` message)
- Prominent console logging when email fails
- Manual invitation link in logs if email fails

**Example Output When Email Fails**:
```
💥 FAILED to send invitation email to user@example.com: SMTP_AUTH_FAILED
⚠️  IMPORTANT: Invitation created but email NOT sent!
⚠️  User will NOT receive email. Please check email configuration.
⚠️  Or manually share this link: https://app.evenly.com/invite/abc123xyz
```

**API Response Changes**:
```json
{
  "success": true,
  "data": {
    "id": "invitation_id",
    "invitedEmail": "user@example.com",
    "token": "abc123xyz",
    "emailSent": false,  // ✅ NEW
    "emailError": "SMTP_AUTH_FAILED: Cannot send email"  // ✅ NEW
  },
  "message": "Invitation created but email failed to send. Please check email configuration.",
  "warning": "Email delivery failed - invitation link may need to be shared manually"  // ✅ NEW
}
```

### 3. **groupInvitationController.ts** - API Response Enhancement

**Added**:
- Warning field when email fails
- Dynamic message based on email status
- Makes it clear to frontend that email failed

## How to Fix Email Issues

### Step 1: Check Email Configuration

Check your `.env` file in `evenly-backend`:
```env
EMAIL_HOST=smtp.zoho.in
EMAIL_PORT=465
EMAIL_USER=no-reply@nxtgenaidev.com
EMAIL_PASS=your_actual_password_here
EMAIL_SECURE=true
```

### Step 2: Test Email Credentials

Use this command to test if your SMTP credentials work:
```bash
curl -X POST http://localhost:3001/api/invitations/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@gmail.com"}'
```

### Step 3: Check Logs

When invitation is sent, check console for:

**Success**:
```
✅ Invitation email sent successfully to user@example.com
```

**Failure**:
```
💥 FAILED to send invitation email to user@example.com
🚨 SMTP authentication failed!
⚠️  IMPORTANT: Invitation created but email NOT sent!
```

### Step 4: Common Issues and Fixes

#### Issue 1: SMTP Authentication Failed (EAUTH / 535)
**Symptom**: `SMTP_AUTH_FAILED: Cannot send email`

**Solutions**:
1. Check `EMAIL_USER` and `EMAIL_PASS` are correct
2. For Gmail:
   - Enable "Less secure app access" OR
   - Use App Password instead of regular password
3. For Zoho:
   - Check password is correct
   - Ensure account is not suspended

#### Issue 2: Connection Timeout
**Symptom**: `ETIMEDOUT` or `ECONNREFUSED`

**Solutions**:
1. Check `EMAIL_HOST` is correct (`smtp.zoho.in`, `smtp.gmail.com`, etc.)
2. Check `EMAIL_PORT` (usually 465 for SSL, 587 for TLS)
3. Check firewall/network allows SMTP connections
4. Try different port (465 vs 587)

#### Issue 3: Self-Signed Certificate Error
**Symptom**: `CERT_HAS_EXPIRED` or `DEPTH_ZERO_SELF_SIGNED_CERT`

**Solution**: Add `rejectUnauthorized: false` (development only)
```typescript
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.auth,
  tls: {
    rejectUnauthorized: false // Only for development!
  }
});
```

## Testing the Fix

### Test 1: Send Invitation to Registered User
```bash
# Login and get auth token
curl -X POST http://localhost:3001/api/groups/group-id/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invitedEmail": "registered-user@example.com"}'
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "emailSent": true
  },
  "message": "Invitation sent successfully"
}
```

### Test 2: Send Invitation to Unregistered User
```bash
curl -X POST http://localhost:3001/api/groups/group-id/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invitedEmail": "new-user@example.com"}'
```

**Expected Result** (if email works):
```json
{
  "success": true,
  "data": {
    "emailSent": true,
    "invitedEmail": "new-user@example.com"
  },
  "message": "Invitation sent successfully"
}
```

**Expected Result** (if email fails):
```json
{
  "success": true,
  "data": {
    "emailSent": false,
    "emailError": "SMTP_AUTH_FAILED: Cannot send email",
    "invitedEmail": "new-user@example.com",
    "token": "abc123xyz"
  },
  "message": "Invitation created but email failed to send.",
  "warning": "Email delivery failed - invitation link may need to be shared manually"
}
```

### Test 3: Check Email in Inbox
1. Send invitation to your own email
2. Check inbox (and spam folder!)
3. Email should have:
   - Subject: "You've been invited to join [Group Name] on Evenly"
   - Body: Invitation details with "Accept Invitation" button
   - Link: https://app.evenly.com/invite/[token]

## Frontend Integration

The mobile app should check the `emailSent` field and show appropriate UI:

```typescript
// After sending invitation
const response = await GroupInvitationService.sendInvitation(groupId, email);

if (response.data.emailSent === false) {
  // Show warning to user
  Alert.alert(
    'Email Failed',
    'Invitation created but email could not be sent. Share this link manually:',
    [
      { text: 'Copy Link', onPress: () => copyToClipboard(invitationLink) },
      { text: 'Share', onPress: () => shareInvitation(invitationLink) }
    ]
  );
} else {
  // Success
  Alert.alert('Success', 'Invitation email sent!');
}
```

## Monitoring

Add monitoring to track email failures:

```typescript
// Log to analytics when email fails
if (!invitation.emailSent) {
  analytics.track('email_failed', {
    type: 'group_invitation',
    email: invitedEmail,
    error: invitation.emailError
  });
}
```

## Rollback Plan

If this causes issues, revert these files:
1. `src/services/emailService.ts` - Lines 31-63
2. `src/services/groupInvitationService.ts` - Lines 85-111, 130-156
3. `src/controllers/groupInvitationController.ts` - Lines 28-39

## Summary

✅ **Emails now throw errors** - System knows when email fails
✅ **Better logging** - Clear console output when email fails
✅ **API response includes email status** - Frontend knows if email was sent
✅ **Manual link provided** - Can share invitation even if email fails
✅ **No breaking changes** - Invitation still created even if email fails

The key improvement: **Visibility into email failures** so you can fix the root cause!
