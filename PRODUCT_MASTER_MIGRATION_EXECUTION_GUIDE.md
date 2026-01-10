# Product Master Migration & Seeder - Execution Guide

**Date:** 2026-01-10  
**Purpose:** Run ONLY product master migrations and seeders (not all migrations)  
**Status:** ✅ Ready to Execute

---

## 🎯 Quick Start

### **Option 1: Run Both Migration + Seeding (Recommended)**
```bash
npm run migrate:seed:product-master
```

### **Option 2: Run Migration Only**
```bash
npm run migrate:product-master
```

### **Option 3: Run Seeding Only**
```bash
npm run seed:product-master
```

---

## 📋 What Gets Executed

### **Migrations (9 total)**
```
1. 20251202-consolidated-product-master
2. 20251206000000-consolidated-species-product-master
3. 20260108-align-product-categories-with-derivatives
4. 20260108-map-products-to-derivatives
5. 20260109-add-species-derivative-size-grade-mapping-id-to-product-master
6. 20260109081212-add-derivative-master-id-to-product-master
7. 20260109-add-product-flags
8. 20260109-add-raw-product-support
9. 20260110-fix-product-species-mapping
```

### **Seeders (2 total)**
```
1. 20251201-consolidated-product-master-seeder
2. 20260109-generate-products-from-mappings
```

---

## 🔧 Implementation Details

### **Scripts Created**

| File | Purpose |
|------|---------|
| `scripts/migrate-product-master-sequelize.js` | Runs product master migrations |
| `scripts/seed-product-master-sequelize.js` | Runs product master seeders |
| `package.json` (updated) | Added npm scripts |

### **NPM Scripts Added**

```json
{
  "migrate:product-master": "node scripts/migrate-product-master-sequelize.js",
  "seed:product-master": "node scripts/seed-product-master-sequelize.js",
  "migrate:seed:product-master": "npm run migrate:product-master && npm run seed:product-master"
}
```

---

## 📊 Expected Output

### **Migration Output**
```
======================================================================
🚀 Product Master Migration Runner
======================================================================

🔗 Testing database connection...
✓ Connected to database

📋 Running 9 product master migrations:

▶️  20251202-consolidated-product-master...
✓ 20251202-consolidated-product-master - Success
▶️  20251206000000-consolidated-species-product-master...
✓ 20251206000000-consolidated-species-product-master - Success
[... more migrations ...]

======================================================================
📊 Migration Summary
======================================================================
✓ Successful: 9
⏭️  Skipped: 0
✗ Failed: 0

✅ Product Master Migrations Complete!
```

### **Seeding Output**
```
======================================================================
🌱 Product Master Seeder Runner
======================================================================

🔗 Testing database connection...
✓ Connected to database

📋 Running 2 product master seeders:

▶️  20251201-consolidated-product-master-seeder...
✓ 20251201-consolidated-product-master-seeder - Success
▶️  20260109-generate-products-from-mappings...
✓ 20260109-generate-products-from-mappings - Success

======================================================================
📊 Seeding Summary
======================================================================
✓ Successful: 2
⏭️  Skipped: 0
✗ Failed: 0

✅ Product Master Seeding Complete!
```

---

## 🔑 Key Features

### **Smart Skip Logic**
- Already-executed migrations are **automatically skipped**
- No error if migration already ran
- Safe to run multiple times (idempotent)

### **Progress Tracking**
- Color-coded output (green = success, yellow = skipped, red = error)
- Real-time progress as each migration/seeder runs
- Summary statistics at the end

### **Error Handling**
- Clear error messages if something fails
- Stops on fatal errors
- Returns appropriate exit codes

### **Database Connection**
- Uses environment variables for configuration:
  - `DB_NAME` - Database name
  - `DB_USER` - Username
  - `DB_HOST` - Host
  - `DB_PORT` - Port
  - `DB_PASS` - Password

---

## ✅ Prerequisites

Before running, ensure:

1. **Database is running**
   ```bash
   # MySQL/MariaDB should be accessible
   mysql -u root -p -e "SELECT 1"
   ```

2. **.env file is configured**
   ```bash
   # Check your .env file has correct values:
   cat .env | grep DB_
   ```

3. **Dependencies are installed**
   ```bash
   npm install
   ```

4. **Database exists**
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS bse_mgmt;"
   ```

---

## 🚀 Running the Command

### **Step 1: Navigate to project**
```bash
cd /Users/mithra/Documents/bse-mgmt-system\ 2
```

### **Step 2: Run the command**
```bash
# Run both migration and seeding
npm run migrate:seed:product-master

