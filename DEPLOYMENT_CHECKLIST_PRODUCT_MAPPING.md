# Product Species Mapping Fix - Deployment Checklist

**Date:** 10 January 2026  
**Priority:** HIGH  
**Scope:** Product generation and species association

---

## Pre-Deployment

- [ ] Backup current database

  ```bash
  pg_dump bse_mgmt_system > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Verify existing product count

  ```sql
  SELECT COUNT(*) FROM product_master;
  ```

- [ ] Verify 4D mapping count

  ```sql
  SELECT COUNT(*) FROM species_derivative_size_grade_mapping WHERE is_active = true;
  ```

- [ ] Verify species count
  ```sql
  SELECT COUNT(*) FROM species_master WHERE is_active = true;
  ```

---

## Migration Deployment

- [ ] Review migration file: `20260110-fix-product-species-mapping.js`

  - Validates species exist
  - Creates missing "Whole" categories
  - Logs validation results
  - NO destructive operations

- [ ] Run migration

  ```bash
  npx sequelize-cli db:migrate
  ```

- [ ] Verify migration output

  ```
  Expected: ✅ Product species mapping validation complete
  ```

- [ ] Check migration history
  ```bash
  npm sequelize-cli db:migrate:status
  ```

---

## Seeder Deployment

- [ ] Review seeder file: `seeders/20260109-generate-products-from-mappings.js`

  - Generates products from 4D mappings
  - Links to correct species via categories
  - Includes species names in product names
  - Transaction-protected with rollback
  - Comprehensive validation and logging

- [ ] Delete existing products (if needed)

  ```bash
  # ONLY if you want to regenerate from scratch
  npx sequelize-cli db:seed:undo --seed seeders/20260109-generate-products-from-mappings.js
  ```

- [ ] Run seeder

  ```bash
  npx sequelize-cli db:seed --seed seeders/20260109-generate-products-from-mappings.js
  ```

- [ ] Verify seeder output
  ```
  Expected: ✅ Product generation complete!
  Expected: 📊 Total products created: ~1,850
  Expected: Unique Species: 15
  ```

---

## Post-Deployment Verification

### 1. Product Count

- [ ] Verify correct product count
  ```sql
  SELECT COUNT(*) as total FROM product_master WHERE is_active = true;
  -- Expected: ~1,850-2,000 products
  ```

### 2. Species Association

- [ ] Verify species names in products

  ```sql
  SELECT DISTINCT
    SUBSTRING(product_name, 1, 30) as product_start,
    COUNT(*) as count
  FROM product_master
  WHERE is_active = true AND species_derivative_size_grade_mapping_id IS NOT NULL
  GROUP BY SUBSTRING(product_name, 1, 30)
  LIMIT 5;
  ```

- [ ] Verify category-species links
  ```sql
  SELECT COUNT(*) as orphaned FROM product_master pm
  WHERE pm.product_category_master_id NOT IN
    (SELECT id FROM product_category_master WHERE is_active = true);
  -- Expected: 0 orphaned products
  ```

### 3. 4D Mapping Reference

- [ ] Verify all products reference 4D mappings
  ```sql
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN species_derivative_size_grade_mapping_id IS NOT NULL THEN 1 ELSE 0 END) as mapped
  FROM product_master WHERE is_active = true;
  -- Expected: mapped = total (or close to it)
  ```

### 4. Species Distribution

- [ ] Check products by species
  ```sql
  SELECT
    s.species_name,
    COUNT(pm.id) as product_count
  FROM product_master pm
  INNER JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
  INNER JOIN species_master s ON pcm.species_master_id = s.id
  WHERE pm.is_active = true
  GROUP BY s.id, s.species_name
  ORDER BY product_count DESC;
  ```

### 5. Data Quality Check

- [ ] Verify product names include species
  ```sql
  SELECT
    COUNT(*) as with_species_name,
    COUNT(CASE WHEN product_name NOT LIKE s.species_name || '%'
           THEN 1 END) as without_species_name
  FROM product_master pm
  INNER JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
  INNER JOIN species_master s ON pcm.species_master_id = s.id
  WHERE pm.is_active = true;
  ```

---

## API Testing

### Test Product Retrieval

```bash
curl -X GET "http://localhost:3000/api/v1/master/product" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:

```json
{
  "status": "success",
  "data": {
    "rows": [
      {
        "id": "uuid",
        "product_name": "Tiger Shrimp – Raw Whole – 10/20 – A",
        "product_category_master_id": "uuid",
        "ProductCategoryMaster": {
          "id": "uuid",
          "product_category": "Whole",
          "species_master_id": "uuid",
          "SpeciesMaster": {
            "id": "uuid",
            "species_name": "Tiger Shrimp",
            "species_code": "CRUST_TIGER"
          }
        }
      }
    ]
  }
}
```

---

## Rollback Procedure

### If Something Goes Wrong

1. **Stop the application**

   ```bash
   npm stop
   ```

2. **Rollback seeder** (removes generated products)

   ```bash
   npx sequelize-cli db:seed:undo --seed seeders/20260109-generate-products-from-mappings.js
   ```

3. **Rollback migration** (reverts validation logic)

   ```bash
   npx sequelize-cli db:migrate:undo
   ```

4. **Restore from backup** (if needed)

   ```bash
   psql bse_mgmt_system < backup_YYYYMMDD_HHMMSS.sql
   ```

5. **Restart application**
   ```bash
   npm start
   ```

---

## Success Criteria

✅ **All of the following must be true:**

- [ ] ~1,850 products created from 4D mappings
- [ ] All products have species names in product_name field
- [ ] All products linked to correct species via product_category_master
- [ ] All products reference valid 4D mappings
- [ ] No orphaned products or categories
- [ ] Product names follow convention: `[SPECIES] – [FORM] – [SIZE] – [GRADE]`
- [ ] Product API returns correct species association
- [ ] No database errors in logs

---

## Monitoring Post-Deployment

### Logs to Check

```bash
# Application logs
tail -f logs/application.log | grep -i "product\|species"

# Database logs
tail -f /var/log/postgresql/postgresql.log | grep -i "error"
```

### Metrics to Track

- [ ] Product retrieval API response time
- [ ] Database query performance
- [ ] Memory usage (batch inserts should be ~500 per batch)
- [ ] No error spikes in monitoring

---

## Signoff

- [ ] **Data Architect:** Approved species mapping structure
- [ ] **QA Lead:** Verified all validation queries pass
- [ ] **DevOps:** Database backup completed
- [ ] **Engineering Lead:** Approved rollback procedure
- [ ] **Deployment Engineer:** Executed deployment

---

## Additional Notes

**Key Points:**

- Migration is idempotent (safe to run multiple times)
- Seeder checks for existing products (won't duplicate)
- Both operations support rollback
- Comprehensive logging for troubleshooting
- Transaction-protected operations

**Files:**

- Migration: `migrations/20260110-fix-product-species-mapping.js`
- Seeder: `seeders/20260109-generate-products-from-mappings.js`
- Documentation: `PRODUCT_SPECIES_MAPPING_COMPLETE_FIX.md`

**Contact:** [Your Team Contact Info]

---

**Last Updated:** 10 January 2026  
**Status:** ✅ Ready for Deployment
