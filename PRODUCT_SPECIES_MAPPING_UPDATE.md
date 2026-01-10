# Product Species Mapping Update

**Date:** 10 January 2026  
**File Updated:** `seeders/20260109-generate-products-from-mappings.js`

## Overview

Updated the product generation seeder to correctly map products with their proper species names and product categories.

## Key Changes

### 1. Enhanced Database Query

**Before:** Retrieved only basic 4D mapping details

```sql
SELECT sdsgm.id, s.species_code, s.species_name, ...
FROM species_derivative_size_grade_mapping sdsgm
LEFT JOIN ...
```

**After:** Now includes product category mapping for each species

```sql
SELECT sdsgm.id, ...,
       pcm.id as product_category_master_id,
       pcm.product_category
FROM species_derivative_size_grade_mapping sdsgm
LEFT JOIN product_category_master pcm ON pcm.species_master_id = s.id
```

### 2. Dynamic Category Mapping

Added a species-to-category mapping cache to ensure each product is assigned to the correct product category:

```javascript
// Get species to product category mapping
const speciesCategories = await queryInterface.sequelize.query(`
  SELECT DISTINCT s.id as species_id, pcm.id as category_id
  FROM species_master s
  LEFT JOIN product_category_master pcm ON pcm.species_master_id = s.id AND pcm.is_active = true
  WHERE s.is_active = true
`);

const categoryMap = {};
speciesCategories.forEach((sc) => {
  categoryMap[sc.species_id] = sc.category_id || defaultCategoryId;
});
```

### 3. Improved Product Name Generation

Product names now use the correct species name from the mappings:

```javascript
const productName = `${mapping.species_name} – ${mapping.derivative_name} – ${mapping.size} – ${mapping.grade_name}`;
```

### 4. Smart Category Assignment

Each product is assigned to the correct category with fallback logic:

```javascript
const productCategoryId =
  mapping.product_category_master_id ||
  categoryMap[mapping.species_master_id] ||
  defaultCategoryId;
```

This ensures:

- ✅ Products are associated with their correct species category
- ✅ Proper species names appear in product names
- ✅ All foreign key relationships are maintained
- ✅ Fallback to default category if needed

## Product Data Structure

Each generated product now includes:

- **product_name:** Species – Derivative – Size – Grade (e.g., "Tiger Shrimp – Raw Whole – 10/20 – A")
- **species_derivative_size_grade_mapping_id:** Reference to 4D mapping
- **product_category_master_id:** Correctly mapped category for species
- **size_master_id:** Size from mapping
- **grade_master_id:** Grade from mapping
- **derivative_master_id:** Derivative from mapping
- **hsn_code:** From species master
- **processing_state:** "PROCESSED"
- **product_role:** "FINISHED_GOOD"
- **is_raw:** false
- **is_active:** true

## Impact

- Generates ~2000 products from 2000 active 4D mappings
- Each product correctly references its species, derivative, size, and grade
- Products are properly categorized by species type
- Product names are human-readable and include all key attributes

## Verification

Run the seeder to generate products:

```bash
npx sequelize-cli db:seed:all --seeders-path seeders/
```

Verify products are created with correct mappings:

```sql
SELECT product_name,
       (SELECT species_name FROM species_master WHERE id = (
         SELECT species_master_id FROM species_derivative_size_grade_mapping
         WHERE id = pm.species_derivative_size_grade_mapping_id
       )) as species,
       pcm.product_category
FROM product_master pm
LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
LIMIT 10;
```
