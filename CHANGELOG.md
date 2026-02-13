# Changelog

All notable changes to Evenly will be documented in this file.

## [2.0.0] - 2026-02-13

### ✨ Added
- **Native Date/Time Pickers for Expenses**
  - Beautiful native calendar picker for date selection
  - Native time picker for selecting exact time of expense
  - Platform-specific UI (iOS spinner, Android calendar)

- **Date/Time Selection for Transactions (Books/Khata)**
  - Select custom date when recording "You Gave" or "You Got" transactions
  - Select exact time for transaction records
  - Full date/time display in transaction history

- **Future Date Protection**
  - Prevents selection of future dates
  - Restricts time selection to current time on today's date
  - Allows any time for past dates

- **OTA Updates Configuration**
  - Over-the-air updates enabled for faster bug fixes
  - Proper runtime version management for bare workflow

### 🐛 Fixed
- **Transaction Balance Display Bug**
  - Fixed critical bug where balances showed ₹0 or NaN in transaction list
  - Resolved double formatting issue (was formatting on storage AND display)
  - Dashboard summary card now shows correct balances

- **Expense Time Default Bug**
  - Fixed time always defaulting to 5:30 AM
  - Time now correctly defaults to current time
  - Better timezone handling with Date objects

- **Backend Error Handling**
  - Enhanced error logging in expense creation
  - Exposed actual PostgreSQL error details for debugging
  - Better error tracking and reporting

### 🔧 Changed
- Date storage changed from string to Date object for better timezone handling
- Improved date/time picker UI with native components
- Updated Android versionCode from 13 to 14
- Updated app slug from "evenly-split" to "evenly" for EAS compatibility

### 🛠️ Technical
- Installed `@react-native-community/datetimepicker@8.4.4`
- Installed `react-native-web` for Expo export compatibility
- Added unique constraint to `user_balances(userId, groupId)` in database
- Created migration script for safe production deployment
- Fixed eas.json configuration for bare workflow
- Changed runtimeVersion from policy to hardcoded value

### 📚 Documentation
- Added DATE_TIME_PICKER_FIX.md
- Added TRANSACTION_DATE_TIME_FIX.md
- Added TRANSACTION_BALANCE_FIX.md
- Added EXPENSE_FIX_DEPLOYMENT.md
- Added RELEASE_NOTES_2.0.0.md

---

## [1.9.0] - 2026-02-XX

### Added
- Currency preference in profile reflects app-wide
- Real-time currency updates like language
- Email i18n: prefers recipient language + currency
- Profile loading indicators for language/currency modals

### Fixed
- Net balance issue in group screen
- Currency selection UX improvements

---

## Version History

- **2.0.0** (Feb 13, 2026) - Date/time pickers, balance fix, OTA updates
- **1.9.0** (Feb XX, 2026) - Currency preferences, email i18n
- **1.8.0** - Profile improvements
- **1.7.0** - Group features
- **1.6.0** - Books/Khata
- **1.5.0** - Initial release

---

**Semantic Versioning**: This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version (2.0.0) - Incompatible API changes or major feature additions
- **MINOR** version (x.1.0) - Backwards-compatible functionality additions
- **PATCH** version (x.x.1) - Backwards-compatible bug fixes
