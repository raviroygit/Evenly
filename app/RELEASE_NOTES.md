# Evenly - Release Notes

## Version [Your Version Number]

### 🎉 What's New

#### Enhanced User Experience
- **Pull-to-Refresh Everywhere**: Swipe down to refresh data on Home, Groups, Books, and Profile screens with beautiful custom animations
- **Improved Loading States**: All screens now show elegant skeleton loaders while data is loading, providing better visual feedback
- **Real-time Data Updates**: Automatic refresh when you create groups, add expenses, or make transactions

#### New Modals & Viewers
- **Customer Details Modal**: Tap on customer avatars to view comprehensive information including contact details, balance, and account history
- **Customers List Modal**: Quick access to all your Khata customers from the Home screen
- **Groups List Modal**: Easily select groups when adding expenses
- **Transaction Detail Modal**: View full transaction details with images, dates, amounts, and balance information
- **Full-Screen Image Viewer**: View transaction images in full screen with pinch-to-zoom and double-tap functionality

#### Khata Summary Improvements
- **Live Updates**: Khata Summary card on Home screen now refreshes automatically when data changes
- **Loading Indicators**: Shows skeleton loader during refresh for better user feedback
- **Tap to View**: Tap the Khata Summary card to see your complete customer list

#### Count Badges & Accuracy
- **Accurate Counts**: All count badges now show the correct total numbers (not just loaded items)
- **Groups Badge**: Shows total number of groups you're part of
- **Activity Badge**: Displays total activity count across all your transactions

#### Better Group Management
- **Improved Skeleton Loaders**: Group loading states now perfectly match the actual card design
- **Smoother Animations**: Better transitions when creating, editing, or deleting groups
- **Auto-Refresh**: Group list automatically updates when you make changes

### 🐛 Bug Fixes

#### Fixed Issues
- Fixed phone number display formatting in customer details
- Fixed input validation for phone numbers and email addresses
- Fixed count badges showing incorrect numbers during pagination
- Fixed skeleton loaders not matching actual UI design
- Fixed Khata Summary not refreshing on data changes
- Fixed pull-to-refresh not working on Home screen

#### Performance Improvements
- Optimized data loading with better cache management
- Improved scroll performance on all list screens
- Reduced unnecessary API calls with smart caching
- Better memory management for images

### 🔧 Technical Improvements

#### Architecture
- Implemented proper total count tracking in infinite scroll
- Added custom pull-to-refresh components across all screens
- Improved state management for real-time updates
- Better error handling and retry mechanisms

#### UI/UX Polish
- Consistent glassmorphism design throughout the app
- Theme-aware skeleton loaders (dark/light mode)
- Improved touch targets and button sizes
- Better spacing and padding across all screens

### 📝 Developer Notes
- Added comprehensive documentation for transaction detail features
- Improved code organization and component structure
- Better TypeScript typing throughout the codebase
- Enhanced error logging for debugging

---

## App Store Description

### Short Description (80 characters max)
Split expenses easily with friends and family. Track who owes what, settle up!

### Full Description

**Evenly - The Smart Way to Split Bills**

Stop the awkward money conversations! Evenly makes splitting expenses with friends, roommates, and family incredibly simple and stress-free.

**KEY FEATURES:**

💰 **Smart Expense Splitting**
- Split bills equally or by custom amounts
- Track who paid and who owes
- Support for multiple currencies
- Instant balance calculations

👥 **Group Management**
- Create unlimited groups for different occasions
- Add friends, family, or roommates
- Invite members via email
- Track group expenses separately

📒 **Khata (Credit Book)**
- Maintain personal credit books
- Track customer transactions
- Add transaction images for records
- View complete transaction history

📊 **Dashboard & Analytics**
- See your financial overview at a glance
- Track total groups and balances
- View recent activity feed
- Monitor what you owe and are owed

🎨 **Beautiful Design**
- Modern glassmorphism UI
- Dark and light mode support
- Smooth animations and transitions
- Intuitive and easy to use

🔄 **Real-time Updates**
- Pull-to-refresh on all screens
- Automatic data synchronization
- Live balance calculations
- Instant notifications

📸 **Transaction Records**
- Add images to transactions
- Full-screen image viewer with zoom
- Keep receipts for reference
- Easy record management

**PERFECT FOR:**
- Roommates splitting rent and utilities
- Friends sharing vacation expenses
- Couples managing joint expenses
- Groups organizing events
- Small businesses tracking customer credits

**WHY CHOOSE EVENLY?**
✓ Simple and intuitive interface
✓ No ads, no hidden fees
✓ Secure data storage
✓ Offline mode support
✓ Regular updates and improvements

**PRIVACY & SECURITY**
Your financial data is encrypted and stored securely. We never share your information with third parties.

Download Evenly today and make splitting expenses effortless!

---

## Play Store Description

### Short Description (80 characters)
Split expenses easily with friends. Track bills, settle up, stay organized!

### Full Description

**Evenly - Split Bills & Track Expenses**

Make splitting bills fun and easy! Evenly helps you manage shared expenses with friends, family, and roommates without the awkwardness.

**WHAT YOU CAN DO:**

🎯 **Split Expenses**
• Divide bills equally or by custom amounts
• Track who paid and who owes what
• Multiple split types: equal, percentage, shares, exact
• Automatic balance calculations

