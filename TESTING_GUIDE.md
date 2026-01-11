# Vue to EJS Conversion - Testing Guide

## 🧪 Browser Testing Instructions

This guide provides step-by-step instructions to test all converted components in the browser.

---

## Setup

### Prerequisites
1. Server running with EJS view engine configured
2. All backend API endpoints functional
3. Database populated with test data (optional species, orders, inventory)

### Test Environment
- Browser: Chrome, Firefox, or Safari
- Console: Open DevTools (F12 or Cmd+Option+I)
- Network: Monitor network tab to verify API calls

---

## Test Scenarios

### TEST 1: Page Load and Initial State

**Steps:**
1. Navigate to `/production-workflow`
2. Wait for page to fully load
3. Open browser DevTools (F12)
4. Check Network tab

**Expected Results:**
- ✅ Page loads without errors
- ✅ No red error messages in console
- ✅ Bootstrap CSS loads (production-workflow.ejs visible)
- ✅ Production orders appear in sidebar (if DB has data)
- ✅ "Step 1: Create Production Order" form visible
- ✅ "Step 2-5" workflow hidden initially

**Console Verification:**
```javascript
// In console, verify global state exists
console.log(window.productionOrders);  // Should return []
console.log(window.selectedOrder);     // Should return null
```

---

### TEST 2: Load Production Orders

**Steps:**
1. Wait 2-3 seconds for page to load
2. Open DevTools Network tab
3. Filter for "orders"
4. Check sidebar for orders list

**Expected Results:**
- ✅ GET /api/production/orders?page=1&limit=20 request successful (200 OK)
- ✅ Response contains array of orders
- ✅ Orders appear in sidebar list
- ✅ Stats show: Total Orders, Active Orders, Completed Orders
- ✅ No errors in console

**Console Verification:**
```javascript
// Verify orders loaded
console.log(window.productionOrders.length);  // Should be > 0
console.log(window.productionOrders[0]);      // Should show order object
```

---

### TEST 3: Create Production Order

**Steps:**
1. Fill in form fields:
   - Order Number: `PO-TEST-001`
   - Plant ID: `PLANT-01`
   - Input Species: Select from dropdown
   - Quantity: `100`
   - Grade: `PREMIUM`
   - Size: `LARGE`
   - Remarks: `Test order`
2. Click "Create Production Order" button
3. Monitor Network tab
4. Check console for events

**Expected Results:**
- ✅ Species dropdown populates from `/api/species` (200 OK)
- ✅ Form submits to POST /api/production/orders (200 OK)
- ✅ Response includes new order ID
- ✅ New order appears in sidebar
- ✅ New order auto-selects
- ✅ "Step 2-5" workflow shows
- ✅ Console shows: "Order created: {...}"

**Console Verification:**
```javascript
// Listen for order created event
window.addEventListener('orderCreated', (e) => {
  console.log('✅ orderCreated fired:', e.detail);
  console.log('New order ID:', e.detail.id);
});

// After submission, verify selected order
console.log(window.selectedOrder);  // Should show selected order object
```

---

### TEST 4: BOM Explosion

**Steps:**
1. With order selected (from TEST 3), navigate to "Step 2: BOM Explosion"
2. View BOM table showing derivatives
3. Click "Start Production" button
4. Monitor Network tab

**Expected Results:**
- ✅ BOM table displays with columns:
  - Derivative Product Code
  - Expected Qty
  - Yield %
  - UoM
- ✅ At least one derivative row visible
- ✅ Start Production button submits to POST /api/production/:id/start (200 OK)
- ✅ Order status updates to "RAW_ISSUED"
- ✅ Console shows: "Production started: {...}"

**Console Verification:**
```javascript
// Listen for production started event
window.addEventListener('productionStarted', (e) => {
  console.log('✅ productionStarted fired:', e.detail);
});

// Verify order status updated
console.log(window.selectedOrder.status);  // Should be "RAW_ISSUED"
```

---

### TEST 5: Raw Material Consumption

**Steps:**
1. With order in RAW_ISSUED status, navigate to "Step 3: Consume Raw Material"
2. View available lots table
3. Verify consumption summary shows
4. Enter quantities for each lot
5. Click "Consume Materials" button
6. Monitor Network tab

**Expected Results:**
- ✅ Available lots table displays with FIFO ordering
- ✅ Columns include:
  - Batch Number
  - Location
  - On-Hand Qty
  - Expiration
  - Available for Consumption
