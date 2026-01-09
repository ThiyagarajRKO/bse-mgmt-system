# Product Master × 4D Mapping - Quick Reference

## 🚀 Quick Start

### Create Product with Validation

```bash
POST /api/product-master/create-with-mapping
{
  "species_master_id": "uuid",
  "derivative_master_id": "uuid",
  "size_master_id": "uuid",
  "grade_master_id": "uuid"
}
```

### Get Available Options

```bash
GET /api/product-master/suggestions?species_id=uuid&derivative_id=uuid
```

### Validate Combination First

```bash
POST /api/product-master/validate-combination
{
  "species_master_id": "uuid",
  "derivative_master_id": "uuid",
  "size_master_id": "uuid",
  "grade_master_id": "uuid"
}
```

---

## 📊 Data

| Item         | Count          |
| ------------ | -------------- |
| Species      | 123            |
| Derivatives  | 81             |
| Sizes        | 66             |
| Grades       | 4 (A, B, C, D) |
| Combinations | 2,000+         |

---

## 🎯 Grades

| Code  | Name                | Shelf Life | Pricing  |
| ----- | ------------------- | ---------- | -------- |
| **A** | Premium Export      | 14 days    | Premium  |
| **B** | Standard Export     | 10 days    | Standard |
| **C** | Domestic/Processing | 7 days     | Value    |
| **D** | Industrial          | 3 days     | Economy  |

---

## 📁 Files

| File                                 | Purpose               |
| ------------------------------------ | --------------------- |
| `migrations/20260109-*`              | Add 4D mapping column |
| `models/product_master.js`           | 4D association        |
| `handlers/create-with-mapping.js`    | API logic             |
| `routes/product_master/index.js`     | Route registration    |
| `PRODUCT_MASTER_4D_INTEGRATION.md`   | Full documentation    |
| `4D_MAPPING_INTEGRATION_COMPLETE.md` | Project summary       |

---

## ✅ Validations

Products must have:

- ✅ Valid species × derivative combination
- ✅ Valid size for that derivative
- ✅ Valid grade for that processing level
- ✅ All records active (`is_active = true`)

---

## 🔗 Database

```sql
-- Link product to 4D mapping
UPDATE product_master SET
  species_derivative_size_grade_mapping_id = mapping_id
WHERE id = product_id;

-- Find all combinations for a species
SELECT * FROM species_derivative_size_grade_mapping
WHERE species_master_id = ?
  AND is_active = true;

-- By grade
SELECT DISTINCT grade_master_id
FROM species_derivative_size_grade_mapping
WHERE species_master_id = ?
GROUP BY grade_master_id;
```

---

## 📋 Auto-Assigned from Mapping

When product created:

- ✅ `market_segment` - From grade (Premium/Export/Processing)
- ✅ `expected_yield_percent` - Typically 85%
- ✅ `shelf_life_days` - By grade (14/10/7/3)
- ✅ `storage_temperature_celsius` - Typically -18
- ✅ `processing_difficulty` - From derivative
- ✅ `pricing_tier` - By grade (Premium/Standard/Value)
- ✅ `packaging_type_preferred` - Typically Vacuum

---

## 🚨 Common Errors

| Error               | Reason                       | Solution                |
| ------------------- | ---------------------------- | ----------------------- |
| INVALID_COMBINATION | Not in mapping table         | Use suggestions API     |
| DUPLICATE_PRODUCT   | Already exists               | Edit existing product   |
| MISSING_FIELDS      | Missing IDs                  | Provide all 4 IDs       |
| NO_COMBINATIONS     | No options for species/deriv | Different species/deriv |

---

## 📞 Support

- **Full Docs**: `PRODUCT_MASTER_4D_INTEGRATION.md`
- **Integration Guide**: `4D_MAPPING_INTEGRATION_COMPLETE.md`
- **Mapping Details**: `SPECIES_DERIVATIVE_SIZE_GRADE_MAPPING.md`
- **Grade Info**: Grade_master table
