# Product Master Migration & Seeder Scripts

**Complete documentation for running product master migrations and seeders**

---

## 🚀 Quick Start (3 Options)

### **Option 1: Using npm (Easiest)**

```bash
# Run everything (migration + seeder)
npm run setup:product-master

# Or run separately
npm run migrate:product-master    # Just schema
npm run seed:product-master       # Just data
```

### **Option 2: Direct Node Command**

```bash
# Run everything
node scripts/run-product-master-full.js

# Or separately
node scripts/run-product-master-migration.js
node scripts/run-product-master-seeder.js
```

### **Option 3: Using Sequelize CLI (All Migrations)**

```bash
# Runs ALL migrations (not recommended - takes longer)
npm run migrate
npm run seed
```

---

## 📋 Scripts Explanation

### **run-product-master-migration.js**

**Runs ONLY product master related migrations**

```bash
npm run migrate:product-master
# OR
node scripts/run-product-master-migration.js
```

**What it creates:**

- ✅ Species master table
- ✅ Size master table
- ✅ Product category master
- ✅ Grade master
- ✅ Derivative master
- ✅ Species-size mappings
- ✅ Grade-size compatibility
- ✅ All product master relationships

**Duration:** 5-10 minutes  
**Idempotent:** ✅ Yes (safe to run multiple times)

---

### **run-product-master-seeder.js**

**Runs ONLY product master seeders**

```bash
npm run seed:product-master
# OR
node scripts/run-product-master-seeder.js
```

**What it populates:**

- ✅ 40+ species
- ✅ 50+ product categories
- ✅ 10+ sizes
- ✅ 5 grades
- ✅ ~1,850 processed products (from 4D mappings)
- ✅ ~200 raw material products (unprocessed)
- ✅ ~2,000 product-GST mappings
- ✅ ~30-50 tax code mappings

**Duration:** 30-60 seconds  
**Idempotent:** ✅ Yes (checks for duplicates)

---

### **run-product-master-full.js**

**Runs migration THEN seeder in correct order**

```bash
npm run setup:product-master
# OR
node scripts/run-product-master-full.js
```

**What it does:**

1. Creates all schema (migration)
2. Populates all data (seeder)

**Duration:** 10-15 minutes total  
**Recommended for:** Fresh database setup

---

## 📊 Execution Flow

```
START
  │
  ├─→ npm run setup:product-master
  │     │
  │     ├─→ Run Migrations (5-10 min)
  │     │     ├─ Create species_master
  │     │     ├─ Create size_master
  │     │     ├─ Create product_master
  │     │     ├─ Create derivative_master
  │     │     └─ Create all relationships
  │     │
  │     └─→ Run Seeders (30-60 sec)
  │           ├─ Populate species (40+)
  │           ├─ Populate categories (50+)
  │           ├─ Populate sizes (10+)
  │           ├─ Populate grades (5)
  │           ├─ Generate products (~2,000)
  │           └─ Create tax mappings (~2,000)
  │
  └─→ Database Ready ✅

TOTAL TIME: ~10-15 minutes
```

---

## 🛠️ Common Scenarios

### **Scenario 1: Start Fresh (Empty Database)**

```bash
# Everything from scratch
npm run setup:product-master

# Verify
npm start:dev
# Then check your API endpoints
```

**Time:** 10-15 minutes  
**Result:** Complete product database

---

### **Scenario 2: Refresh Data Only (Keep Schema)**

```bash
# If schema already exists, only refresh data
npm run seed:product-master

# This:
# ✅ Keeps existing tables
# ✅ Updates/recreates product data
# ✅ Refreshes mappings
```

**Time:** 30-60 seconds  
**Result:** Fresh product data

---

### **Scenario 3: Add New Schema (Keep Data)**

```bash
# If you added new migrations to the array:
npm run migrate:product-master

# This:
# ✅ Skips already-executed migrations
# ✅ Runs new ones only
# ✅ Doesn't affect seeded data
```

