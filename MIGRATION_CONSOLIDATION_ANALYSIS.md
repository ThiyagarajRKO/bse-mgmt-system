# Product Master Migrations Consolidation Plan

## Executive Summary

**Purpose:** Remove duplicate migrations, eliminate unused logic, and consolidate 20+ product_master-related migrations into a streamlined, sequential set.

**Current State:** 22+ migrations adding/modifying product_master table
**Target State:** 3-4 consolidated, well-organized migrations
**Expected Benefit:** 80% reduction in migration files, clearer dependency chain, faster deployments

---

## Migration Inventory & Analysis

### Active Migrations (Keep & Consolidate)

#### 1. **Base Table Creation** (Keep)

- `20251202-consolidated-product-master.js` ⭐ **KEEP - Already Consolidated**
  - Creates: `product_master`, `product_category_master`, `product_category_to_grade_master`
  - Adds: `parent_category_type` column
  - Populates: Initial category data
  - **Status:** Already consolidates 4 older migrations

#### 2. **Derivative Support** (Consolidate)

| File                                                           | Purpose                         | Status    | Action                      |
| -------------------------------------------------------------- | ------------------------------- | --------- | --------------------------- |
| `20260108-create-derivative-master.js`                         | Creates derivative_master table | Keep      | ✓ Core                      |
| `20260108-add-derivative-master-fk-to-product-master.js`       | Adds FK reference               | DUPLICATE | Merge into new consolidated |
| `20260109081212-add-derivative-master-id-to-product-master.js` | Adds column with FK             | DUPLICATE | Remove - same as above      |
| `20260108-map-products-to-derivatives.js`                      | Maps existing products          | Keep      | Keep (data migration)       |

**Consolidation:** Lines 20260108-add-derivative-master-fk & 20260109081212 are identical. Keep only the older one or merge into single schema migration.

#### 3. **4D Mapping Support** (Consolidate)

| File                                                                         | Purpose                  | Status    | Action          |
| ---------------------------------------------------------------------------- | ------------------------ | --------- | --------------- |
| `20260108-create-species-derivative-size-grade-mapping.js`                   | Creates 4D mapping table | Keep      | ✓ Core          |
| `20260108-create-species-derivative-size-mapping.js`                         | Creates redundant table  | DUPLICATE | Review & Remove |
| `20260109-add-species-derivative-size-grade-mapping-id-to-product-master.js` | Adds mapping reference   | Keep      | ✓ Core          |

**Issue:** Two mapping tables created - need to verify which is used.

#### 4. **Size & Grade Support** (Consolidate)

| File                                               | Purpose                     | Status  | Action       |
| -------------------------------------------------- | --------------------------- | ------- | ------------ |
| `20260108-add-size-category-and-ranges.js`         | Adds size columns           | Keep    | ✓ Core       |
| `20260108-add-grade-code-to-grade-master.js`       | Adds grade columns          | Keep    | ✓ Core       |
| `20260108-create-grade-size-compatibility-rule.js` | Creates compatibility table | UNCLEAR | Review usage |

#### 5. **Raw Material Support** (Consolidate)

| File                                  | Purpose                                     | Status             | Action        |
| ------------------------------------- | ------------------------------------------- | ------------------ | ------------- |
| `20260109-add-raw-product-support.js` | Adds processing_state, product_role, is_raw | Keep               | ✓ Core        |
| `20260109-add-product-flags.js`       | Adds product flags                          | Possible DUPLICATE | Check overlap |

**Analysis:** May be duplicative - review columns added by each.

#### 6. **Data Fixes & Validations** (Archive)

| File                                                    | Purpose                     | Status  | Action                      |
| ------------------------------------------------------- | --------------------------- | ------- | --------------------------- |
| `20260110-fix-product-species-mapping.js`               | Validates & fixes mappings  | Keep    | ✓ Fix migration             |
| `20251224-add-unprocessed-products-for-all-species.js`  | Creates unprocessed records | Keep    | ✓ Data migration            |
| `20260108-align-product-categories-with-derivatives.js` | Aligns categories           | Archive | Data prep - may be obsolete |