- ✅ Consumption summary shows:
  - Total Consumed
  - Remaining to Consume
- ✅ Form submission succeeds (POST /api/production/:id/consume - 200 OK)
- ✅ GL posting entry created
- ✅ Console shows: "Raw material consumed: {...}"

**Console Verification:**
```javascript
// Listen for raw material consumed event
window.addEventListener('rawMaterialConsumed', (e) => {
  console.log('✅ rawMaterialConsumed fired:', e.detail);
  console.log('GL entry created:', e.detail.gl_posting_id);
});
```

---

### TEST 6: Production Output Recording

**Steps:**
1. With order in RAW_ISSUED status, navigate to "Step 4: Record Production Output"
2. View expected outputs table (from BOM)
3. Enter actual quantities for each output
4. Verify variance calculates in real-time
5. Check variance classification (NORMAL/ABNORMAL)
6. Click "Submit Output" button
7. Monitor Network tab

**Expected Results:**
- ✅ Expected outputs table displays with:
  - Product Code
  - Expected Qty
  - Actual Qty (input field)
  - Variance (auto-calculated)
  - Variance % (auto-calculated)
- ✅ Variance updates in real-time as you type
- ✅ Classification shows:
  - "NORMAL" if variance ≤ 5%
  - "ABNORMAL" if variance > 5%
- ✅ Form submission succeeds (POST /api/production/:id/output - 200 OK)
- ✅ GL posting created for abnormal variance
- ✅ Console shows: "Output recorded: {...}"

**Console Verification:**
```javascript
// Listen for output recorded event
window.addEventListener('outputRecorded', (e) => {
  console.log('✅ outputRecorded fired:', e.detail);
  console.log('Variance %:', e.detail.variance_percentage);
  console.log('Variance Type:', e.detail.variance_type);
});
```

---

### TEST 7: Variance Report

**Steps:**
1. With completed order, navigate to "Step 5: Variance Analysis"
2. View variance summary cards
3. Examine variance details table
4. Check GL posting status

**Expected Results:**
- ✅ Summary cards display:
  - Normal Variance Count
  - Abnormal Variance Count
- ✅ Variance details table shows:
  - Derivative Product Code
  - Expected Qty
  - Actual Qty
  - Variance Amount
  - Variance %
  - Variance Type (NORMAL/ABNORMAL)
  - GL Posting Status (Posted/Pending)
- ✅ Fetches data from GET /api/production/:id/variance (200 OK)
- ✅ No errors in console

**Console Verification:**
```javascript
// Verify variance report loads
fetch('/api/production/' + window.selectedOrder.id + '/variance')
  .then(r => r.json())
  .then(data => console.log('Variance report:', data));
```

---

### TEST 8: Inventory Dashboard

**Steps:**
1. Scroll to sidebar "Inventory Dashboard" section
2. View summary cards (RAW, WIP, FG)
3. Apply filters (warehouse, status)
4. View inventory table
5. Test pagination
6. Wait 30+ seconds for auto-refresh
7. Monitor Network tab

**Expected Results:**
- ✅ Summary cards display with totals
- ✅ GET /api/inventory/stock/summary succeeds (200 OK)
- ✅ Inventory table displays with:
  - Product Code
  - Product Name
  - Warehouse
  - On-Hand Qty
  - UoM
  - Batch Number
  - Expiration
- ✅ Pagination controls (Previous/Next) work
- ✅ GET /api/inventory/stock?page=1&limit=20 succeeds (200 OK)
- ✅ Auto-refresh occurs every 30 seconds
- ✅ Network tab shows requests at 30-second intervals

