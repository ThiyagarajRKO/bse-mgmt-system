# Species ID Matching: Ordered Products to Raw Materials

**Status:** ✅ IMPLEMENTATION COMPLETE  
**Date:** 11 January 2026  
**Build:** Successfully compiled 691 files with Babel (4048ms)

## Overview

This feature enables matching species IDs of ordered (processed) products with available raw materials, displaying only raw materials that belong to the same species as ordered products. This ensures accurate fulfillment and inventory management.

## API Endpoints

### 1. Get Raw Materials Matching an Ordered Product

**Endpoint:** `GET /api/order/product/matching-raw-materials/:order_product_id`

**Purpose:** Retrieve all raw materials that match the species of a specific ordered product.

**Parameters:**

- `order_product_id` (Path) - UUID of the order product to match
- `start` (Query, optional) - Pagination offset, default: 0
- `length` (Query, optional) - Page size, default: 10
- `search` (Query, optional) - Search filter for product name or category

**Response:**

```json
{
  "success": true,
  "message": "Found 5 matching raw materials for this ordered product (250 units total)",
  "data": {
    "orderProduct": {
      "id": "244f5f6c-5a14-4d52-be29-177d0f6af950",
      "product_name": "ARABIANCUTTLEFISH-BOILED-2_3KG",
      "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"
    },
    "rawMaterials": [
      {
        "id": "raw-material-uuid-1",
        "procurement_product_type": "FROZEN",
        "quantity": 100,
        "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
        "ProductMaster": {
          "id": "product-uuid",
          "product_name": "ARABIANCUTTLEFISH-WHOLE",
          "ProductCategoryMaster": {
            "id": "category-uuid",
            "product_category": "Whole",
            "species_master_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
            "SpeciesMaster": {
              "id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
              "species_name": "Arabian Cuttlefish"
            }
          }
        }
      }
    ],
    "count": 5,
    "totalAvailable": 150,
    "message": "Found 5 matching raw materials..."
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Order product not found"
}
```

**Error Response (422):**

```json
{
  "success": false,
  "message": "Unable to determine species for this ordered product"
}
```

---

### 2. Get Raw Materials Filtered by Species

**Endpoint:** `GET /api/purchase-inventory/by-species/:species_id`

**Purpose:** Retrieve all raw materials for a specific species.

**Parameters:**

- `species_id` (Path) - UUID of the species to filter by
- `start` (Query, optional) - Pagination offset, default: 0
- `length` (Query, optional) - Page size, default: 10
- `search` (Query, optional) - Search filter for product name or category

**Response:**

```json
{
  "success": true,
  "message": "Found 8 raw materials matching species 8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
  "data": {
    "rows": [
      {
        "id": "raw-material-uuid-1",
        "procurement_product_type": "FROZEN",
        "quantity": 150,
        "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
        "ProductMaster": {
          "id": "product-uuid",
          "product_name": "ARABIANCUTTLEFISH-WHOLE",
          "ProductCategoryMaster": {
            "id": "category-uuid",
            "product_category": "Whole",
            "species_master_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
            "SpeciesMaster": {
              "id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
              "species_name": "Arabian Cuttlefish"
            }
          }
        }
      }
    ],
    "count": 8,
    "species_id": "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0",
    "message": "Found 8 raw materials matching species..."
  }
}
```

---

## Data Flow

### Flow Diagram

```
Order View (Sales.ejs)
    ↓
GET /api/order/product?order_id=...
    ↓
OrderProducts.GetAll()
    ↓
Enrich with species_id from ProductCategoryMaster
    ↓
Display Order Products with species_id ✅
    ↓
User clicks "View Matching Raw Materials"
    ↓
GET /api/order/product/matching-raw-materials/:order_product_id
    ↓
GetMatchingRawMaterials()
    • Fetch order product from DB
    • Get species_id from ProductCategoryMaster
    • Query all purchase inventories
    • Enrich with ProductCategoryMaster & SpeciesMaster
    • Filter by matching species_id
    ↓
Display only raw materials with matching species ✅
    ↓
User can allocate matching raw materials to order product
```

