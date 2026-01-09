# Product Master × 4D Mapping Integration Guide

## Overview

The Product Master now integrates with the comprehensive 4-dimensional (4D) mapping system that validates all product combinations across:

- **123 Species** (Fish, Cephalopod, Crustacean, Gastropod, Bivalve)
- **81 Derivative Forms** (Raw, Cooked, RTC, RTE, etc.)
- **66 Sizes** (kg, pcs, count/lb)
- **4 Grades** (A: Premium, B: Standard, C: Processing)

**Result:** 2,000+ validated product combinations with automatic market segmentation, yield rates, shelf life, and pricing tiers.

---

## Database Schema

### ProductMaster Table Changes

Added new column:

```sql
species_derivative_size_grade_mapping_id UUID FOREIGN KEY
```

This links each product to its validated 4D combination.

### Sample Data

| Column                                       | Value                             | Source             |
| -------------------------------------------- | --------------------------------- | ------------------ |
| product_name                                 | POMFRET-RAW_WHOLE_ROUND-A-0.5-2kg | Auto-generated     |
| species_master_id                            | uuid-123                          | User input         |
| derivative_master_id                         | uuid-456                          | User input         |
| size_master_id                               | uuid-789                          | User input         |
| grade_master_id                              | uuid-abc                          | User input         |
| **species_derivative_size_grade_mapping_id** | uuid-mapping                      | ✅ **Auto-linked** |
| market_segment                               | Premium                           | From mapping       |
| expected_yield                               | 85%                               | From mapping       |
| shelf_life_days                              | 14                                | From mapping       |
| storage_temp_celsius                         | -18                               | From mapping       |
| pricing_tier                                 | Premium                           | From mapping       |

---

## API Endpoints

### 1. Create Product with 4D Validation

**Endpoint:** `POST /api/product-master/create-with-mapping`

**Request Body:**

```json
{
  "species_master_id": "03eafc4c-7918-4392-b2b6-d1f069ca78e4",
  "derivative_master_id": "uuid-raw-whole",
  "size_master_id": "uuid-size-05-2kg",
  "grade_master_id": "uuid-grade-a",
  "product_category_master_id": "uuid-category"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Product created successfully with 4D mapping validation",
  "product": {
    "id": "new-product-uuid",
    "product_name": "POMFRET-RAW_WHOLE_ROUND-A-0.5-2kg",
    "species_name": "Pomfret",
    "derivative": "RAW_WHOLE_ROUND",
    "size": "0.5-2 kg",
    "grade": "A",
    "market_segment": "Premium",
    "expected_yield": "85%",
    "shelf_life_days": 14,
    "storage_temp_celsius": -18,
    "packaging": "Vacuum",
    "pricing_tier": "Premium"
  }
}
```

**Error Response (400) - Invalid Combination:**

```json
{
  "success": false,
  "message": "Invalid combination: This species × derivative × size × grade combination is not valid or not viable",
  "code": "INVALID_COMBINATION"
}
```

**Error Response (409) - Duplicate Product:**

```json
{
  "success": false,
  "message": "Product already exists for this 4D combination",
  "code": "DUPLICATE_PRODUCT",
  "product_id": "existing-uuid",
  "product_name": "POMFRET-RAW_WHOLE_ROUND-A-0.5-2kg"
}
```

---

### 2. Get Product Suggestions

**Endpoint:** `GET /api/product-master/suggestions?species_id=uuid&derivative_id=uuid`

**Query Parameters:**

