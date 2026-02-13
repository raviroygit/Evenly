# Evenly v2.0.0 Release Notes

## What's New in Version 2.0.0

### Smart Date & Time Selection

**Expense Date/Time Picker**
- Native Calendar Picker: Tap the date field to open a beautiful native calendar - no more typing dates manually
- Time Selection: Select the exact time when your expense occurred with the native time picker
- Accurate Defaults: Time now defaults to your current time (not 5:30 AM)
- Platform-Native UI: iOS spinner-style picker, Android calendar-style picker

**Transaction Date/Time Selection (Books/Khata)**
- NEW: Select custom date and time when recording transactions
- Accurate Records: Record exactly when "You Gave" or "You Got" money
- Full Control: Choose any past date and time for your transaction records
- Backend Integration: Date and time are saved and displayed in transaction history

### Future Date Protection

- No Future Dates: Can't select dates that haven't happened yet
- Smart Time Limits: On today's date, you can only select times up to now
- Past Flexibility: For past dates, select any time you need

### Bug Fixes

**Transaction Balance Display**
- Fixed critical bug where transaction balances showed ₹0 or NaN
- Balances now display correctly in transaction list
- Dashboard summary card shows accurate balances

**Backend Improvements**
- Enhanced error logging for expense creation failures
- Added database constraint to prevent duplicate balance records
- Better debugging and error tracking

### Over-The-Air Updates

- OTA Updates Enabled: Receive app updates instantly without downloading from stores
- Faster Updates: Bug fixes and improvements delivered directly to your device
- Background Downloads: Updates download automatically, apply on next restart

## User Experience Improvements

### Expense Creation Flow
- Before: Type date as text → Time always 5:30 AM → Submit
- After: Tap date → Beautiful calendar → Tap time → Select time → Submit

### Transaction Recording (Books/Khata)
- Before: Amount + Description → Server assigns current time
- After: Amount + Description + Select date → Select time → Submit

## UI/UX Enhancements

- Native calendar and time pickers match your device's style
- Clear visual feedback when selecting dates and times
- Smooth animations and transitions
- Consistent experience across iOS and Android

## Technical Improvements

### Performance
- Optimized date/time picker rendering
- Improved transaction list performance
- Better memory management for date objects

### Stability
- Enhanced database constraints prevent data corruption
- Better error handling and logging
- Input validation for date/time selection
- Timezone-aware date handling

## Compatibility

- iOS: iOS 13.0 and above
- Android: Android 6.0 (API 23) and above
- Supported Devices: iPhone 6s and newer, most Android devices

## Installation Size

- iOS: ~50 MB
- Android: ~30 MB (APK), ~25 MB (AAB)

## Getting Started

After updating to v2.0.0:

1. Expenses: When adding an expense, tap the date field to see the new calendar picker
2. Transactions: When recording "You Gave" or "You Got", select the exact date and time
3. Balances: Check your Books/Khata - balances now display correctly

## Known Issues

None at this time. If you encounter any issues, please report them through:
- In-app feedback
- Email: support@evenly.app
- GitHub: https://github.com/raviroygit/Evenly/issues

## Thank You

Thank you for using Evenly! We're constantly working to improve your experience. This update brings significant improvements to date/time handling and fixes critical bugs.

---

## For App Store Listings

### Short Description (170 characters)
New: Native date/time pickers for expenses and transactions. Fixed balance display bug. Select exact times for all your records.

### What's New (App Store)
Version 2.0.0 brings major improvements!

NEW FEATURES:
- Native calendar picker for expenses
- Time selection for expenses
- Date & time picker for transactions (Books/Khata)
- Future date protection

BUG FIXES:
- Fixed transaction balance showing ₹0
- Fixed time defaulting to 5:30 AM
- Improved error handling

IMPROVEMENTS:
- Faster, smoother date selection
- Better timezone handling
- Enhanced performance

### Play Store Description (500 characters)
Version 2.0.0 is here!

New: Native date/time pickers for expenses and transactions
Fixed: Transaction balances showing incorrect values
Fixed: Time now defaults to current time, not 5:30 AM
New: Protection against future dates
Improved: Better performance and error handling

Tap the date field to see the beautiful new calendar picker. Select exact times for all your records in Books/Khata!

---

**Version**: 2.0.0
**Build Date**: February 13, 2026
**Release Type**: Major Update
**Update Method**: App Store / Play Store + OTA Updates

**Questions?** Contact us at support@evenly.app