**Time:** 5-10 minutes  
**Result:** New schema added

---

### **Scenario 4: Development/Testing (Run All)**

```bash
# Full reset and setup
npm run setup:product-master

# Then run your app
npm start:dev

# Test your API
curl http://localhost:3000/api/products
```

---

## 📈 What Gets Created

### **Database Tables (Migration)**

| Table                         | Records | Description                               |
| ----------------------------- | ------- | ----------------------------------------- |
| `species_master`              | 40+     | All seafood species                       |
| `product_category_master`     | 50+     | Product categories (PROCESSED, RAW, etc.) |
| `size_master`                 | 10+     | Product sizes                             |
| `grade_master`                | 5       | Quality grades                            |
| `derivative_master`           | 20+     | Product forms (fillet, steak, etc.)       |
| `product_master`              | ~2,050  | All products (processed + raw)            |
| `product_taxcode_gst_mapping` | ~2,000  | Product → GST links                       |
| `taxcode_gst_mapping`         | 30-50   | Tax code → GST rates                      |

### **Product Data (Seeder)**

```
Total Products: ~2,050
├─ Processed Products: ~1,850
│  ├─ Generated from 4D mappings
│  ├─ (species × derivative × size × grade)
│  └─ Named: "[SPECIES] – [DERIVATIVE] – [SIZE] – [GRADE]"
│
└─ Raw Material Products: ~200
   ├─ Unprocessed/whole round
   ├─ (species × size only)
   └─ Named: "[SPECIES] – Whole – Raw – [SIZE]"
```

---

## ✅ Verification

### **Check via Database**

```sql
-- How many products?
SELECT COUNT(*) as total,
       SUM(CASE WHEN is_raw=true THEN 1 ELSE 0 END) as raw,
       SUM(CASE WHEN is_raw=false THEN 1 ELSE 0 END) as processed
FROM product_master;
-- Expected: ~2,050 total | ~200 raw | ~1,850 processed

-- Check species
SELECT COUNT(*) FROM species_master;
-- Expected: 40+

-- Check categories
SELECT COUNT(*) FROM product_category_master;
-- Expected: 50+

-- Check tax mappings
SELECT COUNT(*) FROM product_taxcode_gst_mapping;
-- Expected: ~2,000
```

### **Check via API**

```bash
# Start dev server
npm start:dev

# In another terminal, test API
curl http://localhost:3000/api/products?limit=5

# Should return product data with species, sizes, grades, etc.
```

### **Check Execution Status**

```bash
# View which migrations have run
npm start:dev  # Then query the SequelizeMeta table

# Or directly:
psql -U $DB_USERNAME -h $DB_HOST -d $DB_NAME -c 'SELECT * FROM "SequelizeMeta" ORDER BY name;'
```

---

## ⚠️ Troubleshooting

### **Problem: "Cannot find module"**

```bash
# Solution: Install npm packages
npm install

# Then retry
npm run setup:product-master
```

### **Problem: "Database connection failed"**

```bash
# Check 1: Is Postgres running?
ps aux | grep postgres

# Check 2: Are credentials in .env correct?
cat .env | grep DB_

# Check 3: Can you connect manually?
psql -U username -h localhost -d database_name

# Check 4: Is the port correct?
netstat -an | grep 5432  # or your port
```

### **Problem: "Already executed migration"**

```
This is NORMAL! The script:
✅ Skips migrations already in SequelizeMeta table
✅ Only runs new ones
✅ Shows which are skipped with ⏭️

Just means it ran before. Safe to run again.
```

### **Problem: "Seeder failed: duplicate key"**

```
This can happen if:
1. Data partially inserted from previous run
2. Duplicate seeding attempted

Solution:
# Option A: Delete and re-run (cleanest)
DELETE FROM product_master;
npm run seed:product-master

# Option B: Clear all and restart
npm run setup:product-master
```

### **Problem: "Permission denied"**

```bash
# Make scripts executable
chmod +x scripts/run-product-master-*.js

# Or run with node explicitly (doesn't need +x)
node scripts/run-product-master-full.js
```

