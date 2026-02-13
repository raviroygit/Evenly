# Transaction Balance Display Fix

## Problem Summary
The logged-in user was seeing **0** in the transaction balance badge in the transaction list screen, even though the top summary card was showing the correct balance.

## Root Cause

**Double Formatting Issue** in `CustomerDetailScreen.tsx`:

1. **Line 129** (and 3 other places): Transaction balance was being formatted with currency symbol when storing:
   ```typescript
   balance: formatAmount(Math.abs(parseFloat(t.balance)).toString())
   // Result: "₹1,234" or "$1,234"
   ```

2. **Line 572**: The already-formatted balance was being parsed as a float again:
   ```typescript
   {formatAmount(parseFloat(transaction.balance))}
   // parseFloat("₹1,234") = NaN or 0
   ```

**Why the top card worked correctly**:
- Top card (line 481) uses `customer.balance` directly from backend
- Formatted only once with `formatAmount(totalAmount)`
- No double formatting issue

## Changes Made

### File: `src/features/books/CustomerDetailScreen.tsx`

1. **Transaction mapping** (4 locations):
   - Lines 123-135 (initial load)
   - Lines 199-211 (after adding transaction)
   - Lines 258-270 (after updating transaction)
   - Lines 309-321 (after deleting transaction)

   **Before**:
   ```typescript
   balance: formatAmount(Math.abs(parseFloat(t.balance)).toString()),
   amountGiven: t.type === 'give' ? formatAmount(t.amount) : '',
   amountGot: t.type === 'get' ? formatAmount(t.amount) : '',
   ```

   **After**:
   ```typescript
   balance: Math.abs(parseFloat(t.balance)).toString(), // Store raw value
   amountGiven: t.type === 'give' ? t.amount : '',
   amountGot: t.type === 'get' ? t.amount : '',
   ```

2. **Display** (line 572):
   - Already correctly formatted with `formatAmount(parseFloat(transaction.balance))`
   - Now works because balance is stored as a raw numeric string

## Result

✅ **Transaction balance badge now displays correctly** with proper currency formatting
✅ **Top summary card continues to work correctly**
✅ **Amount given/got also display correctly** since they're now stored as raw values

## Testing

Test the following scenarios:
1. ✅ View transaction list - balance badge should show correct amounts
2. ✅ Add new transaction - balance should update correctly in list
3. ✅ Edit transaction - balance should reflect changes
4. ✅ Delete transaction - balance should update correctly
5. ✅ Top summary card should still show correct total balance

## Technical Details

**Storage Pattern**: Store raw numeric values, format only on display
- ✅ Prevents double formatting
- ✅ Makes values easier to manipulate
- ✅ Consistent with other parts of the app

**Currency Formatting**: Applied only in JSX templates
- Line 572: `{formatAmount(parseFloat(transaction.balance))}`
- Line 582: `-{formatAmount(transaction.amountGiven)}`
- Line 587: `+{formatAmount(transaction.amountGot)}`