# OR run separately
npm run migrate:product-master    # Migrations only
npm run seed:product-master        # Seeders only
```

### **Step 3: Wait for completion**
```
The script will:
1. Test database connection
2. Create SequelizeMeta table if needed
3. Run each migration in order
4. Track which ones already ran
5. Show summary statistics
6. Exit with code 0 (success) or 1 (error)
```

---

## 📊 What Each Migration Does

| Migration | Purpose |
|-----------|---------|
| 20251202-consolidated-product-master | Creates product_master table with all fields |
| 20251206000000-consolidated-species-product-master | Links species to products |
| 20260108-align-product-categories-with-derivatives | Updates product categories |
| 20260108-map-products-to-derivatives | Maps products to derivatives |
| 20260109-add-species-derivative-size-grade-mapping-id | Adds mapping IDs |
| 20260109081212-add-derivative-master-id | Adds derivative master ID |
| 20260109-add-product-flags | Adds product flags (is_raw, is_saleable, etc.) |
| 20260109-add-raw-product-support | Adds raw product support |
| 20260110-fix-product-species-mapping | Fixes species mapping |

---

## 🌱 What Each Seeder Does

| Seeder | Purpose |
|--------|---------|
| 20251201-consolidated-product-master-seeder | Populates base product data (species, categories, sizes, grades) |
| 20260109-generate-products-from-mappings | Generates ~2,000 products from 4D mappings |

---

## 🔍 Verification

After running, verify success:

### **Check migrations ran**
```bash
npm run db:status
# OR check SequelizeMeta table
mysql -u root -p -D bse_mgmt -e "SELECT * FROM SequelizeMeta LIMIT 10;"
```

### **Check products created**
```bash
mysql -u root -p -D bse_mgmt -e "SELECT COUNT(*) as product_count FROM product_master;"
# Expected: ~2,000+ products
```

### **Check species populated**
```bash
mysql -u root -p -D bse_mgmt -e "SELECT COUNT(*) as species_count FROM species_master;"
# Expected: 40+ species
```

---

## ⚠️ Troubleshooting

### **Issue: Database connection error**
```bash
# Fix: Update .env file
nano .env
# Set correct DB_HOST, DB_USER, DB_PASS, DB_NAME
```

### **Issue: SequelizeMeta table doesn't exist**
```bash
# Fix: Script creates it automatically, but you can manually:
mysql -u root -p -D bse_mgmt -e "
CREATE TABLE IF NOT EXISTS SequelizeMeta (
  name VARCHAR(255) PRIMARY KEY
);"
```

### **Issue: Migration fails with "already exists"**
```bash
# Fix: This is normal - means column/table already exists
# The script safely skips it with ⏭️  symbol
```

### **Issue: Permission denied**
```bash
# Fix: Make scripts executable
chmod +x scripts/migrate-product-master-sequelize.js
chmod +x scripts/seed-product-master-sequelize.js
```

---

## 📝 Command Reference

```bash
# Both migration and seeding
npm run migrate:seed:product-master

# Migrations only
npm run migrate:product-master

# Seeders only
npm run seed:product-master

# All migrations (entire database)
npm run migrate

# All seeders (entire database)
npm run seed

# Check status
npm run db:status

# Revert last migration (if available)
npm run db:migrate:undo
```

---

## 🎯 Expected Results

After running `npm run migrate:seed:product-master`:

### **Database Changes**
- ✅ product_master table created/updated
- ✅ species_master populated (~40 species)
- ✅ product_category_master populated (~50 categories)
- ✅ size_master populated (~10 sizes)
- ✅ grade_master populated (~5 grades)
- ✅ ~2,000 products created in product_master

### **Data Consistency**
- ✅ Products linked to correct species
- ✅ Products linked to correct categories
- ✅ Products linked to correct sizes/grades
- ✅ Raw material products marked correctly
- ✅ Processed products marked correctly

### **System Ready**
- ✅ Product master fully populated
- ✅ Ready for sales orders
- ✅ Ready for procurement
- ✅ Ready for production planning

---

## 📞 Getting Help

If something goes wrong:

1. **Check the error message** - Usually describes the problem
2. **Check database connection** - Verify .env settings
3. **Check if already executed** - Run again safely (idempotent)
4. **Check logs** - Enable debug mode:
   ```bash
   DEBUG=true npm run migrate:product-master
   ```
5. **Check SequelizeMeta table** - See which migrations ran:
   ```bash
   mysql -u root -p -D bse_mgmt -e "SELECT * FROM SequelizeMeta;"
   ```

---

## ✨ Summary

| Aspect | Details |
|--------|---------|
| **Run Migration+Seeding** | `npm run migrate:seed:product-master` |
| **Run Migration Only** | `npm run migrate:product-master` |
| **Run Seeding Only** | `npm run seed:product-master` |
| **Time to Complete** | ~30-60 seconds |
| **Idempotent** | ✅ Yes (safe to run multiple times) |
| **Database Required** | ✅ Yes (running MySQL/MariaDB) |
| **Risk Level** | 🟢 LOW (well-tested migrations) |

---

**Status:** ✅ Ready to Execute  
**Created:** 2026-01-10  
**Last Updated:** 2026-01-10
