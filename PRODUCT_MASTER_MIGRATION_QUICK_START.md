# 🏭 Product Master Migration & Seeder - Quick Start Guide

**Date:** 2026-01-10  
**Status:** Ready to Use  
**Location:** `/scripts/` directory

---

## 📋 Scripts Available

### **1. Run Only Migrations**

```bash
node scripts/run-product-master-migration.js
```

**What it does:**

- Runs ONLY product master related migrations
- Creates all necessary database tables and schema
- Skips migrations that already exist
- Duration: ~5-10 minutes

**Migrations executed:**

- Species master creation
- Size master creation
- Species-size mapping
- Consolidated product master schema
- Derivative master
- Grade-size compatibility
- Raw product support

---

### **2. Run Only Seeders**

```bash
node scripts/run-product-master-seeder.js
```

**What it does:**

- Populates product master tables with data
- Creates species, categories, sizes, grades (~125 records)
- Generates ~2,000 products from 4D mappings (1,850 processed + 200 raw)
- Creates GST and tax code mappings (~2,000 mappings)
- Duration: ~30-60 seconds

**Seeders executed:**

1. `20251201-consolidated-product-master-seeder.js` - Base data
2. `20260109-generate-products-from-mappings.js` - Products & raw materials
3. `20251212000000-seed-all-product-gst-mappings.js` - Tax mappings
4. `20251206000001-product-taxcode-gst-mapping.js` - Tax codes

---

### **3. Run Everything (Recommended)**

```bash
node scripts/run-product-master-full.js
```

**What it does:**

- Runs migrations first (creates schema)
- Then runs seeders (populates data)
- Combines both in correct order
- Best for: Starting fresh or completely rebuilding product master
- Duration: ~10-15 minutes total

---

## ✅ Step-by-Step Usage

### **Scenario 1: Fresh Setup (Database Empty)**

```bash
# Run everything together
node scripts/run-product-master-full.js

# Or run separately
node scripts/run-product-master-migration.js
node scripts/run-product-master-seeder.js
```

### **Scenario 2: Schema Already Exists, Need Fresh Data**

```bash
# Just run the seeder
node scripts/run-product-master-seeder.js
```

### **Scenario 3: Only Need Schema (No Data)**

```bash
# Just run migrations
node scripts/run-product-master-migration.js
```

### **Scenario 4: Add New Migrations**

```bash
# Add your migration to the PRODUCT_MASTER_MIGRATIONS array in:
# scripts/run-product-master-migration.js

# Then run:
node scripts/run-product-master-migration.js
```

---

## 📊 Expected Output

### **Successful Migration Run**

```
═══════════════════════════════════════════════════════
🚀 Running Product Master Migrations Only
═══════════════════════════════════════════════════════

✅ Database connection established

📊 Already executed migrations: 5

⏳ Executing: 20240328150019-create-species_master.js
✅ Success: 20240328150019-create-species_master.js

⏳ Executing: 20240328150012-create-size_master.js
✅ Success: 20240328150012-create-size_master.js

... (more migrations)

═══════════════════════════════════════════════════════
📊 Migration Summary:
✅ Newly executed: 8
⏭️  Already executed: 2
📝 Total: 10
═══════════════════════════════════════════════════════

🎉 Product Master Migrations Completed Successfully!
```

### **Successful Seeder Run**

```
═══════════════════════════════════════════════════════
🌱 Running Product Master Seeders Only
═══════════════════════════════════════════════════════

✅ Database connection established

⏳ Running: 20251201-consolidated-product-master-seeder.js
✅ Success: 20251201-consolidated-product-master-seeder.js

⏳ Running: 20260109-generate-products-from-mappings.js
Generated: ~1,850 processed products
Generated: ~200 raw material products
✅ Success: 20260109-generate-products-from-mappings.js

... (more seeders)

═══════════════════════════════════════════════════════
📊 Seeding Summary:
✅ Successful: 4
❌ Errors: 0
📝 Total: 4
═══════════════════════════════════════════════════════

🎉 Product Master Seeders Completed Successfully!
```

---

## 🛠️ Environment Setup

Make sure your `.env` file has these variables:

```env
DB_NAME=your_database_name
DB_USERNAME=your_username
DB_SECRET=your_password
DB_HOST=localhost
DB_PORT=5432
```

Verify connection:

```bash
# This will test if your DB connection works
npm start:dev  # or your start command
```

---

## 📊 Expected Database State After Setup

### **Tables Created**

- `species_master` (40+ records)
- `product_category_master` (50+ records)
- `size_master` (10+ records)
- `grade_master` (5+ records)
- `derivative_master` (20+ records)
- `product_master` (~2,050 records)
- `product_taxcode_gst_mapping` (~2,000 records)
- `taxcode_gst_mapping` (30-50 records)