### Data Relationships

```
OrderProduct
├── ProductMaster
│   ├── product_name: "Arabian Cuttlefish – Boiled – 2_3KG"
│   └── ProductCategoryMaster
│       ├── product_category: "Boiled"
│       └── species_master_id: "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0" ◄── KEY MATCH
│           └── SpeciesMaster
│               └── species_name: "Arabian Cuttlefish"

PurchaseInventory (Raw Material)
├── ProductMaster
│   ├── product_name: "Arabian Cuttlefish – Whole"
│   └── ProductCategoryMaster
│       ├── product_category: "Whole"
│       └── species_master_id: "8fe3b25f-9ba2-449e-91d1-11f0cd2253a0" ◄── MATCH!
│           └── SpeciesMaster
│               └── species_name: "Arabian Cuttlefish"
```

---

## Implementation Details

### Controller Methods

#### 1. `OrderProducts.GetMatchingRawMaterials()`

**Location:** `src/controllers/order_products.js`

**Function:**

- Takes `order_product_id` as input
- Fetches the ordered product and its species_id
- Queries all raw materials (PurchaseInventory)
- Enriches raw materials with ProductCategoryMaster and SpeciesMaster
- Filters to only return raw materials with matching species_id
- Returns order product info and filtered raw materials list

**Key Logic:**

```javascript
// 1. Get order product and its species
const orderProduct = await OrderProducts.findOne(...);
const species_id = await ProductCategoryMaster.findOne(...);

// 2. Fetch all raw materials
const purchaseInventories = await PurchaseInventory.findAndCountAll(...);

// 3. Enrich and filter
const matchingRawMaterials = enrichedRows.filter(
  (row) => row.species_id === species_id
);
```

#### 2. `PurchaseInventory.GetBySpecies()`

**Location:** `src/controllers/purchase_inventory.js`

**Function:**

- Takes `species_id` as input parameter
- Queries all raw materials from PurchaseInventory
- Enriches with ProductCategoryMaster and SpeciesMaster
- Filters to only return materials with matching species_id
- Supports pagination and search

**Key Logic:**

```javascript
// Filter to only include materials matching species_id
const filteredRows = enrichedRows.filter(
  (row) => row.species_id === species_id
);
```

### Route Handlers

#### 1. Order Product Matching Raw Materials

**File:** `src/routes/order_products/handlers/get_matching_raw_materials.js`
**Route:** `GET /api/order/product/matching-raw-materials/:order_product_id`

#### 2. Purchase Inventory by Species

**File:** `src/routes/purchase_inventory/handlers/get_by_species.js`
**Route:** `GET /api/purchase-inventory/by-species/:species_id`

---

## Code Changes Summary

### Modified Files

**1. `src/controllers/order_products.js`**

- Added `GetMatchingRawMaterials()` method (130 lines)
- Filters raw materials by matching species_id of ordered product
- Returns detailed information about matching raw materials
- Includes error handling for invalid order product ID

**2. `src/controllers/purchase_inventory.js`**

- Added `GetBySpecies()` method (120 lines)
- Filters purchase inventory by species_id
- Enriches results with ProductCategoryMaster and SpeciesMaster
- Supports pagination and search filters

**3. `src/routes/order_products/index.js`**

- Added import for `GetMatchingRawMaterialsHandler`
- Added route: `GET /api/order/product/matching-raw-materials/:order_product_id`
- Properly handles path parameters and query parameters

**4. `src/routes/purchase_inventory/index.js`**

- Added import for `GetBySpeciesHandler`
- Added route: `GET /api/purchase-inventory/by-species/:species_id`
- Handles pagination and search filters

### New Files Created

1. `src/routes/order_products/handlers/get_matching_raw_materials.js` - Handler for matching raw materials endpoint
2. `src/routes/purchase_inventory/handlers/get_by_species.js` - Handler for species-filtered raw materials endpoint

---

## Testing Guide

