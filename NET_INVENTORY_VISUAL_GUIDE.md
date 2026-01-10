# Net Inventory in Available Stock - Visual Comparison

## BEFORE Implementation

```
Order Details Modal
═══════════════════════════════════════════════════════
Order No                          Allocation Status
12345                             ✓ Allocated

Product Name
Cashew Nuts (Grade A)

Quantity Required    │  Available Stock
200 units           │  350 [Green Badge]
```

**Problem**: Only showing single number without breakdown

- Users don't know:
  - How much was originally purchased
  - How much has been sold
  - Whether the figure is accurate

---

## AFTER Implementation

```
Order Details Modal
═══════════════════════════════════════════════════════
Order No                          Allocation Status
12345                             ✓ Allocated

Product Name
Cashew Nuts (Grade A)

Quantity Required    │  Available Stock (Net Inventory)
200 units           │  ┌─────────────────────────────┐
                    │  │ Purchase Inventory: 500     │
                    │  │ Sales Inventory: 150        │
                    │  │                             │
                    │  │ Current: 350 units ✓        │
                    │  └─────────────────────────────┘
```

**Benefits**:

- ✅ Full transparency on inventory breakdown
- ✅ Users see purchase and sales quantities
- ✅ Clear understanding of net available stock
- ✅ Color-coded status (green/red)
- ✅ Informed decision-making for purchase requests

---

## Display States by Scenario

### Scenario A: Sufficient Stock (Green Badge)

```
Available Stock (Net Inventory):
┌────────────────────────────────────┐
│ Purchase Inventory: 500 units      │
│ Sales Inventory: 150 units         │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ Current: 350 units       ✓  │  │
│ └──────────────────────────────┘  │
│ (Green Badge - Sufficient)         │
└────────────────────────────────────┘
```

### Scenario B: Low Stock (Red Badge)

```
Available Stock (Net Inventory):
┌────────────────────────────────────┐
│ Purchase Inventory: 100 units      │
│ Sales Inventory: 80 units          │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ Current: 20 units        ✗  │  │
│ └──────────────────────────────┘  │
│ (Red Badge - Insufficient)         │
└────────────────────────────────────┘
```

### Scenario C: Out of Stock (Red Badge)

```
Available Stock (Net Inventory):
┌────────────────────────────────────┐
│ Purchase Inventory: 100 units      │
│ Sales Inventory: 120 units         │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ Current: 0 units         ✗  │  │
│ └──────────────────────────────┘  │
│ (Red Badge - Out of Stock)         │
└────────────────────────────────────┘
```

---

## User Workflow

### Complete Order Viewing Flow

```
1. USER CLICKS ORDER ROW
   ↓
2. SYSTEM FETCHES DATA
   ├─ GET /api/order/check-inventory/[id]
   │  └─ Returns: purchaseInventory = 500
   │
   └─ GET /api/inventory/sales/all?search=[id]
      └─ Returns: salesInventory = 150

3. CALCULATE NET INVENTORY
   └─ netInventory = 500 - 150 = 350

4. DISPLAY MODAL WITH BREAKDOWN
   └─ Shows all three values with color coding

5. USER MAKES DECISION
   ├─ If GREEN (sufficient): Click "Raise Purchase Request"
   └─ If RED (insufficient): Evaluate if request is still needed
```

---

## HTML Structure (Simplified)

```html
<div class="row mb-3">
  <div class="col-md-6">
    <h6><strong>Quantity Required:</strong></h6>
    <p>200</p>
  </div>

  <div class="col-md-6">
    <h6><strong>Available Stock (Net Inventory):</strong></h6>

    <!-- Inventory Breakdown Box -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div
        style="padding: 8px; background: #f5f5f5; 
                  border-radius: 3px; border-left: 3px solid #627293;"
      >
        <small style="color: #666;">
          <div><strong>Purchase Inventory:</strong> 500 units</div>
          <div><strong>Sales Inventory:</strong> 150 units</div>
        </small>
      </div>

      <!-- Status Badge -->
      <p>
        <span
          class="badge badge-success"
          style="font-size: 1em; padding: 8px 12px;"
        >
          Current: 350 units
        </span>
      </p>
    </div>
  </div>
</div>
```

---

## Styling Breakdown

### Breakdown Box