---

## 🔐 Safety & Recovery

### **Safety Features Built In**

✅ **Idempotent:** Safe to run multiple times  
✅ **Skips duplicates:** Won't create duplicate migrations  
✅ **Transaction protected:** Uses database transactions  
✅ **Error logging:** Shows what succeeded/failed  
✅ **Continues on error:** Runs other seeders even if one fails

### **If Something Goes Wrong**

**Option 1: Just Clear Products (Keep Schema)**

```sql
DELETE FROM product_master;
DELETE FROM product_taxcode_gst_mapping;
```

Then run: `npm run seed:product-master`

**Option 2: Clear Everything (Full Reset)**

```bash
# Drop and recreate database
dropdb your_database_name
createdb your_database_name

# Run full setup
npm run setup:product-master
```

**Option 3: Rollback Migration**

```sql
-- Mark migration as not executed
DELETE FROM "SequelizeMeta" WHERE name='20260111-consolidated-product-master-schema.js';

-- Then fix the migration and re-run
npm run migrate:product-master
```

---

## 📝 Modifying Scripts

### **Add a Migration**

1. Create migration in `migrations/` folder
2. Edit `scripts/run-product-master-migration.js`
3. Add to `PRODUCT_MASTER_MIGRATIONS` array:

```javascript
const PRODUCT_MASTER_MIGRATIONS = [
  "20240328150019-create-species_master.js",
  // ... existing migrations ...
  "YOUR_NEW_MIGRATION.js", // ← Add here
];
```

### **Add a Seeder**

1. Create seeder in `seeders/` folder
2. Edit `scripts/run-product-master-seeder.js`
3. Add to `PRODUCT_SEEDERS` array:

```javascript
const PRODUCT_SEEDERS = [
  "20251201-consolidated-product-master-seeder.js",
  // ... existing seeders ...
  "YOUR_NEW_SEEDER.js", // ← Add here
];
```

---

## 🎯 Commands Reference

### **Migration Commands**

```bash
npm run migrate:product-master      # Run product master migrations only
npm run migrate                      # Run ALL migrations (slower)
```

### **Seeder Commands**

```bash
npm run seed:product-master         # Run product master seeders only
npm run seed                         # Run ALL seeders (slower)
```

### **Full Setup**

```bash
npm run setup:product-master        # Migration + seeder (recommended)
```

### **Development**

```bash
npm start:dev                       # Start dev server for testing
npm run build                       # Build for production
npm start                           # Run production build
```

---

## 📊 Performance Expectations

| Operation     | Time      | Notes                        |
| ------------- | --------- | ---------------------------- |
| Migration     | 5-10 min  | One-time, creates schema     |
| Seeding       | 30-60 sec | Mostly product generation    |
| Full Setup    | 10-15 min | Migration + seeding          |
| Running twice | Same      | Idempotent, skips duplicates |

---

## 🔗 Related Documentation

- **PRODUCT_MASTER_MIGRATION_QUICK_START.md** - Quick reference guide
- **SEEDER_CONSOLIDATION_ANALYSIS.md** - Details on seeders
- **MIGRATION_CONSOLIDATION_ANALYSIS.md** - Details on migrations
- **PRODUCT_MASTER_CONSOLIDATION_SUMMARY.md** - Overall summary

---

## ✨ Summary

| Need               | Command                          | Time      |
| ------------------ | -------------------------------- | --------- |
| **Fresh start**    | `npm run setup:product-master`   | 10-15 min |
| **Just schema**    | `npm run migrate:product-master` | 5-10 min  |
| **Just data**      | `npm run seed:product-master`    | 30-60 sec |
| **All migrations** | `npm run migrate`                | 20-30 min |
| **All seeders**    | `npm run seed`                   | 2-5 min   |

---

**Status:** ✅ Ready to Use  
**Created:** 2026-01-10  
**Last Updated:** 2026-01-10

**Start here:** `npm run setup:product-master`