### Test 1: Get Raw Materials for an Ordered Product

```bash
# Get an order product UUID first
ORDER_ID="64e39a97-d9f6-455e-a419-97c63e25ae51"
ORDER_PRODUCT_ID="244f5f6c-5a14-4d52-be29-177d0f6af950"

# Request matching raw materials
curl -X GET \
  "http://127.0.0.1:4000/api/order/product/matching-raw-materials/${ORDER_PRODUCT_ID}" \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json"
```

**Expected Result:**

- Returns order product with its species_id
- Shows only raw materials with the same species_id
- Lists total quantity of matching materials

### Test 2: Filter Raw Materials by Species

```bash
# Get all raw materials for a specific species
SPECIES_ID="8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"

curl -X GET \
  "http://127.0.0.1:4000/api/purchase-inventory/by-species/${SPECIES_ID}?start=0&length=10" \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json"
```

**Expected Result:**

- Returns only raw materials matching the species
- Shows count of matching materials
- Includes full product and species information

### Test 3: Search Within Species

```bash
# Search for specific raw material type within a species
SPECIES_ID="8fe3b25f-9ba2-449e-91d1-11f0cd2253a0"

curl -X GET \
  "http://127.0.0.1:4000/api/purchase-inventory/by-species/${SPECIES_ID}?search=FROZEN&start=0&length=10" \
  -H "Cookie: sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json"
```

---

## Frontend Integration

### Example JavaScript Usage

```javascript
// Fetch matching raw materials for an ordered product
async function getMatchingRawMaterials(orderProductId) {
  try {
    const response = await fetch(
      `/api/order/product/matching-raw-materials/${orderProductId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include session cookie
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log("Matching raw materials:", result.data.rawMaterials);
      console.log(
        "Total matching quantity:",
        result.data.rawMaterials.reduce((sum, r) => sum + (r.quantity || 0), 0)
      );

      // Display in a dropdown or table
      displayRawMaterials(result.data.rawMaterials);
    } else {
      console.error("Error:", result.message);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

// Display matching raw materials in a dropdown
function displayRawMaterials(materials) {
  const dropdown = document.getElementById("rawMaterialsDropdown");
  dropdown.innerHTML = "";

  materials.forEach((material) => {
    const option = document.createElement("option");
    option.value = material.id;
    option.textContent = `${material.ProductMaster.product_name} (${material.quantity} units)`;
    dropdown.appendChild(option);
  });
}
```

---

## Performance Considerations

### Query Performance

- **Pagination:** Implemented with `start` and `length` parameters to limit database load
- **N+1 Queries:** Mitigated through controlled enrichment pattern
- **Database Indexes:** Uses existing indexes on:
  - `product_category_master.id`
  - `species_master.id`
  - `purchase_inventory.product_category_master_id`

### Optimization Opportunities (Future)

1. **Eager Loading:** Once Sequelize associations are fixed, use nested includes
2. **Caching:** Cache species_id lookups for frequently accessed products
3. **Batch Operations:** Group multiple enrichment queries per batch request
4. **Database Views:** Create materialized view for species-product mapping

---

## Error Handling

### Status Codes and Messages

| Status | Scenario                     | Message                                                   |
| ------ | ---------------------------- | --------------------------------------------------------- |
| 200    | Success                      | "Found X matching raw materials for this ordered product" |
| 404    | Order product not found      | "Order product not found"                                 |
| 422    | Species cannot be determined | "Unable to determine species for this ordered product"    |
| 422    | Missing required parameter   | "Species ID is required to filter raw materials"          |
| 400    | Other errors                 | Specific error message from database                      |

---

## Summary

This feature provides a critical workflow enhancement for order fulfillment:

✅ **Ordered Product** → Species ID extracted  
✅ **Raw Materials** → Filtered by matching species  
✅ **Inventory Management** → Only relevant materials shown  
✅ **Data Integrity** → Ensures correct species matching

The implementation follows existing patterns in the codebase and maintains backward compatibility while adding powerful new capabilities for fulfillment operations.
