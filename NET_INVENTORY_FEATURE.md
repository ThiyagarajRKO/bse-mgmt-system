# Net Inventory Calculation Feature - Implementation Complete

## Overview

The purchase request panel now displays real-time net inventory calculations by combining purchase inventory and sales inventory data.

## What Changed

### Feature: Net Inventory Display in Raw Materials Selection

**Location**: `/views/Sales.ejs` - `loadRawMaterialsForPurchaseRequest()` function (lines 3665-3815)

## How It Works

### 1. **Data Fetching**

For each raw material in the purchase request panel:

#### Purchase Inventory Fetch

```javascript
// Fetches from: /api/inventory/purchase/all?procurement_product_id={material.id}
// Returns: available_quantity or quantity_in_stock
```

#### Sales Inventory Fetch

```javascript
// Fetches from: /api/inventory/sales/all?search={productMasterId}
// Returns: quantity (total sales for that product)
```

### 2. **Calculation**

```javascript
netInventory = Math.max(0, purchaseInventory - salesInventory);
```

- Net inventory can never be negative (minimum 0)
- Represents actual available stock after accounting for sales

### 3. **Display Format**

Each raw material now shows three inventory metrics:

```
Material Name - Supplier Name
├─ Purchase Inventory: [amount] units
├─ Sales Inventory: [amount] units
└─ Current Available: [amount] units ← Highlighted in green/red
   Price: ₹[price]
```

## Visual Indicators

### Status Colors

- **Green (#4caf50)**: Material available (net inventory > 0)
- **Red (#d32f2f)**: Out of stock (net inventory = 0)

### Display Styling

- **Purchase/Sales breakdown**: Plain text for reference
- **Current Available**: Highlighted box with status color, bold font for emphasis
- **Status badge**: Top-right corner shows "Available" or "Out of Stock"

## Technical Details

### API Endpoints Used

| Endpoint                      | Purpose                      | Parameters                                      |
| ----------------------------- | ---------------------------- | ----------------------------------------------- |
| `/api/inventory/purchase/all` | Fetch purchase inventory     | `procurement_product_id`                        |
| `/api/inventory/sales/all`    | Fetch sales inventory        | `search` (uses product_master_id)               |
| `/api/procurement/product`    | Get raw materials by species | `species_master_id`, `procurement_product_type` |

### Key Variables

- `purchaseInventory`: Sum of available quantities from purchase inventory API
- `salesInventory`: Sum of quantities from sales inventory API
- `netInventory`: Calculated difference (purchase - sales)

### Error Handling

- **API Fails**: Falls back to 0 for that inventory type
- **Missing Data**: Shows 0 and "Out of Stock"
- **Console Logging**: Logs purchase, sales, and net values for debugging

### AJAX Configuration

- **Synchronous**: Uses `async: false` to ensure proper data flow during material rendering
- **Timeout**: 5000ms per API call
- **Error Recovery**: Continues with fallback values if API fails

## Console Logging

When loading raw materials, you'll see logs like:

```
Material: [name], Procurement ID: [id], Purchase: [amount], Sales: [amount], Net: [amount]
Raw materials HTML rendered with net inventory (purchase - sales)
```

## Testing Checklist

- [ ] Open Sales module and navigate to an order
- [ ] Click "Raise Purchase Request" button
- [ ] Verify raw materials load with all three inventory levels
- [ ] Check that Current Available = Purchase - Sales
- [ ] Verify color coding (green for available, red for out of stock)
- [ ] Open browser console and check logs show correct calculations
- [ ] Test with different products and species

## Integration Points

### Related Features

1. **AI Raw Material Calculator**: Displays recommendations with net inventory context
2. **Procurement Products Filtering**: Filters by species_master_id
3. **Purchase Inventory API**: Provides actual purchase stock levels
4. **Sales Inventory API**: Provides actual sales/consumed quantities

### Dependent Modules

- Purchase Inventory Controller: Returns available_quantity field
- Sales Inventory Controller: Returns quantity field
- Product relationships: ProductMaster → ProductCategoryMaster → SpeciesMaster

## Future Enhancements

Potential improvements for future iterations:

1. Cache inventory data to reduce API calls
2. Add historical trend visualization
3. Implement inventory reorder level suggestions
4. Add batch/lot-level inventory tracking
5. Create inventory alerts for low stock items

## Troubleshooting

### Issue: Net inventory shows 0 for all items

**Solution**: Check that purchase and sales inventory APIs are returning data correctly

### Issue: High API call latency

**Solution**: Consider implementing caching or pagination for bulk operations

### Issue: Missing sales inventory data

**Solution**: Verify SalesInventory records exist in database for the product_master_id

### Issue: Math is incorrect

**Solution**: Check console logs for actual purchase and sales values; verify API responses
