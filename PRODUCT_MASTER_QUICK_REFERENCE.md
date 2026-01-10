# Quick Reference: Product Master Migration & Seeding

**Bookmark this page for quick command reference**

---

## 🚀 Commands

### **Run Everything (Recommended)**

```bash
npm run migrate:seed:product-master
```

### **Run Migrations Only**

```bash
npm run migrate:product-master
```

### **Run Seeders Only**

```bash
npm run seed:product-master
```

---

## 📋 What Runs

### **9 Migrations**

1. consolidated-product-master
2. consolidated-species-product-master
3. align-product-categories-with-derivatives
4. map-products-to-derivatives
5. add-species-derivative-size-grade-mapping-id
6. add-derivative-master-id
7. add-product-flags
8. add-raw-product-support
9. fix-product-species-mapping

### **2 Seeders**

1. consolidated-product-master-seeder
2. generate-products-from-mappings

---

## ✅ Prerequisites

- [ ] MySQL/MariaDB running
- [ ] `.env` configured correctly
- [ ] `npm install` completed
- [ ] Database exists (`bse_mgmt`)

---

## 🔧 Setup (One-time)

```bash
# 1. Navigate to project
cd "/Users/mithra/Documents/bse-mgmt-system 2"

# 2. Install dependencies
npm install

# 3. Configure .env
cat .env | grep DB_
# Should show: DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT
```

---

## 🎯 Execute

```bash
# Run the command
npm run migrate:seed:product-master

# Wait for completion (~30-60 seconds)
# Green ✓ = success
# Yellow ⏭️  = already ran
# Red ✗ = error
```

---

## ✅ Verify

```bash
# Check product count
mysql -u root -p -D bse_mgmt -e "SELECT COUNT(*) as products FROM product_master;"
# Expected: 2000+

# Check species count
mysql -u root -p -D bse_mgmt -e "SELECT COUNT(*) as species FROM species_master;"
# Expected: 40+

# Check categories count
mysql -u root -p -D bse_mgmt -e "SELECT COUNT(*) as categories FROM product_category_master;"
# Expected: 50+
```

---

## 🐛 Troubleshooting

| Issue              | Fix                                                          |
| ------------------ | ------------------------------------------------------------ |
| Connection error   | Check `.env` DB settings                                     |
| Already executed   | Safe to run again (idempotent)                               |
| Permission denied  | `chmod +x scripts/*.js`                                      |
| Database not found | Create it: `mysql -u root -p -e "CREATE DATABASE bse_mgmt;"` |

---

## 📊 Status Codes

| Symbol | Meaning                           |
| ------ | --------------------------------- |
| ✓      | Migration/Seeder ran successfully |
| ⏭️     | Already executed (skipped)        |
| ✗      | Failed (check error message)      |
| ⚠️     | Warning (file not found, skipped) |

---

## 🔄 Repeat

Safe to run multiple times:

```bash
npm run migrate:seed:product-master
# Already-executed ones will be skipped with ⏭️
```

---

**Created:** 2026-01-10  
**Status:** ✅ Ready to Use