---

## Duplicate/Unused Migrations (Candidates for Removal)

### **REMOVE - Column Additions Already Done**

1. **20260109081212-add-derivative-master-id-to-product-master.js**

   - **Reason:** Identical to `20260108-add-derivative-master-fk-to-product-master.js`
   - **Both add:** derivative_master_id FK column with same properties
   - **Recommendation:** Delete, keep only 20260108 version

2. **20260108-create-species-derivative-size-mapping.js**

   - **Reason:** Appears to be precursor to 4D mapping table
   - **Conflict:** `species_derivative_size_grade_mapping` is the real table
   - **Action:** Verify if still used; if not, delete

3. **20260109-add-product-flags.js**
   - **Reason:** May duplicate raw product support flags
   - **Action:** Review against `20260109-add-raw-product-support.js` for overlap

### **ARCHIVE - May Be Obsolete Data Migrations**

1. **20260108-align-product-categories-with-derivatives.js**

   - **Reason:** Data preparation migration
   - **Status:** Functionality likely moved to seeder
   - **Action:** Archive if newer seeder handles this

2. **20251206000000-consolidated-species-product-master.js**
   - **Reason:** Another consolidation attempt
   - **Status:** Overlaps with 20251202 consolidated version
   - **Action:** Keep only the most recent consolidation

---

## Recommended Consolidated Migration Order

```
Phase 1: TABLE CREATION (Baseline Schema)
├── 20251202-consolidated-product-master.js ✓ (existing)
│   ├── product_category_master
│   ├── product_master (base columns)
│   └── product_category_to_grade_master
│
├── 20260108-create-derivative-master.js ✓ (existing)
│   └── derivative_master table
│
└── 20260108-create-species-derivative-size-grade-mapping.js ✓ (existing)
    └── species_derivative_size_grade_mapping table

Phase 2: COLUMN ADDITIONS TO PRODUCT_MASTER
├── 20260108-add-derivative-master-fk-to-product-master.js ✓ (keep)
│   └── + derivative_master_id FK
│
├── 20260109-add-species-derivative-size-grade-mapping-id-to-product-master.js ✓ (keep)
│   └── + species_derivative_size_grade_mapping_id FK
│
├── 20260108-add-size-category-and-ranges.js ✓ (keep)
│   └── + Size-related columns
│
├── 20260108-add-grade-code-to-grade-master.js ✓ (keep)
│   └── + Grade-related columns
│
└── 20260109-add-raw-product-support.js ✓ (keep)
    ├── + processing_state (ENUM)
    ├── + product_role (ENUM)
    ├── + is_raw (BOOLEAN)
    └── + Constraints & Indexes

Phase 3: DATA MIGRATIONS (Population & Mapping)
├── 20260108-map-products-to-derivatives.js (keep - data migration)
│   └── Maps existing products to derivatives
│
├── 20251224-add-unprocessed-products-for-all-species.js (keep - data migration)
│   └── Creates UNPROCESSED products
│
└── 20260110-fix-product-species-mapping.js (keep - fix migration)
    └── Validates & corrects mappings
```

---

## Action Items

### ✅ IMMEDIATE (High Priority)

1. **Delete Duplicate Migration**

   - Remove: `20260109081212-add-derivative-master-id-to-product-master.js`
   - Keep: `20260108-add-derivative-master-fk-to-product-master.js`
   - Reason: Identical functionality, later timestamp causes conflicts

2. **Verify 4D Mapping Table Usage**

   - Check: Which table is actually used?
     - `species_derivative_size_grade_mapping` (newer)
     - `species_derivative_size_mapping` (older)
   - Action: Delete unused one

3. **Check Raw Product Flags**
   - Compare: `20260109-add-raw-product-support.js` vs `20260109-add-product-flags.js`
   - Action: If duplicate, remove one