**Console Verification:**
```javascript
// Monitor auto-refresh
let count = 0;
setInterval(() => {
  count++;
  console.log(`Auto-refresh #${count} at ${new Date().toLocaleTimeString()}`);
}, 1000);  // Check every second
```

---

### TEST 9: Order Selection and UI Flow

**Steps:**
1. With no order selected, verify "Step 1" visible, "Step 2-5" hidden
2. Click order in sidebar to select it
3. Verify "Step 1" hidden, "Step 2-5" visible
4. View order summary in sidebar
5. Click different orders and verify UI updates
6. Monitor console for custom events

**Expected Results:**
- ✅ Step 1 section visible initially (id="step1-section")
- ✅ Steps 2-5 section hidden initially (id="steps-2-5-section")
- ✅ Clicking order selects it (changes background color)
- ✅ Selected order shown in "Current Order" section
- ✅ Step 1 hides, Steps 2-5 show
- ✅ Switching orders updates all step components
- ✅ `orderSelected` custom event fires for each selection

**Console Verification:**
```javascript
// Verify UI state changes
console.log('Step 1 visible:', document.getElementById('step1-section').style.display !== 'none');
console.log('Steps 2-5 visible:', document.getElementById('steps-2-5-section').style.display !== 'none');
console.log('Selected order:', window.selectedOrder);
```

---

### TEST 10: Custom Events Flow

**Steps:**
1. Set up event listeners in console (see below)
2. Perform the following actions in order:
   - Create a new order
   - Start production
   - Consume materials
   - Record output
3. Monitor console for events
4. Verify event detail objects

**Setup Code (Run in Console):**
```javascript
// Setup all event listeners
window.addEventListener('orderCreated', (e) => {
  console.log('📦 orderCreated:', e.detail);
  console.log('  - Order ID:', e.detail.id);
  console.log('  - Order Number:', e.detail.order_number);
});

window.addEventListener('productionStarted', (e) => {
  console.log('🏭 productionStarted:', e.detail);
  console.log('  - Production ID:', e.detail.id);
});

window.addEventListener('rawMaterialConsumed', (e) => {
  console.log('🌾 rawMaterialConsumed:', e.detail);
  console.log('  - Consumption ID:', e.detail.id);
  console.log('  - GL Posting ID:', e.detail.gl_posting_id);
});

window.addEventListener('outputRecorded', (e) => {
  console.log('📊 outputRecorded:', e.detail);
  console.log('  - Output ID:', e.detail.id);
  console.log('  - Variance %:', e.detail.variance_percentage);
  console.log('  - Variance Type:', e.detail.variance_type);
});

console.log('✅ Event listeners set up. Now perform workflow actions...');
```

**Expected Console Output:**
```
✅ Event listeners set up. Now perform workflow actions...
📦 orderCreated: {id: 123, order_number: "PO001", ...}
  - Order ID: 123
  - Order Number: PO001
🏭 productionStarted: {id: 123, ...}
  - Production ID: 123
🌾 rawMaterialConsumed: {id: 456, ...}
  - Consumption ID: 456
  - GL Posting ID: 789
📊 outputRecorded: {id: 789, ...}
  - Output ID: 789
  - Variance %: 3.5
  - Variance Type: NORMAL
```

---

## API Integration Verification

### Network Tab Analysis

**Expected API Calls:**

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| /api/production/orders | GET | 200 | Load orders |
| /api/species | GET | 200 | Load species for form |
| /api/production/orders | POST | 201 | Create order |
| /api/production/:id | GET | 200 | Get order details |
| /api/production/:id/start | POST | 200 | Start production |
| /api/inventory/stock | GET | 200 | Get lots for consumption |
| /api/production/:id/consume | POST | 200 | Submit consumption |
| /api/production/:id/output | POST | 200 | Submit output |
| /api/production/:id/variance | GET | 200 | Get variance report |
| /api/inventory/stock/summary | GET | 200 | Get inventory summary |
| /api/inventory/stock | GET | 200 | Get paginated inventory |

**Verification Steps:**
1. Open DevTools Network tab
2. Filter for XHR/Fetch requests
3. Perform all workflow steps
4. Verify all endpoints called with correct methods
5. Verify all responses have 200 status code
6. Check response payloads match expected format

---

## Error Handling Verification

### Common Error Scenarios

**Scenario 1: Network Error**
- Disconnect internet
- Try to load orders
- Expected: Error message in console
- Component should handle gracefully

**Scenario 2: Invalid Form Data**
- Leave required fields blank
- Submit form
- Expected: Form validation error
- No API call should be made

**Scenario 3: API Failure**
- Simulate API server down
- Try any operation
- Expected: Error caught, message to user
- No crash or broken UI

**Scenario 4: Malformed Response**
- API returns invalid JSON
- Expected: Parse error caught
- Component handles gracefully

---

## Performance Verification

### Page Load Performance

**Baseline Metrics:**
```javascript
// In console
performance.timing.loadEventEnd - performance.timing.navigationStart
// Expected: < 2000ms (2 seconds)

