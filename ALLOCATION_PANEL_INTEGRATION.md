<!-- INTEGRATION INSTRUCTIONS FOR ALLOCATION EXTENDED PANEL -->

# How to Integrate allocation-extended-panel.ejs into Sales.ejs

This guide explains how to add the new allocation extended panel to your existing Sales.ejs without modifying existing code.

## Files Created
- `/views/partials/allocation-extended-panel.ejs` - New extended panel component
- `/src/services/salesOrderGLFlowAPI.js` - API client service
- `/public/js/salesOrderGLFlow.js` - Frontend service utilities

## Step 1: Include the New Partial in Sales.ejs

Add this line near the end of your Sales.ejs file (around line 6300, after the closing of main content but before closing body):

```ejs
<!-- Sales Order GL Flow Extended Allocation Panel -->
<%- include('./partials/allocation-extended-panel'); %>
```

## Step 2: Add Call to Open Panel from Allocation Table

Find the allocation table row click handler in Sales.ejs (around line 3223). Add this code to open the extended panel when user clicks on an allocation row:

EXISTING CODE (around line 3223):
```javascript
$('#allocationTable').on('click', 'tbody tr', function() {
    // existing code...
});
```

ADD THIS:
```javascript
$('#allocationTable').on('click', 'tbody tr', function() {
    // existing code...
    
    // NEW: Open extended panel
    const row = $(this).closest('tr');
    const allocationId = row.data('allocation-id');
    const orderId = row.data('order-id');
    if (allocationId && orderId) {
        openAllocationPanel(allocationId, orderId);
    }
});
```

## Step 3: Update Allocation Table Data Attributes

Modify the allocation table to include data attributes for allocation ID and order ID.

Find your allocation table row generation (around line 3120) and ensure the `<tr>` has these attributes:

```html
<tr data-allocation-id="${allocationId}" data-order-id="${orderId}">
    <!-- existing columns -->
</tr>
```

## Step 4: Include Required Scripts (BEFORE body closing tag)

Add these script includes in the correct order in Sales.ejs:

```html
<!-- Sales Order GL Flow Scripts -->
<script src="/js/services/salesOrderGLFlowAPI.js"></script>
<script src="/js/salesOrderGLFlow.js"></script>
```

**IMPORTANT**: These scripts must be loaded AFTER jQuery, Bootstrap, DataTables, and Toastr are loaded.

## Step 5: Configure API Client

The `salesOrderGLFlowAPI.js` will auto-detect the JWT token from localStorage. Ensure your auth system stores the token as:

```javascript
localStorage.setItem('authToken', jwtToken);
```

If you store it differently, update the fetch headers in `allocation-extended-panel.ejs` from:
```javascript
'Authorization': `Bearer ${localStorage.getItem('authToken')}`
```

to match your token storage method.

## Step 6: Add Button to Open Panel (Optional)

If you want an explicit "View Workflow" button in the allocation table, add this to the action column:

```html
<button class="btn btn-sm btn-info" onclick="openAllocationPanel('${allocationId}', '${orderId}')">
    <i class="fas fa-sync"></i> View Workflow
</button>
```

## Verification Checklist

✅ Partial included in Sales.ejs
✅ Script files loaded in correct order
✅ API endpoints exist on backend (should be auto-created)
✅ JWT token stored in localStorage as 'authToken'
✅ Bootstrap 5 and jQuery loaded before the panel scripts
✅ CSS is included (embedded in the partial)
✅ Modal IDs don't conflict with existing ones

## Features Available in Extended Panel

Once integrated, users will have access to:

1. **Allocation Details Tab**
   - View order info, allocation status
   - See allocation line items
   - Confirm allocation
   - Create production demands

2. **Production Demands Tab**
   - View all demands linked to allocation
   - See demand status and fulfillment
   - Create new demands with modal

3. **Invoice Tab**
   - Create sales invoice from demands
   - View invoice details and line items
   - Display amounts (net, tax, total)
   - Post invoice to GL

4. **GL Posting Tab**
   - View GL entries created from invoice
   - Check trial balance
   - Verify account balances

## Troubleshooting

**Panel doesn't open:**
- Check browser console for errors
- Verify allocation-extended-panel.ejs is included
- Verify data-allocation-id attribute on table rows

**API calls fail:**
- Check backend APIs are running
- Verify JWT token is in localStorage
- Check network tab for 401/403 errors

**Modal doesn't show:**
- Verify Bootstrap 5 is loaded
- Check for modal ID conflicts with existing modals
- Look for JavaScript errors in console

**Styling looks wrong:**
- Clear browser cache
- Verify Bootstrap 5 CSS is loaded
- Check for CSS conflicts with existing styles

## Files NOT Modified
✅ views/Sales.ejs - No existing code changed
✅ models/* - No changes
✅ migrations/* - No changes
✅ package.json - No changes
✅ config/* - No changes

Only NEW files created:
- views/partials/allocation-extended-panel.ejs (CREATED)
- src/services/salesOrderGLFlowAPI.js (CREATED)
- public/js/salesOrderGLFlow.js (CREATED)