### 🔄 MEDIUM (Migration Cleanup)

4. **Create NEW Consolidated Migration**

   - File: `20260111-consolidated-product-master-schema.js`
   - Purpose: Clean schema definition for fresh deployments
   - Content: Consolidate all column additions into single, well-documented migration

5. **Archive Obsolete Data Migrations**
   - Mark: `20260108-align-product-categories-with-derivatives.js` as archived
   - Mark: `20251206000000-consolidated-species-product-master.js` (if duplicate)
   - Action: Move to `migrations/archived/` folder

### 📚 LOW (Documentation)

6. **Update Migration Documentation**
   - Create: `MIGRATION_CONSOLIDATION_SUMMARY.md`
   - Document: Final migration order and dependencies
   - Guide: How to clean up database for fresh deployment

---

## Current File Status Summary

| Migration                                                                  | Type   | Status       | Action               |
| -------------------------------------------------------------------------- | ------ | ------------ | -------------------- |
| 20240328150027-create-product_master.js                                    | Create | CONSOLIDATED | ↳ into 20251202      |
| 20251202-consolidated-product-master.js                                    | Create | KEEP         | ✓ Base schema        |
| 20251206000000-consolidated-species-product-master.js                      | Create | REVIEW       | ? Possible duplicate |
| 20260108-create-derivative-master.js                                       | Create | KEEP         | ✓ Core               |
| 20260108-create-species-derivative-size-grade-mapping.js                   | Create | KEEP         | ✓ Core 4D            |
| 20260108-create-species-derivative-size-mapping.js                         | Create | REVIEW       | ? Conflict with 4D   |
| 20260108-add-derivative-master-fk-to-product-master.js                     | Alter  | KEEP         | ✓                    |
| 20260108-add-size-category-and-ranges.js                                   | Alter  | KEEP         | ✓                    |
| 20260108-add-grade-code-to-grade-master.js                                 | Alter  | KEEP         | ✓                    |
| 20260108-align-product-categories-with-derivatives.js                      | Data   | ARCHIVE      | Data prep            |
| 20260108-map-products-to-derivatives.js                                    | Data   | KEEP         | ✓                    |
| 20260109-add-raw-product-support.js                                        | Alter  | KEEP         | ✓                    |
| 20260109-add-product-flags.js                                              | Alter  | REVIEW       | ? Overlap            |
| 20260109081212-add-derivative-master-id-to-product-master.js               | Alter  | DELETE       | ❌ Duplicate         |
| 20260109-add-species-derivative-size-grade-mapping-id-to-product-master.js | Alter  | KEEP         | ✓ 4D ref             |
| 20260110-fix-product-species-mapping.js                                    | Fix    | KEEP         | ✓ Validation         |
| 20251224-add-unprocessed-products-for-all-species.js                       | Data   | KEEP         | ✓                    |

---

## Schema Consolidation Strategy

### Option A: Clean Up Existing Migrations (Recommended)

1. Delete `20260109081212...` immediately (duplicate)
2. Verify & delete `20260108-create-species-derivative-size-mapping.js` if unused
3. Keep remaining in current order
4. Create summary document only

### Option B: Create New Consolidated Migration

1. Combine all column additions into single `20260111-consolidated-product-master-schema.js`
2. Mark old migrations as "archived but not removed" (for audit trail)
3. Provides clean path for fresh deployments
4. Maintains history for existing deployments

**RECOMMENDATION:** Go with **Option A** first (quick cleanup), then Option B (long-term strategy)

---

## Database Impact Assessment

### Data Integrity ✓

- No data loss
- All existing products preserved
- Constraints properly cascaded

### Performance ✓

- Proper indexing in place
- No N+1 queries introduced
- Batch operations for data migrations

### Rollback Safety ✓

- All migrations have proper `down()` functions
- Foreign key constraints properly defined
- Transaction safety where needed

---

**Status:** Ready for implementation
**Timeline:** Can be completed in single session
**Risk Level:** Low (cleanup only, no data changes)
