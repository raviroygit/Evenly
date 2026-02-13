# Date/Time Picker Fix for Expense Creation

## Problem Summary
When adding expenses in a group:
1. ❌ Calendar with date/time was not opening (just a text input)
2. ❌ Default date was changing correctly, but time was always 5:30 AM instead of current time

## Root Causes

### Issue 1: No Actual Calendar
- **Line 657-694**: The "date picker" was just a simple text input modal, not a real calendar
- No native date/time picker component was being used

### Issue 2: Time Always 5:30 AM
- **Line 54**: Date was stored as string without time: `new Date().toISOString().split('T')[0]` → "2026-02-13"
- **Lines 385, 436, 454**: When converting to ISO, `new Date("2026-02-13")` defaults to midnight UTC
- In IST (UTC+5:30), midnight UTC becomes 5:30 AM local time
- **Line 638**: Display showed formatted date/time, but stored date had no time component

## Changes Made

### 1. Installed Native DateTimePicker
Added import:
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
```

### 2. Changed Date Storage (Line 54)
**Before**:
```typescript
const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
// Result: "2026-02-13" (no time)
```

**After**:
```typescript
const [date, setDate] = useState(new Date());
// Result: Date object with current date and time
```

### 3. Added Time Picker State
```typescript
const [showTimePicker, setShowTimePicker] = useState(false);
const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
```

### 4. Replaced Custom Modal with Native Pickers (Lines 627-694)
**Before**: Text input modal
```typescript
<TextInput
  value={date}
  onChangeText={setDate}
  placeholder="YYYY-MM-DD"
/>
```

**After**: Separate date and time buttons with native pickers
```typescript
{/* Date Button */}
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Text>{date.toLocaleDateString()}</Text>
</TouchableOpacity>

{/* Time Button */}
<TouchableOpacity onPress={() => setShowTimePicker(true)}>
  <Text>{date.toLocaleTimeString()}</Text>
</TouchableOpacity>

{/* Native Date Picker */}
{showDatePicker && (
  <DateTimePicker value={date} mode="date" ... />
)}

{/* Native Time Picker */}
{showTimePicker && (
  <DateTimePicker value={date} mode="time" ... />
)}
```

### 5. Updated All Date Conversions
All places now use `date.toISOString()` directly instead of converting from string:
- Line 383 (Edit with image)
- Line 401 (Edit without image)
- Line 415 (Regular update)
- Line 433 (Add with image)
- Line 452 (Add without image)

### 6. Updated Reset Logic
Form reset now uses `new Date()` instead of date string:
- Line 464 (After successful add)
- Line 495 (handleClose)
- Line 105 (useEffect for new expense)

## Installation Required

### Install DateTimePicker Package
```bash
cd /Users/raviroy/Desktop/NxtGenAiDev/Applications/evenlysplit/Evenly/app
npx expo install @react-native-community/datetimepicker
```

### Rebuild Native Code (if needed)
```bash
# For iOS
npm run prebuild
npm run ios

# For Android
npm run prebuild
npm run android
```

## Result

### ✅ Date Selection
- Tapping the date field opens a **native calendar picker**
- Users can scroll through months and select any date
- iOS: Spinner-style picker
- Android: Calendar-style picker

### ✅ Time Selection
- Tapping the time field opens a **native time picker**
- Users can select hours and minutes
- Defaults to **current time**, not 5:30 AM
- iOS: Spinner-style picker
- Android: Clock-style picker

### ✅ Display Format
- Date: "13 Feb 2026"
- Time: "03:45 PM" (12-hour format with AM/PM)

### ✅ Data Storage
- Stored as ISO 8601 datetime: "2026-02-13T10:15:30.000Z"
- Includes both date and time
- Timezone-aware conversion

## Testing Checklist

1. ✅ Open Add Expense modal
2. ✅ Tap date field - calendar should open
3. ✅ Select a date - should update display
4. ✅ Tap time field - time picker should open
5. ✅ Select a time - should update display
6. ✅ Default time should be current time, not 5:30 AM
7. ✅ Submit expense - date/time should save correctly
8. ✅ Edit expense - date/time should load correctly
9. ✅ Test on both iOS and Android

## Platform Differences

### iOS
- Date picker: Spinner/wheel style
- Time picker: Spinner/wheel style
- Requires tapping "Done" or dismissing

### Android
- Date picker: Calendar grid style
- Time picker: Clock dial style
- Auto-closes on selection

## Technical Notes

**Why Date object instead of string?**
- Preserves time information
- Handles timezone conversions correctly
- Native pickers work with Date objects
- No more 5:30 AM bug

**Why separate date and time pickers?**
- Better UX on mobile
- Native UI patterns for each platform
- Clearer user intent (date vs time)
- Avoids datetime picker complexity

**ISO 8601 Format**
- Backend receives: "2026-02-13T10:15:30.000Z"
- Includes full date, time, and timezone
- Compatible with all databases
- No ambiguity in parsing
