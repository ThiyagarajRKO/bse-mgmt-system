# Product Master Migrations - Cleanup Checklist

**Purpose:** Clear list of which migration files to DELETE, ARCHIVE, or KEEP  
**Date:** 2026-01-10

---

## 🗑️ DELETE IMMEDIATELY (Duplicates)

### ❌ 20260109081212-add-derivative-master-id-to-product-master.js

**Why:** Identical to 20260108 version (both add `derivative_master_id` FK)

**Delete Command:**

```bash
rm migrations/20260109081212-add-derivative-master-id-to-product-master.js
```

**Verification:**

```bash
# Confirm it's deleted
ls migrations/20260109081212* 2>/dev/null || echo "✓ Deleted"
```

**If migration was already executed in database:**

```bash
# Optional: Remove from sequelizemeta table if needed
# psql -U username -d database_name -c "DELETE FROM sequelizemeta WHERE name = '20260109081212-add-derivative-master-id-to-product-master.js';"
```

---

## 📦 ARCHIVE (Optional - Keep History)

### 🟡 20260108-create-species-derivative-size-mapping.js

**Status:** VERIFY USAGE FIRST

**Check if used:**

```sql
-- Run this query
SELECT
  CASE
    WHEN EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'species_derivative_size_mapping'
    ) THEN 'Table EXISTS - Keep migration'
    ELSE 'Table NOT FOUND - Can delete/archive'
  END as status;
```

**If NOT used (recommended action):**

```bash
# Option 1: Delete completely
rm migrations/20260108-create-species-derivative-size-mapping.js

# Option 2: Archive for history (recommended)
mkdir -p migrations/archived
mv migrations/20260108-create-species-derivative-size-mapping.js migrations/archived/
```

**Reason:** The correct 4D mapping table is `species_derivative_size_grade_mapping` (newer, more comprehensive). This 3D version is a precursor that was superseded.

---

### 🟡 20251206000000-consolidated-species-product-master.js

**Status:** REVIEW FOR REDUNDANCY

**Check if duplicate:**

```bash
# Compare with 20251202 consolidation
diff -u migrations/20251206000000-consolidated-species-product-master.js \
           migrations/20251202-consolidated-product-master.js

# If output shows minimal differences (just metadata), it's a duplicate
```

**If redundant (recommended action):**

```bash
# Option 1: Delete
rm migrations/20251206000000-consolidated-species-product-master.js

# Option 2: Archive
mkdir -p migrations/archived
mv migrations/20251206000000-consolidated-species-product-master.js migrations/archived/
```

**Reason:** Keep only the most recent consolidation (`20251202` is more refined). Having both causes confusion.

---

### 🟡 20260108-align-product-categories-with-derivatives.js

**Status:** Data preparation migration - likely handled by seeder now

**Check if still needed:**

```sql
-- Query to see if this migration's changes are still relevant
SELECT
  COUNT(*) as unaligned_categories
FROM product_category_master pcm
WHERE pcm.parent_category_type IS NULL AND pcm.is_active = true;
```

**If not needed:**

```bash
# Archive for historical reference
mkdir -p migrations/archived
mv migrations/20260108-align-product-categories-with-derivatives.js migrations/archived/
```

**Reason:** This was a data preparation step. The seeder now handles the alignment automatically. Good to keep in history but can be archived.

---

### 🟡 20251224041236-fix-shark-species-category.js

**Status:** Single-species fix - verify if still needed

**Check status:**

```sql
-- Verify shark categories are correct
SELECT sm.species_name, pcm.product_category
FROM product_category_master pcm
JOIN species_master sm ON pcm.species_master_id = sm.id
WHERE sm.species_name LIKE '%Shark%'
AND pcm.is_active = true
ORDER BY sm.species_name, pcm.product_category;
```

**If shark categories are correct:**

```bash
# Archive the fix migration
mkdir -p migrations/archived
mv migrations/20251224041236-fix-shark-species-category.js migrations/archived/
```

**Reason:** Species fixes are typically one-time corrections. Once applied, they can be archived.

---

## ✅ KEEP (No Changes)

### Core Schema Migrations

```
✓ 20251202-consolidated-product-master.js
✓ 20260108-create-derivative-master.js
✓ 20260108-create-species-derivative-size-grade-mapping.js
```

### Enhancement Migrations

```
✓ 20260108-add-size-category-and-ranges.js
✓ 20260108-add-grade-code-to-grade-master.js
```

### Data Mapping Migrations

```
✓ 20260108-map-products-to-derivatives.js
✓ 20251224-add-unprocessed-products-for-all-species.js
✓ 20260110-fix-product-species-mapping.js
```

### ⭐ NEW - Use This

```
✓ 20260111-consolidated-product-master-schema.js [NEWLY CREATED]
```

---

## Cleanup Commands Summary

### Quick Cleanup (Delete Confirmed Duplicate)

