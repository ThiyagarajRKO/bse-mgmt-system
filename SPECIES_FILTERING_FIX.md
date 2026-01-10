# Species Filtering Fix - Complete Solution

## Problem

Raw materials were showing ALL materials regardless of the product's species, instead of filtering by the ordered product's species.

## Root Cause

The order allocation API endpoint (`/api/order/allocation`) was not returning the `ProductCategoryMaster` association with the order products, so `species_master_id` was always null.

## Solution Implemented

### 1. Backend Changes - `/src/controllers/orders.js`

**Modified:** `GetAllocationData` function (line 487-500)

Added `ProductCategoryMaster` association to the ProductMaster include:

```javascript
{
  attributes: ["id", "product_name", "product_category_master_id"],
  model: models.ProductMaster,
  required: false,
  include: [
    {
      attributes: ["id", "product_category", "species_master_id"],
      model: models.ProductCategoryMaster,
      required: false,
    },
  ],
}
```

### 2. Frontend Changes - `/views/Sales.ejs`

#### A. Function Signature Updates

- Updated `checkExistingPurchaseRequest()` to accept `speciesId` parameter
- Updated `showRaisePurchaseRequestDialog()` to accept and use `speciesId`

#### B. Helper Function Creation

Added `loadRawMaterialsBySpecies()` function to handle species-based raw material filtering:

- Constructs API URL with `species_master_id` parameter
- Fetches and displays filtered raw materials
- Shows material name, supplier, and inventory details

#### C. Data Flow

1. Click "Raise Purchase Request" button
2. Extract `speciesId` from button's `data-species-id` attribute (comes from order product's ProductCategoryMaster)
3. Pass `speciesId` through function chain: `checkExistingPurchaseRequest` → `showRaisePurchaseRequestDialog` → `loadRawMaterialsForPurchaseRequest`
4. If `speciesId` is provided, call `loadRawMaterialsBySpecies` directly
5. If not provided, fall back to fetching from `/api/master/product/:id`

### 3. Backend Filtering - `/src/controllers/procurement_products.js`

Already implemented. When `species_master_id` parameter is provided to `/api/procurement/product`, it filters by:

```javascript
if (species_master_id) {
  productCategoryWhere.species_master_id = species_master_id;
}
```

## Testing

### Expected Behavior After Fix

1. Navigate to Sales → View Order Details
2. Click "Raise Purchase Request"
3. Raw materials list should show ONLY materials from the same species as the ordered product
4. Console logs will show:
   - `✓ Filtering by species. Fetching raw materials with URL: /api/procurement/product?...&species_master_id=<uuid>`
   - `✓ Species-filtered raw materials found: N (for species <uuid>)`

### Debug Logs

Console will display:

- `[Order View] Product: <name>, Species ID: <uuid>` - Shows extracted species ID
- `✓ Filtering by species.` or `⚠ NO FILTER` - Shows if filtering is active
- Material count and species breakdown

## Files Modified

- `/src/controllers/orders.js` - Added ProductCategoryMaster association
- `/src/controllers/product_master.js` - Added detailed debugging logs
- `/src/controllers/procurement_products.js` - Added species filtering logs
- `/src/routes/product_master/handlers/get.js` - Added response logging
- `/views/Sales.ejs` - Added species ID extraction and filtering logic

## Next Steps

1. Restart the server: `npm start` or `npm run dev`
2. Test the feature:
   - View an order with a specific species
   - Click "Raise Purchase Request"
   - Verify only raw materials from that species appear
   - Check browser console for debug logs

## Rollback

If issues occur, git status shows all modified files. Can revert specific changes or entire commit.