// Detailed breakdown
let perfData = performance.getEntriesByType('navigation')[0];
console.log('DNS:', perfData.domainLookupEnd - perfData.domainLookupStart);
console.log('TCP:', perfData.connectEnd - perfData.connectStart);
console.log('Request:', perfData.responseStart - perfData.requestStart);
console.log('DOM Parse:', perfData.domInteractive - perfData.domLoading);
console.log('Total:', perfData.loadEventEnd - perfData.fetchStart);
```

### Component Render Performance

**Measure Render Time:**
```javascript
// Measure order list rendering
console.time('Update Orders List');
updateOrdersList();
console.timeEnd('Update Orders List');
// Expected: < 100ms

// Measure form rendering
console.time('Render Form');
document.getElementById('production-order-form').innerHTML = formHTML;
console.timeEnd('Render Form');
// Expected: < 50ms
```

---

## Troubleshooting Test Failures

### Issue: "Cannot read property 'map' of undefined"
**Cause:** productionOrders not initialized
**Solution:** Check DOMContentLoaded event fired, loadOrders() called

### Issue: Custom event not firing
**Cause:** Event listener not attached or event name mismatch
**Solution:** Verify event names exact (case-sensitive), check listener attached

### Issue: API returns 404
**Cause:** Endpoint doesn't exist or wrong path
**Solution:** Check API endpoint exists, verify URL format, check server logs

### Issue: Form data not submitting
**Cause:** Form validation failing or fetch error
**Solution:** Check browser console for errors, verify field values, check network tab

### Issue: Styles not applying
**Cause:** Bootstrap CSS not loaded or CSS conflict
**Solution:** Check head for Bootstrap CDN, verify no conflicting CSS, hard refresh (Ctrl+Shift+R)

---

## Test Results Documentation

### Template for Recording Results

```
TEST SCENARIO: [Name]
Date: [Date]
Tester: [Name]
Browser: [Chrome/Firefox/Safari] v[Version]

STEPS:
1. [Step 1]
2. [Step 2]
...

EXPECTED RESULTS:
✅ Expected 1
✅ Expected 2
...

ACTUAL RESULTS:
✅ Result 1
⚠️  Issue with Result 2
❌ Result 3 Failed

ISSUES FOUND:
- Issue 1: [Description]
  Status: [Open/Resolved/Deferred]
  
STATUS: [PASS/FAIL]
NOTES: [Additional notes]
```

---

## Automated Testing (Optional)

### Browser Console Test Suite

```javascript
// Run in browser console to auto-test key functions

async function runTests() {
  console.log('🧪 Starting test suite...\n');
  
  // Test 1: Check global state
  console.log('TEST 1: Global state initialized');
  console.assert(window.productionOrders !== undefined, 'Orders array missing');
  console.assert(window.selectedOrder !== undefined, 'selectedOrder missing');
  console.log('✅ PASSED\n');
  
  // Test 2: Load orders
  console.log('TEST 2: Load orders');
  await loadOrders();
  console.assert(window.productionOrders.length > 0, 'No orders loaded');
  console.log('✅ PASSED\n');
  
  // Test 3: Check API endpoint
  console.log('TEST 3: API endpoint accessible');
  const response = await fetch('/api/production/orders?page=1&limit=1');
  console.assert(response.ok, 'API endpoint failed');
  console.log('✅ PASSED\n');
  
  console.log('🎉 All tests passed!');
}

// Run tests
runTests();
```

---

## Sign-Off Template

```
CONVERSION TESTING - SIGN OFF

All Components Tested: ✅
Date Completed: ________
Tested By: ________
Environment: ________

Components Status:
[ ] Production Order Form - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] BOM Explosion Viewer - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] Raw Material Consumption - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] Production Output Recorder - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] Variance Report - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] Inventory Dashboard - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] Custom Events - ✅ PASS / ⚠️ ISSUES / ❌ FAIL
[ ] API Integration - ✅ PASS / ⚠️ ISSUES / ❌ FAIL

Overall Status: ✅ READY FOR PRODUCTION / ⚠️ NEEDS FIXES / ❌ NOT READY

Issues Found:
[List any critical or blocking issues]

Approved For Production: [ ] YES / [ ] NO

Signature: _________________ Date: _________
```

---

**Good luck with testing! Report any issues found.**
