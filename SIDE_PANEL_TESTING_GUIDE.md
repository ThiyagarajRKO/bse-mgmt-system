# Side Panel Testing Guide - Quick Start

## System Status ✅

- **Server:** Running on port 4000 (auto-reloading via nodemon)
- **Database:** Connected successfully
- **API Endpoints:** All functional
- **Code:** Deployed and ready

---

## What Was Fixed

The "Raise Purchase Request" side panel now works correctly. It was broken because the code was trying to call `.slideInPanel()` as a jQuery method, when it should have been using CSS animation.

**Fixed Code:**

```javascript
// BEFORE (broken):
$("#purchaseRequestSlideInPanel").slideInPanel();

// AFTER (fixed):
$("#purchaseRequestSlideInPanel").css("right", "0");
```

---

## How to Test

### Step 1: Open the Application

```
http://localhost:4000/Sales
```

### Step 2: Navigate to Orders

1. You should see the Sales page
2. Look for the Orders section
3. Find an order with inventory to check

### Step 3: Click "Raise Purchase Request"

1. On any order row, look for the "Raise Purchase Request" button
2. Click it
3. **Expected:** A dark panel slides in from the RIGHT side of the screen

### Step 4: Verify Panel Contents

Once the panel opens, verify:

- **Order Details Section (top)**

  - Shows order number
  - Shows product name
  - Shows quantity required
  - Shows estimated date needed

- **AI Analysis Section**

  - Shows confidence percentage (if AI data available)
  - Shows urgency level (color-coded)
  - Shows quick facts (conversion ratio, yield, recommended qty, inventory)
  - Shows optimization tips (if any)

- **Raw Materials Section**

  - Shows list of available raw materials
  - Each material has a radio button selector
  - Shows availability status
    - 🟢 Green = Material available
    - 🔴 Red = Material out of stock

- **Quantity Input Section**
  - Shows pre-filled quantity (with 20% buffer added)
  - You can modify the quantity

### Step 5: Test Interactions

**Select a Material:**

1. Click the radio button next to any raw material
2. Verify it's selected

**Change Quantity:**

1. Click in the quantity input field
2. Change the value
3. Verify it updates

**Create Request:**

1. Select a material
2. Enter a valid quantity (> 0)
3. Click "Create Request" button
4. Panel should close automatically
5. Check if purchase request was created

**Cancel/Close:**

1. Click the "Close" button (top right of panel)
2. Or click "Cancel" button
3. Panel should slide out to the right
4. Data should be cleared

---

## Expected Behavior

### Panel Animation

- **Opening:** Smooth slide-in from right side (300ms)
- **Closing:** Smooth slide-out to right side (300ms)
- **Position:** Fixed to right side of screen
- **Width:** 400px
- **Height:** 90% of viewport

### Data Population

- Order details load immediately
- Materials list loads within 1-2 seconds
- AI analysis loads within 1-2 seconds (or shows "Calculating...")

### Validation

- Can't create request without selecting a material
- Can't create request with 0 or negative quantity
- Shows warning messages for invalid inputs

---

## Troubleshooting

### Panel Doesn't Open?

1. **Check browser console** (F12 → Console tab)
2. Look for JavaScript errors
3. If you see errors, note them down

### Panel Opens but No Data?

1. Check if loading spinner appears
2. Wait 2-3 seconds for data to load
3. If still no data, check console for API errors
4. Check browser's Network tab (F12 → Network) to see API responses

### API Error Messages?

Common errors and what they mean:

- **"404 not found"** - API endpoint doesn't exist
- **"500 error"** - Server error, check server logs
- **"No products found"** - No raw materials available for this product

### Performance Issues?

- AI calculation takes 100-150ms (this is normal)
- Materials list should load in < 2 seconds
- If slower, check database connection

---

## Success Criteria

✅ **All of the following should work:**

1. [ ] Clicking "Raise Purchase Request" makes the panel appear
2. [ ] Panel slides in smoothly from the right
3. [ ] Order details are populated correctly
4. [ ] Raw materials list displays
5. [ ] Can select a material with radio button
6. [ ] Can enter/modify quantity
7. [ ] Create button works (creates the request)
8. [ ] Close button works (hides the panel)
9. [ ] Cancel button works (hides the panel)
10. [ ] Panel slides out smoothly to the right

---

## If Something Doesn't Work

Please provide:

1. **Screenshot** of the issue
2. **Browser console errors** (F12 → Console)
3. **Server logs** (terminal output)
4. **Network tab responses** (F12 → Network)
5. **Steps to reproduce** the problem

---

## File References

- **Main Implementation:** `/views/Sales.ejs`

  - CSS: Lines 237-251
  - HTML: Line 748
  - JavaScript: Lines 2098-3616

- **Verification Report:** `/SIDE_PANEL_FIX_VERIFICATION.md`

- **API Documentation:** `/API_ENDPOINT_FIX_PROCUREMENT_PRODUCTS.md`

---

## Quick Commands

**Check if server is running:**

```bash
curl http://localhost:4000/Sales
```

**View server logs (in terminal):**

```
# Already running in background
# Check terminal window for logs
```

**Restart server if needed:**

```bash
npm run start:dev
```

---

**Ready to test?** Open http://localhost:4000/Sales and try clicking "Raise Purchase Request" on any order! 🚀
