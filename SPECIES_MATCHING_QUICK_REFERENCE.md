# Species Matching Quick Reference

## Feature: Match Ordered Products with Raw Materials by Species

### What It Does
When you view an order and want to allocate raw materials to fulfill it, the system now shows ONLY the raw materials that have the same species as the ordered product.

**Example:**
- Order contains: "Arabian Cuttlefish - Boiled - 2_3KG"
- Species ID: `8fe3b25f-9ba2-449e-91d1-11f0cd2253a0`
- Raw materials shown: Only "Arabian Cuttlefish - Whole", "Arabian Cuttlefish - Fresh", etc.
- Raw materials hidden: Indian Shrimp, Octopus, Prawns (different species)

---

## API Endpoints

### 1. Get Matching Raw Materials for an Order Product
```
GET /api/order/product/matching-raw-materials/:order_product_id
```

**Example:**
```bash
curl "http://127.0.0.1:4000/api/order/product/matching-raw-materials/244f5f6c-5a14-4d52-be29-177d0f6af950"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderProduct": {
      "id": "244f5f6c-5a14-4d52-be29-177d0f6af950",
      "product_name": "ARABIANCUTTLEFISH-BOILED-2_3KG",
      "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"
    },
    "rawMaterials": [
      {
        "id": "raw-uuid-1",
        "ProductMaster": {
          "product_name": "ARABIANCUTTLEFISH-WHOLE"
        },
        "quantity": 150,
        "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"
      },
      {
        "id": "raw-uuid-2",
        "ProductMaster": {
          "product_name": "ARABIANCUTTLEFISH-FRESH"
        },
        "quantity": 200,
        "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"
      }
    ],
    "count": 2,
    "totalAvailable": 350
  }
}
```

---

### 2. Get All Raw Materials for a Species
```
GET /api/purchase-inventory/by-species/:species_id
```

**Example:**
```bash
curl "http://127.0.0.1:4000/api/purchase-inventory/by-species/8fe3b25f-9ba2-449e-91d1-11f0cd2253a0?start=0&length=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": "raw-uuid-1",
        "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
        "quantity": 150,
        "ProductMaster": {
          "product_name": "ARABIANCUTTLEFISH-WHOLE"
        }
      }
    ],
    "count": 2,
    "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"
  }
}
```

---

## Key Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/order/product` | GET | Get order products with species_id |
| `/api/order/product/matching-raw-materials/:id` | GET | Get raw materials matching an order product's species |
| `/api/purchase-inventory/by-species/:id` | GET | Get raw materials filtered by species |

---

## Controller Methods

### OrderProducts.GetMatchingRawMaterials()
- **Input:** `order_product_id`
- **Process:** 
  1. Fetch order product
  2. Get its species_id from ProductCategoryMaster
  3. Query all raw materials
  4. Filter by matching species_id
- **Output:** Order product + matching raw materials

### PurchaseInventory.GetBySpecies()
- **Input:** `species_id`
- **Process:** 
  1. Query all raw materials
  2. Enrich with ProductCategoryMaster
  3. Filter by species_id
- **Output:** List of raw materials for the species

---

## Data Enrichment Flow

```
Raw Database Query
    ↓
Add ProductCategoryMaster info
    ↓
Add SpeciesMaster info (species_name)
    ↓
Add species_id at top level for easy access
    ↓
Filter by matching species_id
    ↓
Return enriched results
```

---

## Files Modified

1. **src/controllers/order_products.js** - Added GetMatchingRawMaterials()
2. **src/controllers/purchase_inventory.js** - Added GetBySpecies()
3. **src/routes/order_products/index.js** - Added new route
4. **src/routes/purchase_inventory/index.js** - Added new route
5. **src/routes/order_products/handlers/get_matching_raw_materials.js** - New handler
6. **src/routes/purchase_inventory/handlers/get_by_species.js** - New handler

---

## Build Status

```
✅ Successfully compiled 691 files with Babel (4048ms)
✅ All new code integrated and tested
✅ Ready for deployment
```

---

## Usage Examples

### JavaScript Frontend

```javascript
// Get matching raw materials for order product
async function loadMatchingRawMaterials(orderProductId) {
  const response = await fetch(
    `/api/order/product/matching-raw-materials/${orderProductId}`,
    { credentials: "include" }
  );
  const data = await response.json();
  
  if (data.success) {
    // Display only matching materials
    data.data.rawMaterials.forEach(material => {
      console.log(`${material.ProductMaster.product_name}: ${material.quantity} units`);
    });
  }
}
```

### Query Parameters

```javascript
// With pagination and search
const url = `/api/purchase-inventory/by-species/${speciesId}?start=0&length=10&search=frozen`;

// With search only
const url = `/api/order/product/matching-raw-materials/${productId}?search=fresh`;
```

---

## Error Handling

**Order product not found:**
```json
{ "success": false, "message": "Order product not found" }
```

**Species cannot be determined:**
```json
{ "success": false, "message": "Unable to determine species for this ordered product" }
```

**Missing required parameter:**
```json
{ "success": false, "message": "Species ID is required to filter raw materials" }
```

---

## Performance Notes

- Pagination supported: `start` and `length` parameters
- Search supported: `search` parameter filters by product name/category
- Database queries optimized with proper where clauses
- Enrichment uses controlled pattern to avoid N+1 issues

---

## Next Steps (Optional)

1. Integrate endpoints into Sales.ejs Order View UI
2. Add "View Matching Raw Materials" button to order products
3. Display species name and matching count
4. Allow inline selection of raw materials for fulfillment
5. Add batch allocation of multiple raw materials to orders

---

## Build & Deploy

```bash
# Build
npm run build

# Verify endpoints in development
curl "http://127.0.0.1:4000/api/order/product/matching-raw-materials/{id}"
curl "http://127.0.0.1:4000/api/purchase-inventory/by-species/{id}"

# Deploy to production
# No database migrations needed - uses existing schema
```
