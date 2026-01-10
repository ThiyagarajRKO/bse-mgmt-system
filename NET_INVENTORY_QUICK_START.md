# Quick Start - Net Inventory in Available Stock

## What's New

The **Available Stock** section now shows a complete inventory breakdown:

```
Purchase Inventory: 500 units
Sales Inventory: 150 units
Current: 350 units [Green/Red Badge]
```

## Where to Find It

1. **Open**: Sales module
2. **Action**: Click on any order row
3. **Result**: Modal opens with order details
4. **Look For**: "Available Stock (Net Inventory)" section

## What to Expect

### Green Badge (Sufficient Stock)

```
Current: 350 units ✓
→ Stock is sufficient for order
→ Click "Raise Purchase Request" to proceed
```

### Red Badge (Insufficient Stock)

```
Current: 50 units ✗
→ Low or no stock available
→ Consider request impact before proceeding
```

## How It Works

```
Click Order → Fetch Purchase Inventory → Fetch Sales Inventory → Calculate Net → Display Modal
                     (API 1)                   (API 2)              (Math)
```

## Testing Quick Checklist

- [ ] Modal opens when clicking order
- [ ] Shows Purchase Inventory amount
- [ ] Shows Sales Inventory amount
- [ ] Shows Current (net) inventory
- [ ] Math is correct: Purchase - Sales = Current
- [ ] Badge is GREEN when Current >= Required
- [ ] Badge is RED when Current < Required
- [ ] No console errors (F12)

## Files Modified

- `/views/Sales.ejs` - Data collection + display logic

## Documentation

For detailed information, see:

- `NET_INVENTORY_ORDER_DETAILS.md` - Technical details
- `NET_INVENTORY_VISUAL_GUIDE.md` - Visual examples
- `NET_INVENTORY_AVAILABLE_STOCK_COMPLETE.md` - Complete documentation

## API Endpoints

```javascript
// Purchase Inventory
GET /api/order/check-inventory/{productMasterId}

// Sales Inventory
GET /api/inventory/sales/all?search={productMasterId}
```

## Calculation Formula

```javascript
netInventory = Math.max(0, purchaseInventory - salesInventory);
```

## Color Logic

```javascript
if (netInventory >= quantityRequired) {
  Color = GREEN ✓
} else {
  Color = RED ✗
}
```

## Troubleshooting

### Modal won't open?

- Check browser console (F12)
- Verify order has products

### Shows all zeros?

- Check Network tab for API calls
- Verify APIs are returning data
- Check database has records

### Wrong colors?

- Verify math: Purchase - Sales = Current
- Check quantityRequired value
- Compare with badge threshold

## Need Help?

See the detailed documentation files for:

- Technical implementation details
- API integration information
- Visual examples and test cases
- Troubleshooting guide
- Performance considerations

---

**Status**: Ready to Use  
**Last Updated**: January 8, 2026
