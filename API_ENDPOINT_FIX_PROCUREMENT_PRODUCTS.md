# API Endpoint Fix - Purchase Request Side Panel

## Issue

The side panel was trying to call a non-existent API endpoint:

```
GET /api/procurement/products?productId=acf1c247-8422-4ba0-80f4-22eddd03252a
```

Result: **404 Not Found**

## Root Cause

The API endpoint has two issues:

1. **Endpoint path is wrong**: `/procurement/products` (plural) instead of `/procurement/product` (singular)
2. **Query parameter name is wrong**: `productId` instead of `product_master_id`

## Solution Applied

### Changed in `/views/Sales.ejs`

Function: `loadRawMaterialsForPurchaseRequest()`

**Before:**

```javascript
url: `/api/procurement/products?productId=${productId}`,
```

**After:**

```javascript
url: `/api/procurement/product?product_master_id=${productId}`,
```

## Correct API Route Registration

Located in `/src/routes/index.js` (line 109-111):

```javascript
fastify.register(procurementProductsRoute, {
  prefix: "/procurement/product",
});
```

## API Endpoint Details

### Endpoint

```
GET /api/procurement/product
```

### Query Parameters

- `product_master_id` (UUID) - The product master ID to fetch procurement products for

### Expected Response

```json
{
  "success": true,
  "data": [
    {
      "id": "procurement-product-uuid",
      "procurement_product_name": "Raw Material Name",
      "available_quantity": 50
    },
    ...
  ]
}
```

## Files Modified

- `/views/Sales.ejs` - Line 3471

## Testing

After this fix, when user clicks "Raise Purchase Request":

1. ✅ AI calculation loads (POST to calculate/requirements)
2. ✅ Product details load (GET /master/product/:id)
3. ✅ Raw materials load (GET /procurement/product?product_master_id=...)
4. ✅ Materials display in the side panel with selection options
5. ✅ User can select material and quantity
6. ✅ Create request button submits the purchase request

## Related Files

- Route Handler: `/src/routes/procurement_products/handlers/get_all.js`
- Route Schema: `/src/routes/procurement_products/schema/get_all.js`
- Side Panel: `/views/Sales.ejs` lines 741-792
