# Product Master Migration Consolidation & Cleanup Guide

## Overview

This guide consolidates 20+ product_master-related migrations into a clean, maintainable set by removing duplicates and combining column additions into a single comprehensive migration.

---

## Part 1: IMMEDIATE CLEANUP - Remove Duplicate Migrations

### Step 1: Delete Duplicate Derivative Master FK Migration

**File to DELETE:**

```
migrations/20260109081212-add-derivative-master-id-to-product-master.js
```

**Reason:**

- Identical functionality to `20260108-add-derivative-master-fk-to-product-master.js`
- Both add `derivative_master_id` FK column with same properties
- Later timestamp causes execution conflicts
- Earlier migration (20260108) should be kept

**How to Delete:**

```bash
rm migrations/20260109081212-add-derivative-master-id-to-product-master.js
```

**Verification:**

```sql
-- Check that derivative_master_id exists on product_master
SELECT column_name FROM information_schema.columns
WHERE table_name = 'product_master' AND column_name = 'derivative_master_id';
```

---

### Step 2: Verify 4D Mapping Table Usage

**Files to Review:**

- `20260108-create-species-derivative-size-mapping.js`
- `20260108-create-species-derivative-size-grade-mapping.js`

**Check which table is actually used:**

```sql
-- Check if species_derivative_size_mapping is used
SELECT COUNT(*) as mapping_count
FROM information_schema.tables
WHERE table_name = 'species_derivative_size_mapping';

-- Check if species_derivative_size_grade_mapping is used (the correct 4D table)
SELECT COUNT(*) as mapping_count
FROM information_schema.tables
WHERE table_name = 'species_derivative_size_grade_mapping';

-- Check product_master references
SELECT COUNT(*) as product_count
FROM product_master
WHERE species_derivative_size_grade_mapping_id IS NOT NULL;
```

**If `species_derivative_size_mapping` is NOT used:**

```bash
# Option 1: Delete the migration
rm migrations/20260108-create-species-derivative-size-mapping.js

# Option 2: Mark as archived (if you want to keep history)
mkdir -p migrations/archived
mv migrations/20260108-create-species-derivative-size-mapping.js migrations/archived/
```

**Rationale:**

- The 4D mapping (species × derivative × size × grade) is the correct model
- 3D mapping is a precursor that was superseded
- Keeping both creates confusion and potential conflicts

---

### Step 3: Check for Overlapping Product Flags

**Files to Compare:**

- `20260109-add-raw-product-support.js` - Adds: `processing_state`, `product_role`, `is_raw`, constraints
- `20260109-add-product-flags.js` - Adds: `is_producible`, `is_saleable`

**Check if either file adds duplicate columns:**

```sql
-- Verify which columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'product_master'
AND column_name IN (
  'processing_state', 'product_role', 'is_raw',
  'is_producible', 'is_saleable'
)
ORDER BY column_name;
```

**Result:**

- ✓ These are **NOT** duplicates - they serve different purposes:
  - `20260109-add-raw-product-support.js`: Raw material classification
  - `20260109-add-product-flags.js`: Product capability flags
- **Action:** Keep both - they are complementary

---

## Part 2: CONSOLIDATION - New Schema Migration

### New Consolidated Migration

A new comprehensive migration has been created:

**File:**

```
migrations/20260111-consolidated-product-master-schema.js
```

**What It Does:**
Consolidates ALL product_master column additions into a single migration:

- Derivative master FK
- 4D mapping reference
- Size/grade categories
- Raw product support (processing_state, product_role, is_raw)
- HSN code support
- Product flags (is_producible, is_saleable)
- Creates indexes and constraints
- Comprehensive verification

**Benefits:**

- ✓ Single, clear point of reference for schema
- ✓ Proper sequencing of operations
- ✓ Better error handling and rollback
- ✓ Comprehensive logging of changes
- ✓ Works for both fresh deployments and existing databases

**Usage:**
This migration should run AFTER these base migrations:

1. `20251202-consolidated-product-master.js` (base tables)
2. `20260108-create-derivative-master.js` (derivative table)
3. `20260108-create-species-derivative-size-grade-mapping.js` (4D mapping table)

---

## Part 3: RECOMMENDED MIGRATION ORDER

After cleanup, your migration execution order should be:

### Phase 1: Core Schema Creation

```
1. 20251202-consolidated-product-master.js
   └─ Creates: product_category_master, product_master (base), product_category_to_grade_master

2. 20260108-create-derivative-master.js
   └─ Creates: derivative_master table

3. 20260108-create-species-derivative-size-grade-mapping.js
   └─ Creates: species_derivative_size_grade_mapping table (4D mapping)
```

### Phase 2: Base Entity Support (Grade & Size Enhancement)

```
4. 20260108-add-size-category-and-ranges.js
   └─ Enhances: size_master table

5. 20260108-add-grade-code-to-grade-master.js
   └─ Enhances: grade_master table
```

### Phase 3: Product Master Column Additions (Consolidated)

```
6. 20260111-consolidated-product-master-schema.js
   ├─ Adds: derivative_master_id FK
   ├─ Adds: species_derivative_size_grade_mapping_id FK
   ├─ Adds: size_category, size_range
   ├─ Adds: processing_state, product_role, is_raw (raw product support)
   ├─ Adds: hsn_code
   ├─ Adds: is_producible, is_saleable
   └─ Creates: Indexes & Constraints
```

### Phase 4: Data Mapping & Population

```
7. 20260108-map-products-to-derivatives.js
   └─ Maps: Existing products to derivatives

8. 20251224-add-unprocessed-products-for-all-species.js
   └─ Creates: UNPROCESSED products for raw materials
```

### Phase 5: Validation & Fixes

```
9. 20260110-fix-product-species-mapping.js
   └─ Validates: Species-product associations & fixes mapping issues
```

---

## Part 4: MIGRATION FILE CLEANUP CHECKLIST

### ✅ DELETE (Duplicates)

- [ ] `20260109081212-add-derivative-master-id-to-product-master.js`
  - Duplicate of 20260108 version
  - Can safely delete

### ⚠️ REVIEW (Possible Duplicates)

- [ ] `20260108-create-species-derivative-size-mapping.js` (if unused)

  - Check: Is it used anywhere?
  - If only 4D mapping (species_derivative_size_grade_mapping) is used, delete this
  - Run verification query above

- [ ] `20251206000000-consolidated-species-product-master.js` (if redundant)
  - Check: Does it duplicate 20251202 functionality?
  - If yes, delete this one
  - Keep only the more recent consolidation

### 📁 ARCHIVE (Optional - Keep History)

- [ ] `20260108-align-product-categories-with-derivatives.js`

  - Purpose: Data preparation migration
  - Status: Likely handled by seeder now
  - Option: Move to `migrations/archived/` for historical reference

- [ ] `20251224041236-fix-shark-species-category.js` (if fixed elsewhere)
  - Single-species fix
  - If issue is resolved, can archive

---

## Part 5: VERIFICATION AFTER CLEANUP

### Quick Validation Script

```sql
-- 1. Verify all required columns exist
SELECT
  CASE WHEN COUNT(*) = 10 THEN '✓ All columns present'
       ELSE '✗ Missing columns: ' || STRING_AGG(column_name, ', ')
  END as column_check
FROM information_schema.columns
WHERE table_name = 'product_master'
AND column_name IN (
  'derivative_master_id',
  'species_derivative_size_grade_mapping_id',
  'processing_state',
  'product_role',
  'is_raw',
  'hsn_code',
  'is_producible',
  'is_saleable',
  'size_category',
  'size_range'
);

-- 2. Verify no orphaned foreign keys
SELECT
  COUNT(*) as orphaned_derivative_refs
FROM product_master pm
WHERE pm.derivative_master_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM derivative_master d
  WHERE d.id = pm.derivative_master_id
);

-- 3. Count products by processing state
SELECT
  processing_state,
  COUNT(*) as product_count
FROM product_master
GROUP BY processing_state;

-- 4. Verify constraints
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'product_master'
AND constraint_name LIKE 'chk_%';

-- 5. Summary
SELECT
  COUNT(*) as total_products,
  COUNT(DISTINCT product_category_master_id) as categories,
  COUNT(DISTINCT derivative_master_id) as derivatives,
  COUNT(DISTINCT size_master_id) as sizes,
  COUNT(DISTINCT grade_master_id) as grades,
  SUM(CASE WHEN is_raw = true THEN 1 ELSE 0 END) as raw_count,
  SUM(CASE WHEN is_raw = false THEN 1 ELSE 0 END) as processed_count
FROM product_master
WHERE is_active = true;
```