```bash
# Step 1: Delete duplicate
rm migrations/20260109081212-add-derivative-master-id-to-product-master.js

# Step 2: Verify deletion
echo "Remaining 20260109 migrations:"
ls migrations/20260109*.js
```

### Complete Cleanup (With Archives)

```bash
# Create archive directory
mkdir -p migrations/archived

# Delete duplicate
rm migrations/20260109081212-add-derivative-master-id-to-product-master.js

# Archive optional candidates (if verified)
# Note: Uncomment after verifying with queries above

# mv migrations/20260108-create-species-derivative-size-mapping.js migrations/archived/
# mv migrations/20251206000000-consolidated-species-product-master.js migrations/archived/
# mv migrations/20260108-align-product-categories-with-derivatives.js migrations/archived/
# mv migrations/20251224041236-fix-shark-species-category.js migrations/archived/
```

### Archive Structure (After Cleanup)

```
migrations/
├── 20240328150000-*.js ... 20260116-*.js (active migrations)
├── 20260111-consolidated-product-master-schema.js ⭐
└── archived/
    ├── 20260108-create-species-derivative-size-mapping.js (if unused)
    ├── 20251206000000-consolidated-species-product-master.js (if redundant)
    ├── 20260108-align-product-categories-with-derivatives.js (data prep)
    └── 20251224041236-fix-shark-species-category.js (old fix)
```

---

## Verification After Cleanup

### 1. Check File Count

```bash
# Count remaining migrations
echo "Total migrations: $(ls migrations/20*.js | wc -l)"
echo "Archived migrations: $(ls migrations/archived/20*.js 2>/dev/null | wc -l || echo 0)"
```

### 2. Run Deletion Verification

```bash
# Confirm 20260109081212 is gone
if [ -f "migrations/20260109081212-add-derivative-master-id-to-product-master.js" ]; then
  echo "❌ FAILED: Duplicate migration still exists"
else
  echo "✅ SUCCESS: Duplicate deleted"
fi
```

### 3. Run Database Verification

```bash
# Check schema integrity
psql -U postgres -d bse_database -f - << 'EOF'
SELECT
  CASE WHEN COUNT(*) = 10 THEN '✅ All columns present'
       ELSE '❌ Missing columns'
  END as result
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
EOF
```

---

## Risk Assessment

| Action                         | Risk      | Reversibility             | Notes                     |
| ------------------------------ | --------- | ------------------------- | ------------------------- |
| Delete 20260109081212          | 🟢 LOW    | Easy - not used           | Duplicate, safe to delete |
| Archive 20260108 mapping       | 🟡 MEDIUM | Medium - verify first     | Verify table isn't used   |
| Archive 20251206 consolidation | 🟡 MEDIUM | Medium - verify first     | Check for redundancy      |
| Archive alignment migration    | 🟢 LOW    | Easy - data migration     | Can be safely archived    |
| Archive shark fix              | 🟢 LOW    | Easy - data already fixed | Already applied to DB     |

---

## Timeline

| Task                        | Time       | Difficulty |
| --------------------------- | ---------- | ---------- |
| Delete duplicate            | 1 min      | Easy ✓     |
| Verify 4D mapping usage     | 5 min      | Medium     |
| Create archive directory    | 1 min      | Easy ✓     |
| Archive optional migrations | 5 min      | Easy ✓     |
| Run verification queries    | 5 min      | Medium     |
| Update migration status doc | 5 min      | Easy ✓     |
| **TOTAL**                   | **22 min** | Low-Medium |

---

## Completion Checklist

- [ ] Deleted `20260109081212-*` (duplicate FK)
- [ ] Verified 4D mapping table usage
- [ ] Created `migrations/archived/` directory
- [ ] Archived `20260108-create-species-derivative-size-mapping.js` (if unused)
- [ ] Archived `20251206000000-*` (if redundant)
- [ ] Archived `20260108-align-product-categories-with-derivatives.js` (optional)
- [ ] Archived `20251224041236-fix-shark-species-category.js` (optional)
- [ ] Ran database verification queries
- [ ] Confirmed all required columns exist
- [ ] Updated team on new migration structure
- [ ] Tested with `npm run migrate` (staging)
- [ ] Deployed to production

---

## Important Notes

1. **Always Backup First**

   ```bash
   pg_dump bse_database > backup_$(date +%Y%m%d).sql
   ```

2. **Test on Staging**

   - Run migrations on staging environment first
   - Verify no errors
   - Check application behavior

3. **Communicate Changes**

   - Update team on migration consolidation
   - Reference `MIGRATION_CONSOLIDATION_ANALYSIS.md`
   - Point to `PRODUCT_MASTER_MIGRATION_CLEANUP_GUIDE.md`

4. **Keep Historical Record**
   - Archive rather than delete (when possible)
   - Maintains audit trail
   - Easy recovery if needed

---

**Status:** Ready for Cleanup  
**Last Updated:** 2026-01-10  
**Next Step:** Run cleanup commands and verification queries
