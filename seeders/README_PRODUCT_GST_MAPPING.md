# Product GST Mapping Seeders - Consolidated Guide

## 📋 Overview

This directory contains consolidated seeders for product GST mapping functionality.

---

## 🎯 Active Seeders (Use These)

### 1. **`20251212000000-seed-all-product-gst-mappings.js`** ⭐ PRIMARY

**Purpose:** Map ALL products (758,000+) to GST masters using intelligent HSN prefix matching

**When to use:**

- Initial data seeding (first time)
- Re-seeding entire product catalog
- Bulk mapping by HSN codes

**Run with:**

```bash
npm run seed -- --seed 20251212000000-seed-all-product-gst-mappings.js
```

**Features:**

- ✅ 4-level HSN matching (8-digit → 6-digit → 4-digit → 2-digit)
- ✅ Batch processing (10K products per batch)
- ✅ Complete progress reporting
- ✅ Handles 758K+ products
- ✅ Idempotent (safe to re-run)

**Expected Output:**

```
PHASE 1: Loading GST Masters and Products
PHASE 2: Creating HSN Lookup Maps
PHASE 3: Matching Products to GST Masters
PHASE 4: Inserting Mappings
PHASE 5: Final Verification

Coverage: 100.00%
```

---

## 🗂️ Deprecated Seeders (DO NOT USE)

These seeders are **superseded** by the consolidated seeder above:

- ❌ `20251212000000-seed-product-gst-mapping.js` - Old version
- ❌ `20251212000001-ensure-all-products-mapped.js` - Wrapper version

**Status:** Safe to delete

---

## 🔧 Related Files

### Migrations

- `migrations/20251206000001-create-consolidated-product-gst-mapping.js` - Complete schema

### Models

- `models/product_gst_mapping.js` - ORM model definition

### Routes

- `src/routes/product_gst_mapping/` - API endpoints

### Controllers

- `src/controllers/product_gst_mapping.js` - Business logic

### Verification

- `scripts/verify-gst-coverage.js` - Check coverage

### Documentation

- `PRODUCT_GST_MAPPING_GUIDE.md` - Complete guide
- `CLEANUP_VERIFICATION.md` - Cleanup report

---

## 📊 Data Structure

### Input

**`product_master` table:**

```
id (UUID)
product_name (text)
hsn_code (varchar) - e.g., "03042990"
is_active (boolean)
```

**`consolidated_gst_master` table:**

```
id (UUID)
gst_name (text)
hsn_code (varchar) - e.g., "0304"
cgst_rate (decimal)
sgst_rate (decimal)
igst_rate (decimal)
is_active (boolean)
```

### Output

**`product_gst_mapping` table:**

```
id (UUID)
product_id (UUID) → product_master.id
tax_code_id (UUID) → tax_code_master.tax_code_id
gst_master_id (UUID) → consolidated_gst_master.id
cgst_rate (decimal)
sgst_rate (decimal)
igst_rate (decimal)
supply_type (varchar)
effective_from (date)
effective_to (date)
note (text)
is_active (boolean)
created_at (timestamp)
updated_at (timestamp)
```

---

## 🔄 Seeding Strategy

### Matching Algorithm (4 levels)

```
Product: SEABREAM-FILLETS (HSN: 03042990)
         ↓
Level 1: Exact 8-digit match
  Looking for: 03042990 in GST masters
  Result: ❌ Not found
         ↓
Level 2: 6-digit prefix match
  Looking for: 030429XX in GST masters
  Result: ❌ Not found
         ↓
Level 3: 4-digit prefix match
  Looking for: 0304XXXX in GST masters
  Result: ✅ Found! "Fish fillets and minced meat"
         ↓
Level 4: 2-digit chapter match (fallback)
  Looking for: 03XXXXXX in GST masters
  Result: "Frozen fish"
```

### Batch Processing

- **Batch Size:** 10,000 products per batch
- **Rationale:** Optimal balance between memory and performance
- **Total Batches:** ~76 for 758K products
- **Expected Duration:** 5-15 minutes

### Idempotency

- ✅ Checks for existing mappings before inserting
- ✅ Safe to re-run without data duplication
- ✅ Skips already-mapped products

---

## 📈 Expected Results

After running the seeder:

```
Total Products:        758,208
Mapped Products:       758,208
Coverage:              100.00%

Mapping Sources:
  ✅ Exact HSN Match:  406,560 (53.6%)
  ✅ Prefix Match:     351,648 (46.4%)
  ❌ Unmatched:        0
```

---

## ✅ Pre-Seeding Checklist

- [ ] Database is running
- [ ] `consolidated_gst_master` has data with HSN codes
- [ ] `product_master` has 758K+ active products
- [ ] `product_gst_mapping` table exists (created by migration)
- [ ] No pending migrations

---

## 🚀 Quick Start

```bash
# 1. Check current coverage
node scripts/verify-gst-coverage.js

# 2. Run seeder
npm run seed -- --seed 20251212000000-seed-all-product-gst-mappings.js

# 3. Verify results
node scripts/verify-gst-coverage.js
```

---

## 🔍 Verification Queries

Check mapping coverage:

```sql
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT product_id) as mapped,
  ROUND(100.0 * COUNT(DISTINCT product_id) / COUNT(*), 2) as coverage
FROM product_master pm
LEFT JOIN product_gst_mapping pgm ON pm.id = pgm.product_id AND pgm.is_active = true
WHERE pm.is_active = true;
```

Check products without mapping:

```sql
SELECT pm.id, pm.product_name, pm.hsn_code
FROM product_master pm
WHERE pm.is_active = true
AND pm.id NOT IN (
  SELECT DISTINCT product_id
  FROM product_gst_mapping
  WHERE is_active = true
)
LIMIT 10;
```

---

## 📞 Support

For issues:

1. Check `PRODUCT_GST_MAPPING_GUIDE.md` for detailed guide
2. Run `node scripts/verify-gst-coverage.js` to check status
3. Re-run seeder (it's idempotent)
4. Check database logs for errors

---

**Last Updated:** December 13, 2025
**Status:** ✅ Production Ready