- `species_id`: UUID of species
- `derivative_id`: UUID of derivative form

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product suggestions retrieved",
  "suggestions": {
    "A": [
      {
        "size_id": "uuid-1",
        "size": "0.5-2 kg",
        "unit": "kg",
        "market_segment": "Premium",
        "pricing_tier": "Premium"
      },
      {
        "size_id": "uuid-2",
        "size": "2-5 kg",
        "unit": "kg",
        "market_segment": "Premium",
        "pricing_tier": "Premium"
      }
    ],
    "B": [
      {
        "size_id": "uuid-3",
        "size": "0.5-2 kg",
        "unit": "kg",
        "market_segment": "Export",
        "pricing_tier": "Standard"
      }
    ],
    "C": [
      {
        "size_id": "uuid-4",
        "size": "0.5-2 kg",
        "unit": "kg",
        "market_segment": "Processing",
        "pricing_tier": "Value"
      }
    ]
  },
  "total_combinations": 9
}
```

**Error Response (404) - No Combinations:**

```json
{
  "success": false,
  "message": "No valid combinations found for this species/derivative",
  "code": "NO_COMBINATIONS"
}
```

---

### 3. Validate Product Combination

**Endpoint:** `POST /api/product-master/validate-combination`

**Request Body:**

```json
{
  "species_master_id": "03eafc4c-7918-4392-b2b6-d1f069ca78e4",
  "derivative_master_id": "uuid-raw-whole",
  "size_master_id": "uuid-size-05-2kg",
  "grade_master_id": "uuid-grade-a"
}
```

**Valid Response (200):**

```json
{
  "success": true,
  "valid": true,
  "message": "Combination is valid",
  "details": {
    "market_segment": "Premium",
    "expected_yield": "85%",
    "shelf_life_days": 14,
    "storage_temp": -18,
    "pricing_tier": "Premium",
    "processing_difficulty": "Easy"
  }
}
```

**Invalid Response (200):**

```json
{
  "success": false,
  "valid": false,
  "message": "This combination is not valid",
  "code": "INVALID_COMBINATION"
}
```

---

## Model Associations

### ProductMaster Associations

```javascript
ProductMaster.belongsTo(SpeciesDerivativeSizeGradeMapping, {
  foreignKey: "species_derivative_size_grade_mapping_id",
  as: "MappingProfile",
});
```

**Usage in Code:**

```javascript
const product = await ProductMaster.findByPk(productId, {
  include: [
    {
      model: SpeciesDerivativeSizeGradeMapping,
      as: "MappingProfile",
      include: [
        "SpeciesMaster",
        "DerivativeMaster",
        "SizeMaster",
        "GradeMaster",
      ],
    },
  ],
});

console.log(product.MappingProfile.market_segment);
console.log(product.MappingProfile.expected_yield_percent);
```

---

## Data Validation Rules

### Automatic Validation in Product Creation

1. **Combination Exists**: Checks if species × derivative × size × grade exists in mapping table
2. **Is Viable**: Confirms `is_viable = true` in mapping
3. **Is Active**: Ensures all referenced records are active
4. **No Duplicates**: Prevents creating duplicate products for same mapping

### Example Invalid Combinations

| Species | Derivative     | Size     | Grade | Reason                          |
| ------- | -------------- | -------- | ----- | ------------------------------- |
| Pomfret | RAW_TUBES      | 0.5-2kg  | A     | Tubes only for Cephalopods      |
| Octopus | RAW_FILLET     | 10/20pcs | A     | Fillet only for Fish            |
| Shrimp  | RAW_TAILS      | 5-10kg   | B     | Tails only for Crustaceans <5kg |
| Scallop | COOKED_GRILLED | 1/4      | A     | Grilled only applicable to Fish |

---

## Grade System Integration

### Grade Codes and Market Meanings

| Grade | Code                | Market Segment           | Pricing Tier | Shelf Life |
| ----- | ------------------- | ------------------------ | ------------ | ---------- |
| **A** | Premium Export      | Sushi/Retail/Fine Dining | Premium      | 14 days    |
| **B** | Standard Export     | Horeca/Mainstream Export | Standard     | 10 days    |
| **C** | Domestic/Processing | Value-added/Co-packing   | Value        | 7 days     |
| **D** | Industrial          | Mince/Surimi/Feed        | Economy      | 3 days     |

---

## Practical Examples

### Example 1: Create Pomfret Whole Grade A Product

```javascript
const product = await createWithMapping({
  species_master_id: "pomfret-uuid",
  derivative_master_id: "raw-whole-uuid",
  size_master_id: "0.5-2kg-uuid",
  grade_master_id: "a-grade-uuid",
});

// Auto-assigned from mapping:
// - market_segment: "Premium"
// - expected_yield_percent: 85%
// - shelf_life_days: 14
// - storage_temperature_celsius: -18
// - pricing_tier: "Premium"
// - product_name: "POMFRET-RAW_WHOLE_ROUND-A-0.5-2kg"
```

### Example 2: Get Available Sizes for Shrimp MEAT_PACK

```javascript
const suggestions = await getSuggestions({
  species_id: "shrimp-uuid",
  derivative_id: "meat-pack-uuid",
});

