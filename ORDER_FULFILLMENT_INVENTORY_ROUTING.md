# Order Fulfillment Inventory Routing

## Overview

This feature implements intelligent order fulfillment routing based on raw material availability in inventory. When an order is placed, the system automatically checks if raw materials for the ordered product are already in stock. If available, the order is routed directly to **production**. If not, it's routed to **procurement**.

## Business Logic

```
Order Created
    ↓
Check Raw Material Inventory
    ↓
    ├─ Material IN STOCK → Route to PRODUCTION (faster fulfillment)
    │
    └─ Material NOT IN STOCK → Route to PROCUREMENT (source raw materials)
```

## Architecture

### Services

#### `src/services/order_fulfillment.js`

Core service handling inventory checks and routing decisions.

**Exported Functions:**

1. **`checkRawMaterialAvailability(product_master_id)`**
   - Checks if raw material exists in inventory for a product
   - Returns:
     ```javascript
     {
       hasStock: boolean,
       availableQuantity: number,
       rawMaterial: {
         id: uuid,
         name: string,
         derivative_id: uuid
       },
       message: string,
       error?: string
     }
     ```

2. **`determineOrderRoute(product_master_id)`**
   - Determines whether order should go to PRODUCTION or PROCUREMENT
   - Returns:
     ```javascript
     {
       route: "PRODUCTION" | "PROCUREMENT",
       reason: string,
       stockCheck: {...}  // Full inventory check result
     }
     ```

3. **`createOrderFulfillmentPath(orderProduct, orderId, profileId)`**
   - Creates fulfillment path record for tracking
   - Can be extended to create fulfillment tracking table records

### Routes

#### `GET /api/orders/check-fulfillment-route/:product_master_id`

Check the fulfillment route for an ordered product.

**Query Parameters:**
- `order_id` (optional): The order ID for reference

**Response Example:**
```json
{
  "success": true,
  "message": "Order routed to PRODUCTION",
  "data": {
    "product_master_id": "550e8400-e29b-41d4-a716-446655440000",
    "fulfillment_route": "PRODUCTION",
    "reason": "Raw material available in inventory",
    "rawMaterialAvailable": true,
    "availableQuantity": 500,
    "rawMaterial": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Mud Crab - Raw Whole",
      "derivative_id": "770e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

## Integration Points

### 1. Order Creation

When an order is created with products:

```javascript
// In Orders.afterCreate hook (models/orders.js)
const routeDecision = await determineOrderRoute(product_master_id);
// route: "PRODUCTION" | "PROCUREMENT"
```

### 2. Order Products

Each order product can have fulfillment routing applied:

```javascript
// Check before creating procurement record
if (routeDecision.route === "PROCUREMENT") {
  // Create procurement request
} else if (routeDecision.route === "PRODUCTION") {
  // Create production order directly
}
```

### 3. Inventory Tracking

The service integrates with:
- `ProductMaster` - To get product details and derivatives
- `Packing` - To check available stock in warehouse
- `PeeledDispatches` - To calculate net available quantity (stock - dispatched)
- `DerivativeMaster` - To identify raw vs. processed materials

## Data Model

### Inventory Stock Calculation

```sql
Total Available = 
  SUM(packing.quantity) 
  - SUM(peeled_dispatches.quantity) 
  WHERE is_active = true
```

### Raw Material Identification

Products with derivatives like:
- `RAW_WHOLE_ROUND` - Raw whole/round material
- `RAW_FILLET` - Raw fillet cuts
- `RAW_TUBE` - Raw tube forms
- `RAW_TAIL` - Raw tail pieces
- `SEMI_MINCED` - Semi-minced materials
- `SEMI_PD` - Semi-peeled and deveined

Are considered raw materials vs. finished products like:
- `COOKED_BOILED`
- `RTC_BREADED`
- `RTE_CANNED`
- `STOCK_BASE`

## API Usage Examples

### Example 1: Check Route for Single Product

```bash
curl -X GET "http://localhost:4000/api/orders/check-fulfillment-route/550e8400-e29b-41d4-a716-446655440000"
```

### Example 2: Check Route with Order Reference

```bash
curl -X GET "http://localhost:4000/api/orders/check-fulfillment-route/550e8400-e29b-41d4-a716-446655440000?order_id=660e8400-e29b-41d4-a716-446655440001"
```

## Configuration & Customization

### Adjusting Raw Material Identification

Modify the raw material derivative search in `order_fulfillment.js`:

```javascript
// Find raw materials - currently searches for "RAW%" prefix
const rawMaterialDerivatives = await models.DerivativeMaster.findAll({
  where: {
    derivative_code: {
      [Op.iLike]: "RAW%",  // <-- Customize this pattern
    },
    is_active: true,
  },
});
```

### Minimum Quantity Threshold

Add a minimum quantity requirement:

```javascript
const MIN_INVENTORY_THRESHOLD = 100;  // units

if (totalAvailableQuantity >= MIN_INVENTORY_THRESHOLD) {
  return { hasStock: true, ... };
}
```

## Status & Next Steps

### Completed ✅
- [x] Order fulfillment service created
- [x] Inventory availability check implemented
- [x] Route determination logic implemented
- [x] API endpoint for checking fulfillment route
- [x] Integration placeholder in Orders model

### To Implement 📋
- [ ] Fulfillment tracking table/model (optional)
- [ ] Automatic fulfillment path creation on order placement
- [ ] Production order creation for PRODUCTION route
- [ ] Procurement request creation for PROCUREMENT route
- [ ] Order status updates based on fulfillment route
- [ ] Dashboard/UI for viewing order routing status
- [ ] Notifications for different routing paths
- [ ] Fulfillment performance analytics

## Testing

### Test Case 1: Raw Material Available
```javascript
// Product: Mud Crab - Cooked Boiled
// Raw Material: Mud Crab - Raw Whole (500 units in stock)
// Expected Route: PRODUCTION
```

### Test Case 2: Raw Material Not Available
```javascript
// Product: King Crab - RTC Breaded
// Raw Material: King Crab - Raw Whole (0 units in stock)
// Expected Route: PROCUREMENT
```

### Test Case 3: Species Mismatch
```javascript
// Product: Shrimp - Cooked
// Raw Material: Not found for this species
// Expected Route: PROCUREMENT (fallback)
```

## Error Handling

The service gracefully handles:
- Missing products
- Missing derivatives
- No inventory records
- Database connection errors
- Invalid UUID formats

All errors default to PROCUREMENT route as a safe fallback to ensure orders can proceed.

## Performance Considerations

- Query optimization: Uses indexed lookups on `product_master_id` and `derivative_master_id`
- Caching: Can be added for derivative lookups (derivative codes change infrequently)
- Async processing: Fulfillment routing can be queued asynchronously

## Related Documentation

- `SPECIES_FIX_COMPLETE.md` - Product-species mapping foundation
- `RAW_PRODUCTS_SPECIES_MAPPING_COMPLETE.md` - Raw product organization
- `PRODUCTION_ORDER_MANAGEMENT.md` - Production workflow
- `MASTER_DATA_REFERENCE.md` - Master data model reference

---

**Last Updated:** January 11, 2026
**Status:** Implementation Complete ✅