| Property        | Value             | Purpose                  |
| --------------- | ----------------- | ------------------------ |
| `padding`       | 8px               | Content spacing          |
| `background`    | #f5f5f5           | Light gray background    |
| `border-radius` | 3px               | Subtle rounded corners   |
| `border-left`   | 3px solid #627293 | Accent color (dark blue) |
| `font-size`     | 0.875em           | Small, readable text     |
| `color`         | #666              | Muted gray text          |

### Status Badge

| Property    | Value                | Purpose                         |
| ----------- | -------------------- | ------------------------------- |
| `class`     | badge-success/danger | Dynamic color coding            |
| `font-size` | 1em                  | Prominent display               |
| `padding`   | 8px 12px             | Spacious button-like appearance |
| `display`   | inline-block         | Natural badge sizing            |

---

## Data Flow Diagram

```
Order Clicked
    │
    ├─→ [API Call 1]
    │   GET /api/order/check-inventory/{productMasterId}
    │   └─→ purchaseInventory = 500
    │
    ├─→ [API Call 2]
    │   GET /api/inventory/sales/all?search={productMasterId}
    │   └─→ salesInventory = 150
    │
    └─→ [Calculation]
        netInventory = Math.max(0, 500 - 150) = 350

        [Decision]
        if (netInventory >= quantityRequired) {
            badgeColor = GREEN ✓
        } else {
            badgeColor = RED ✗
        }

        [Display Modal]
        Show order details with net inventory breakdown
```

---

## Key Differences

| Aspect                 | Before             | After                 |
| ---------------------- | ------------------ | --------------------- |
| **Information Shown**  | Single number only | Breakdown + net total |
| **Purchase Inventory** | Hidden             | Displayed             |
| **Sales Inventory**    | Hidden             | Displayed             |
| **Transparency**       | Low                | High                  |
| **User Understanding** | Unclear            | Clear                 |
| **Decision Quality**   | Limited            | Informed              |
| **Visual Clarity**     | Minimal            | Clear hierarchy       |

---

## Performance Impact

### API Calls Added

- **2 API calls**: One for purchase, one for sales inventory
- **Synchronous**: Uses `async: false` for proper ordering
- **Timeout**: 5 seconds per call
- **Fallback**: Still displays modal if APIs fail

### Load Time

- **Network**: ~100-200ms total (depends on API speed)
- **Rendering**: Instant (simple HTML)
- **User Experience**: Minimal impact (most users won't notice)

### Optimization Notes

- Consider implementing caching for future improvements
- Could switch to async/await for better performance
- Consider debouncing multiple clicks

---

## Browser Compatibility

✅ **Fully Compatible**

- Modern browsers: Chrome, Firefox, Safari, Edge
- IE11: Requires babel transpilation (already configured)
- Mobile: Responsive design works on all screen sizes

---

## Accessibility

✅ **Accessibility Features**

- Semantic HTML structure
- Clear color contrast (dark text on light background)
- Badge colors for status (green/red + descriptive text)
- Descriptive labels for all values
- Proper modal ARIA attributes

---

## Testing Examples

### Test Case 1: View Order with Sufficient Stock

```
Given: Order requires 200 units
  And: Purchase inventory is 500 units
  And: Sales inventory is 150 units
When: User clicks to view order
Then: Modal shows:
  - Purchase Inventory: 500
  - Sales Inventory: 150
  - Current: 350 (GREEN badge)
```

### Test Case 2: View Order with Low Stock

```
Given: Order requires 200 units
  And: Purchase inventory is 100 units
  And: Sales inventory is 80 units
When: User clicks to view order
Then: Modal shows:
  - Purchase Inventory: 100
  - Sales Inventory: 80
  - Current: 20 (RED badge)
```

### Test Case 3: View Order with No Stock

```
Given: Order requires 200 units
  And: Purchase inventory is 100 units
  And: Sales inventory is 120 units
When: User clicks to view order
Then: Modal shows:
  - Purchase Inventory: 100
  - Sales Inventory: 120
  - Current: 0 (RED badge)
```

---

## Summary

The net inventory display in the Available Stock section provides users with:

- ✅ Complete transparency on inventory breakdown
- ✅ Clear understanding of purchase vs. sales quantities
- ✅ Accurate net available stock calculation
- ✅ Visual indicators (color-coded badges)
- ✅ Informed decision-making capability

All while maintaining backward compatibility and minimal performance impact.