👨‍👩‍👧‍👦 **Manage Groups**
• Create groups for trips, roommates, or events
• Invite members via email
• Track expenses by group
• See member balances instantly

📒 **Khata Feature**
• Maintain digital credit books
• Track customer transactions
• Add photos of bills/receipts
• Complete transaction history

📈 **Dashboard**
• View your financial summary
• See all groups at a glance
• Track recent activity
• Monitor balances

✨ **NEW IN THIS VERSION:**
• Pull-to-refresh on all screens
• Beautiful skeleton loading animations
• Customer details modal
• Full-screen image viewer
• Improved count badges
• Better Khata Summary updates
• Enhanced performance

🎨 **DESIGN**
• Beautiful modern interface
• Dark and light themes
• Smooth animations
• Glassmorphism effects

**USE CASES:**
→ Split rent with roommates
→ Share vacation costs
→ Manage couple expenses
→ Organize event costs
→ Track business credits

**FREE & SECURE**
✓ No ads or hidden costs
✓ Secure data encryption
✓ Privacy-first approach
✓ Works offline

Download now and simplify your shared expenses!

---

## What's New (Short Version for App Stores)

**Version [X.X.X] - Latest Update**

NEW FEATURES:
• Pull-to-refresh on all screens with custom animations
• Full-screen image viewer for transaction photos
• Customer details modal with complete information
• Improved Khata Summary with live updates
• Accurate count badges showing total items

IMPROVEMENTS:
• Better loading states with skeleton loaders
• Enhanced performance and responsiveness
• Smoother animations and transitions
• Automatic data refresh when making changes

BUG FIXES:
• Fixed phone number formatting
• Fixed count badges showing wrong numbers
• Fixed skeleton loaders not matching UI
• Fixed Khata Summary not refreshing properly

Thank you for using Evenly! Please rate us if you enjoy the app.

---

## Technical Changelog (For Internal Use)

### Commit: f0a1bfa1 - Add modals, image viewer, and additional improvements
**Files Changed**: 17 files, +1,961 insertions, -45 deletions

**New Components:**
- `CustomersListModal.tsx` - Modal for displaying customer list
- `GroupsListModal.tsx` - Group selection modal for adding expenses
- `TransactionDetailModal.tsx` - Detailed transaction view with images
- `ImageViewer.tsx` - Full-screen image viewer with zoom/pan

**Updated Components:**
- `DashboardStats.tsx` - Added loading states
- `BooksScreen.tsx` - Integrated pull-to-refresh
- `ProfileScreen.tsx` - Added pull-to-refresh
- `GlassListCard.tsx` - Improved styling
- `AddTransactionModal.tsx` - Better validation
- `CustomerFilterModal.tsx` - Enhanced filters
- `EvenlyBackendService.ts` - Cache control improvements

**Documentation:**
- Added `TRANSACTION_DETAIL_AND_IMAGE_IMPROVEMENTS.md`

**Configuration:**
- Updated `app.json`, `android/app/build.gradle`, `ios/Evenly/Info.plist`

### Commit: 05781608 - Add pull-to-refresh and skeleton loaders for Home screen
**Files Changed**: 9 files, +1,195 insertions, -193 deletions

**Major Changes:**
- Fixed group skeleton loader to match GroupItem structure
- Added custom pull-to-refresh to HomeScreen
- Created SkeletonKhataSummary component
- Implemented Khata Summary refresh with loading states
- Fixed activity count badge to show total count
- Fixed groups count badge to show total count
- Created CustomerInfoModal component

**Hook Updates:**
- `useInfiniteScroll.ts` - Added totalCount support
- `useGroupsInfinite.ts` - Exposed totalCount
- `useActivitiesInfinite.ts` - Added totalCount tracking

**Component Updates:**
- `HomeScreen.tsx` - Pull-to-refresh integration
- `GroupsScreen.tsx` - Total count for badge
- `RecentActivity.tsx` - Total count for badge
- `SkeletonLoader.tsx` - New skeleton components
- `CustomerDetailScreen.tsx` - Modal integration

### Commit: a9946829 - Fix phone number display and add input validation
**Changes:**
- Phone number formatting improvements
- Input validation enhancements
- Better error handling

---

## Testing Checklist

### Before Deployment
- [ ] Test pull-to-refresh on all screens (Home, Groups, Books, Profile)
- [ ] Verify skeleton loaders appear correctly during loading
- [ ] Test customer details modal from Khata transactions
- [ ] Verify Khata Summary updates on data changes
- [ ] Test full-screen image viewer (zoom, pan, close)
- [ ] Check count badges show correct totals
- [ ] Test group creation and list updates
- [ ] Verify offline mode functionality
- [ ] Test dark and light theme switching
- [ ] Check all modals open and close properly
- [ ] Verify phone number and email validation
- [ ] Test transaction detail modal with images
- [ ] Check customer list modal navigation

### Platforms
- [ ] iOS - Tested and working
- [ ] Android - Tested and working

### Performance
- [ ] App launches quickly
- [ ] Smooth scrolling on all screens
- [ ] Images load efficiently
- [ ] No memory leaks
- [ ] Battery usage acceptable

---

## Support & Contact

For issues or feedback, please contact:
- Email: [Your Support Email]
- GitHub: https://github.com/raviroygit/Evenly

---

**Built with ❤️ by NxtGenAiDev**