### **Verification Queries**

```sql
-- Check product count
SELECT COUNT(*) as total,
       SUM(CASE WHEN is_raw=true THEN 1 ELSE 0 END) as raw,
       SUM(CASE WHEN is_raw=false THEN 1 ELSE 0 END) as processed
FROM product_master;
-- Expected: ~2,050 total, ~200 raw, ~1,850 processed

-- Check species
SELECT COUNT(*) FROM species_master;
-- Expected: 40+

-- Check tax mappings
SELECT COUNT(*) FROM product_taxcode_gst_mapping;
-- Expected: ~2,000
```

---

## ⚠️ Troubleshooting

### **Issue: "Cannot find module 'sequelize'"**

```bash
# Solution: Install dependencies
npm install
```

### **Issue: "Database connection failed"**

```
# Check:
1. Is your database running?
2. Are DB credentials correct in .env?
3. Is the host/port correct?
4. Try: psql -U username -h localhost -d database_name
```

### **Issue: "Migration already exists"**

```
# This is fine - the script skips already-executed migrations
# To re-run a migration:
1. Delete it from SequelizeMeta table:
   DELETE FROM "SequelizeMeta" WHERE name='migration_name.js';
2. Re-run the script
```

### **Issue: "Seeder failed with specific error"**

```
# The script continues with other seeders
# Check the error message for which seeder failed
# Fix that seeder's data (e.g., missing species, duplicates)
# Re-run: node scripts/run-product-master-seeder.js
```

---

## 🔄 Common Workflows

### **Workflow 1: Set Up New Environment**

```bash
# 1. Fresh database created
# 2. Run full setup
node scripts/run-product-master-full.js

# 3. Verify
npm start:dev

# 4. Check products in API/UI
```

### **Workflow 2: Update Product Data**

```bash
# 1. Modify the seeder file
vim seeders/20260109-generate-products-from-mappings.js

# 2. Delete from SequelizeMeta (if already run)
# OR just re-run (it handles duplicates)

# 3. Re-run seeder
node scripts/run-product-master-seeder.js

# 4. Verify changes
```

### **Workflow 3: Add New Schema**

```bash
# 1. Create new migration
cp migrations/template.js migrations/20260120-new-product-column.js

# 2. Edit migration file with your changes

# 3. Add to PRODUCT_MASTER_MIGRATIONS array in:
# scripts/run-product-master-migration.js

# 4. Run migrations
node scripts/run-product-master-migration.js
```

---

## 📈 Performance Notes

- **Migration time:** 5-10 minutes (one-time operation)
- **Seeding time:** 30-60 seconds (mostly product generation)
- **Database queries:** ~10,000 inserts
- **Most time spent:** Generating 2,000 products from 4D mappings

---

## 🔐 Safety Features

✅ **Idempotent:** Safe to run multiple times  
✅ **Incremental:** Only runs new migrations  
✅ **Logged:** Shows what executed and what was skipped  
✅ **Transaction protection:** Uses DB transactions for consistency  
✅ **Error handling:** Logs errors but continues with other seeders

---

## 📝 Adding More Migrations/Seeders

### **To Add a Migration:**

1. Create migration file in `migrations/`
2. Add name to `PRODUCT_MASTER_MIGRATIONS` array in `scripts/run-product-master-migration.js`
3. Run script

### **To Add a Seeder:**

1. Create seeder file in `seeders/`
2. Add name to `PRODUCT_SEEDERS` array in `scripts/run-product-master-seeder.js`
3. Run script

---

## 🎯 Quick Commands

```bash
# Run everything (most common)
node scripts/run-product-master-full.js

# Just migrations
node scripts/run-product-master-migration.js

# Just data
node scripts/run-product-master-seeder.js

# Check if products were created
npm start:dev  # Then query via API

# Verify in database (if you have psql)
psql -U $DB_USERNAME -h $DB_HOST -d $DB_NAME -c "SELECT COUNT(*) FROM product_master;"
```

---

## ✨ Summary

| Task         | Command                                        | Time      |
| ------------ | ---------------------------------------------- | --------- |
| Fresh setup  | `node scripts/run-product-master-full.js`      | 10-15 min |
| Just schema  | `node scripts/run-product-master-migration.js` | 5-10 min  |
| Just data    | `node scripts/run-product-master-seeder.js`    | 30-60 sec |
| Check status | `npm start:dev`                                | -         |

---

**Status:** ✅ Ready to use  
**All scripts created and documented**  
**Start with:** `node scripts/run-product-master-full.js`
