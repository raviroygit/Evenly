# Email I18n Implementation Guide

## What Has Been Done

### 1. Database Schema Update
✅ Added `preferredLanguage` field to users table (`evenly-backend/src/db/schema.ts`)
- Default value: `'en'`
- Stores user's language preference (en, hi, etc.)

### 2. Translation Files Created
✅ Created email translation files:
- `evenly-backend/src/i18n/email/en.json` - English translations
- `evenly-backend/src/i18n/email/hi.json` - Hindi translations

These files contain translations for all email types:
- Group invitations
- Expense notifications (add/update/delete)
- Khata transactions (add/update/delete)
- Customer added/deleted
- Group joined
- New member joined

### 3. Translation Utility
✅ Created `evenly-backend/src/i18n/emailTranslator.ts` with:
- `t(lang, keyPath, params)` - Translate function with parameter substitution
- `getUserLanguage(user)` - Get user's preferred language with fallback to English

### 4. Updated Email Service
✅ Updated `sendGroupInvitationEmail` function as example implementation
- Accepts optional `recipientUser` parameter with language preference
- Uses translation utility to get localized text
- Creates HTML email with translated content

## What Needs To Be Done

### Step 1: Update Database
Run migration to add `preferred_language` column to existing users table:

```sql
ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en';
```

Or create a Drizzle migration:
```bash
cd evenly-backend
npm run generate:migration
npm run migrate
```

### Step 2: Update Remaining Email Functions

Apply the same pattern used in `sendGroupInvitationEmail` to these functions:

1. **sendExpenseNotificationEmail** - Line 119
2. **sendExpenseUpdatedEmail** - Line 455
3. **sendExpenseDeletedEmail** - Line 502
4. **sendKhataTransactionEmail** - Line 371
5. **sendTransactionUpdatedEmail** - Line 597
6. **sendTransactionDeletedEmail** - Line 649
7. **sendCustomerAddedEmail** - Line 545
8. **sendCustomerDeletedEmail** - Line 568
9. **sendGroupJoinedEmail** - Line 699
10. **sendNewMemberJoinedEmail** - Line 733

#### Pattern for Each Function:

```typescript
// 1. Add recipientUser parameter
export async function sendEmailFunction(
  // ... existing parameters
  recipientUser?: { preferredLanguage?: string | null }
): Promise<void> {
  try {
    // 2. Get language
    const lang = recipientUser ? getUserLanguage(recipientUser) : 'en';

    // 3. Translate subject
    const subject = t(lang, 'emailType.subject', { param1, param2 });

    // 4. Create HTML with translated strings
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      ...
      ${t(lang, 'emailType.greeting', { name })}
      ...
      </html>
    `;

    await sendEmail(email, subject, htmlBody);
  } catch {
    // Don't throw
  }
}
```

### Step 3: Update Service Layer to Pass User Language

When calling email functions, fetch and pass the user's language:

#### Example: In `groupInvitationService.ts`

```typescript
// Before sending invitation email, get recipient user
const recipientUser = await db
  .select()
  .from(users)
  .where(eq(users.email, inviteeEmail))
  .limit(1);

await sendGroupInvitationEmail(
  inviteeEmail,
  group.name,
  inviter.name,
  invitationLink,
  isExistingUser,
  invitation.token,
  recipientUser[0] // Pass user object with preferredLanguage
);
```

Apply similar pattern in:
- `expenseService.ts` - When notifying about expense changes
- `khataService.ts` - When notifying about transaction changes
- `groupService.ts` - When notifying about group events

### Step 4: Update Frontend to Save Language Preference

#### Add API Endpoint to Update User Language

Create endpoint in `userController.ts`:

```typescript
export async function updateUserLanguage(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.id;
  const { language } = request.body as { language: string };

  // Validate language
  if (!['en', 'hi'].includes(language)) {
    return reply.status(400).send({ error: 'Invalid language' });
  }

  await db
    .update(users)
    .set({ preferredLanguage: language })
    .where(eq(users.id, userId));

  return reply.send({ success: true });
}
```

#### Update Frontend Language Selector

In `ProfileScreen.tsx` (or wherever language is changed):

```typescript
const handleLanguageChange = async (newLanguage: string) => {
  try {
    // Update locally
    await i18n.changeLanguage(newLanguage);
    await AsyncStorage.setItem('userLanguage', newLanguage);

    // Update in backend
    await EvenlyBackendService.updateUserLanguage(newLanguage);

    showToast('success', t('profile.languageChanged'));
  } catch (error) {
    showToast('error', t('errors.tryAgain'));
  }
};
```

### Step 5: Testing

Test each email type in both languages:

1. **Group Invitation**
   - Invite user with English preference → Should receive English email
   - Invite user with Hindi preference → Should receive Hindi email

2. **Expense Notifications**
   - Add/update/delete expense → Members receive emails in their preferred language

3. **Khata Transactions**
   - Add/update/delete transaction → Customer receives email in their language

4. **Group Events**
   - Join group, new member → Emails in recipient's language

## Priority Order

Implement in this order for maximum impact:

1. **High Priority** (Most used):
   - Group invitation
   - Expense notification
   - Khata transaction

2. **Medium Priority**:
   - Expense updated/deleted
   - Customer added/deleted
   - Transaction updated/deleted

3. **Low Priority**:
   - Group joined
   - New member joined

## Quick Reference

### Translation Key Paths

All keys follow this pattern: `emailType.key`

Examples:
- `groupInvitation.subject`
- `expenseNotification.greeting`
- `khataTransaction.currentBalance`
- `common.downloadApp`

### Adding New Languages

To add a new language (e.g., Spanish 'es'):

1. Create `evenly-backend/src/i18n/email/es.json`
2. Copy structure from `en.json`
3. Translate all values
4. Update database schema to allow 'es' value
5. Update frontend language picker

## Notes

- **Fallback**: If user language is not set or translation is missing, English is used
- **Parameters**: Use `{paramName}` in translations for dynamic values
- **HTML Emails**: Keep HTML structure similar across languages for consistent rendering
- **Testing**: Always test with real email clients (Gmail, Outlook, etc.) to ensure proper rendering

## Implementation Checklist

- [x] Add `preferredLanguage` to users schema
- [x] Create translation files (en.json, hi.json)
- [x] Create translation utility (emailTranslator.ts)
- [x] Update emailService imports
- [x] Update sendGroupInvitationEmail (example)
- [ ] Run database migration
- [ ] Update remaining 9 email functions
- [ ] Update service layer to fetch and pass user language
- [ ] Add API endpoint to update user language
- [ ] Update frontend language selector to save to backend
- [ ] Test all email types in both languages

## Estimated Time

- Database migration: 5 minutes
- Update remaining email functions: 2-3 hours (10 functions × 15-20 mins each)
- Update service layer: 1-2 hours (find all email calls, add user fetch)
- Frontend API integration: 30 minutes
- Testing: 1-2 hours

**Total: 5-8 hours** for complete implementation

## Support

If you need help:
1. Check the `sendGroupInvitationEmail` function as reference
2. Ensure translation keys match between emailService calls and JSON files
3. Test with console.log to verify language is being passed correctly
4. Check email spam folder if emails aren't arriving