---

## Part 6: BACKUP & SAFETY

### Before Making Changes

```bash
# 1. Backup database
pg_dump bse_database > bse_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Check migration status
sequelize-cli db:migrate:status

# 3. Note any pending migrations
```

### Rollback if Needed

```bash
# If new consolidated migration causes issues:
sequelize-cli db:migrate:undo

# If old duplicate migrations were causing issues:
# (They'll be gone, so no need to undo - just clean)
```

---

## Part 7: FRESH DEPLOYMENT PATH

For NEW deployments (clean database), use this optimized migration path:

**Instead of 20+ individual migrations, use:**

```
1. Base schema (20251202-consolidated-product-master.js)
2. Derivative support (20260108-create-derivative-master.js)
3. 4D mapping (20260108-create-species-derivative-size-grade-mapping.js)
4. Size/Grade enhancements (20260108 size/grade files)
5. ALL schema changes (20260111-consolidated-product-master-schema.js) ← NEW
6. Data migrations (map-to-derivatives, add-unprocessed, fix-mapping)
```

This reduces from 20+ migrations to ~6-8 focused migrations.

---

## Part 8: MIGRATION DOCUMENTATION

After cleanup, create this summary file:

**File:** `PRODUCT_MASTER_MIGRATIONS_FINAL.md`

```markdown
# Product Master Migrations - Final Structure

## Complete Migration List (After Consolidation)

### Core Schema (3 migrations)

- 20251202: Product base tables & category system
- 20260108: Derivative master table
- 20260108: 4D mapping (species × derivative × size × grade)

### Enhancement (2 migrations)

- 20260108: Size/grade master enhancements
- 20260111: **[NEW] Consolidated schema additions** ← All column additions

### Data Operations (3 migrations)

- 20260108: Map products to derivatives
- 20251224: Add unprocessed products
- 20260110: Fix species mappings

### DELETED (Removed duplicates)

- ❌ 20260109081212-add-derivative-master-id... (duplicate)

### ARCHIVED (Historical reference)

- 📦 [Optional] Species alignment migration
- 📦 [Optional] Shark species fixes

## Total: 8 active migrations (down from 20+)
```

---

## Summary of Actions

| Action               | Files                           | Priority | Effort     |
| -------------------- | ------------------------------- | -------- | ---------- |
| Delete Duplicate FK  | 20260109081212                  | 🔴 HIGH  | 1 min      |
| Verify 4D Mapping    | species_derivative_size mapping | 🔴 HIGH  | 5 min      |
| Archive/Delete Old   | align-products, fix-shark       | 🟡 MED   | 5 min      |
| Use New Consolidated | 20260111                        | 🟡 MED   | 2 min      |
| Run Verification     | SQL queries                     | 🟡 MED   | 5 min      |
| **Total Time**       |                                 |          | **18 min** |

---

## Status Checklist

- [ ] Duplicate FK migration deleted
- [ ] 4D mapping table verified
- [ ] Old migrations archived/deleted
- [ ] New consolidated migration in place
- [ ] Verification queries run successfully
- [ ] Documentation updated
- [ ] Team notified of new structure

---

**Created:** 2026-01-10  
**Status:** Ready for Implementation  
**Risk Level:** Low (cleanup + consolidation, no data changes)