// Returns all valid sizes across grades A, B, C
// with pricing tiers and market segments for each
```

### Example 3: Validate Before Product Creation

```javascript
const validation = await validateCombination({
  species_master_id: "tuna-uuid",
  derivative_master_id: "loin-uuid",
  size_master_id: "5-10kg-uuid",
  grade_master_id: "a-grade-uuid",
});

if (validation.valid) {
  // Proceed with product creation
  console.log("Market segment:", validation.details.market_segment);
  console.log("Pricing tier:", validation.details.pricing_tier);
}
```

---

## Benefits of 4D Integration

### ✅ Data Quality

- **Prevents invalid combinations**: No more incompatible species/derivative/size/grade products
- **Enforces business rules**: Only market-viable combinations allowed
- **Automatic enrichment**: Market segment, pricing, shelf life auto-assigned

### ✅ Operational Efficiency

- **Single source of truth**: One mapping table drives all validation
- **Reduced errors**: Validation happens at product creation time
- **Faster product onboarding**: Suggestions API guides users

### ✅ Business Intelligence

- **Consistent pricing**: Grade determines market segment and pricing tier
- **Inventory planning**: Shelf life and yield rates inform procurement
- **Market analysis**: Mapping reveals product portfolio by market segment

---

## Migration Path

### For Existing Products

To link existing products to 4D mappings:

```sql
UPDATE product_master pm
SET species_derivative_size_grade_mapping_id = sdsgm.id
FROM species_derivative_size_grade_mapping sdsgm
WHERE pm.species_master_id = sdsgm.species_master_id
  AND pm.derivative_master_id = sdsgm.derivative_master_id
  AND pm.size_master_id = sdsgm.size_master_id
  AND pm.grade_master_id = sdsgm.grade_master_id
  AND pm.is_active = true
  AND sdsgm.is_active = true;
```

### Validation Script

```javascript
// Find products NOT linked to 4D mapping
const unlinkedProducts = await ProductMaster.findAll({
  where: {
    species_derivative_size_grade_mapping_id: null,
    is_active: true,
  },
});

console.log(`Found ${unlinkedProducts.length} unlinked products`);

// For each, either:
// 1. Link to valid mapping
// 2. Mark as inactive if no valid mapping exists
```

---

## Best Practices

### ✅ DO

- Use validation endpoint before product creation
- Always provide all 4 IDs (species, derivative, size, grade)
- Check market_segment from mapping for pricing decisions
- Use suggestions API to guide users through valid options

### ❌ DON'T

- Create products without validating against 4D mapping
- Bypass the validation layer
- Manually assign market_segment instead of using mapping value
- Change grade/size/derivative after linking to mapping without re-validating

---

## Troubleshooting

### Product creation fails with "INVALID_COMBINATION"

**Check:**

1. Species category supports the derivative (Fish vs Cephalopod rules)
2. Size range is applicable to the derivative
3. Grade is allowed for the processing level
4. All records exist and are marked `is_active = true`

**Example:**

```javascript
// This fails: Tubes only for Cephalopods, not Fish
{
  species_master_id: "pomfret-uuid",  // Fish
  derivative_master_id: "raw-tubes-uuid",  // Only for Cephalopods
  ...
}
```

### Getting no suggestions

**Check:**

1. Query parameters are correct UUIDs
2. Species/derivative combination has at least one active mapping
3. Check mapping table: `SELECT * FROM species_derivative_size_grade_mapping WHERE species_master_id = ? AND derivative_master_id = ? AND is_active = true`

---

## Statistics

**Current 4D Mapping Coverage:**

| Metric             | Count  |
| ------------------ | ------ |
| Active Species     | 123    |
| Active Derivatives | 81     |
| Active Sizes       | 66     |
| Grades             | 4      |
| Valid Combinations | 2,000+ |
| Coverage %age      | ~65%   |

**By Processing Level:**

| Level          | Count |
| -------------- | ----- |
| Raw            | 800+  |
| Semi-Processed | 300+  |
| Cooked         | 400+  |
| Formed/RTC/RTE | 500+  |

---

## Related Documentation

- [SPECIES_DERIVATIVE_SIZE_GRADE_MAPPING.md](./SPECIES_DERIVATIVE_SIZE_GRADE_MAPPING.md) - 4D mapping system overview
- [GRADE_SYSTEM.md](./GRADE_SYSTEM.md) - Grade definitions and market meanings
- [API_ENDPOINT_REFERENCE.md](./API_ENDPOINT_REFERENCE.md) - Full API documentation
