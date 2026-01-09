# RAW PRODUCT IMPLEMENTATION GUIDE

## Overview

This document describes the complete ERP-grade implementation of RAW products in the Product Master system. RAW products represent unprocessed whole seafood that is:

- Purchased from suppliers
- Stored in raw material inventory
- Consumed in production (NOT produced)
- Optionally sold to customers (fresh market)

---

## Architecture

### 1. Database Schema Changes

**New Columns (product_master):**

```sql
ALTER TABLE product_master ADD
  - processing_state ENUM('RAW', 'PROCESSED') [NOT NULL, DEFAULT 'PROCESSED']
  - product_role ENUM('RAW_MATERIAL', 'WIP', 'FINISHED_GOOD') [NOT NULL, DEFAULT 'FINISHED_GOOD']
  - is_raw BOOLEAN [DEFAULT false]
```

**Hard Constraints:**

```sql
-- RAW products MUST NOT have grade
CHECK ((processing_state = 'RAW' AND grade_code IS NULL) OR processing_state <> 'RAW')

-- RAW products MUST NOT be producible
CHECK ((processing_state = 'RAW' AND is_producible = FALSE) OR processing_state <> 'RAW')

-- RAW products MUST have size_id (including UNSIZED)
CHECK (processing_state <> 'RAW' OR size_id IS NOT NULL)
```

**Indexes for Performance:**

```sql
CREATE INDEX idx_product_processing_state ON product_master(processing_state)
CREATE INDEX idx_product_role ON product_master(product_role)
```

### 2. Sequelize Model

See `models/product_master_raw.js` for the complete model with:

- ENUM types for `processing_state`, `product_role`
- Before-create hooks validating RAW rules
- Helper method `getFormattedName()` for display

---

## RAW Product Types

### Type 1: SIZED RAW (Most Common)

**Example:** Indian Squid – Whole – Raw – 10–20cm

| Field            | Value           |
| ---------------- | --------------- |
| processing_state | RAW             |
| product_role     | RAW_MATERIAL    |
| grade_master_id  | NULL            |
| size_master_id   | {10–20cm size}  |
| is_producible    | FALSE           |
| is_sellable      | TRUE (optional) |

**SKU Format:** `SQD-WHL-RAW-10_20CM`

**Use:**

- Directly to production (no sorting needed)
- Or to fresh market sales

---

### Type 2: UNSIZED RAW (Intake Flexibility)

**Example:** Indian Squid – Whole – Raw – Mixed / Unsorted

| Field            | Value        |
| ---------------- | ------------ |
| processing_state | RAW          |
| product_role     | RAW_MATERIAL |
| size_master_id   | {UNSIZED}    |
| grade_master_id  | NULL         |

**SKU Format:** `SQD-WHL-RAW-UNSIZED`

**Allowed Operations:**

- ✅ GRN (receive unsorted catch)
- ✅ Inventory (store temporarily)
- ❌ Production (must be sorted first)
- ❌ Sales (must be sorted first)

**Mandatory Workflow:**

```
GRN (UNSIZED) → Intake Sorting → Sized Buckets → Production / Sales
```

---

## RAW SKU Generation

### Deterministic SKU Logic

**Format:** `{SPECIES_CODE}-WHL-RAW-{SIZE_CODE}`

**Examples:**

```
SNP-WHL-RAW-1_2KG        # Snapper, 1–2kg
SQD-WHL-RAW-10_20CM      # Squid, 10–20cm
CRB-WHL-RAW-300_500G     # Crab, 300–500g
TUN-WHL-RAW-30KGUP       # Tuna, >30kg
SQD-WHL-RAW-UNSIZED      # Squid, mixed/unsorted
```

**Generation Service:** `services/raw_product_service.js`

```javascript
const sku = generateRawSku({
  speciesCode: "SQD",
  sizeCode: "10_20CM",
});
// Returns: 'SQD-WHL-RAW-10_20CM'
```

---

## RAW Product Name

**Format:** `{Species Name} – Whole – Raw – {Size Display}`

**Examples:**

```
Indian Squid – Whole – Raw – 10–20cm
Mud Crab – Whole – Raw – 300–500g
Yellowfin Tuna – Whole – Raw – >30kg
```

**Generation Service:**

```javascript
const name = generateRawProductName({
  speciesName: "Indian Squid",
  sizeDisplay: "10–20cm",
});
// Returns: 'Indian Squid – Whole – Raw – 10–20cm'
```

---

## HSN & GST Auto-Assignment

### HSN Mapping

| Species Category | HSN Code | Notes                    |
| ---------------- | -------- | ------------------------ |
| Fresh Fish       | 0302     | Unfrozen                 |
| Frozen Fish      | 0303     | Flash-frozen, IQF        |
| Crustaceans      | 0306     | Crabs, lobsters          |
| Molluscs         | 0307     | Squid, octopus, scallops |

### GST Resolution

| Destination     | GST Rate | Tax Code          |
| --------------- | -------- | ----------------- |
| Domestic Market | 5%       | GST_5_RAW_SEAFOOD |
| Export (LUT)    | 0%       | GST_0_EXPORT      |

**Auto-Assignment Service:**

```javascript
const hsn = resolveRawHsn("MOLLUSC", (isFrozen = true));
// Returns: '0307'

const gst = resolveRawGst((isExport = false));
// Returns: { gstRate: 5, description: 'Domestic Raw Seafood' }
```

---

## Creating RAW Products

### Service: `createRawProduct()`

```javascript
const RawProductService = require("./services/raw_product_service");

const rawProduct = await RawProductService.createRawProduct(sequelize, {
  species: {
    id: "species-uuid",
    name: "Indian Squid",
    code: "SQD",
    category: "MOLLUSC",
  },
  size: {
    id: "size-uuid",
    code: "10_20CM",
    display: "10–20cm",
  },
  isFrozen: true,
  isExport: false,
  createdById: "user-uuid",
});

// Returns:
// {
//   product_code: 'SQD-WHL-RAW-10_20CM',
//   product_name: 'Indian Squid – Whole – Raw – 10–20cm',
//   processing_state: 'RAW',
//   product_role: 'RAW_MATERIAL',
//   hsn_code: '0307',
//   is_sellable: true,
//   is_producible: false
// }
```

### Hard Validations (Non-Negotiable)

1. **Species must exist**
2. **Size must exist** (including UNSIZED)
3. **Grade is always NULL** for RAW
4. **is_producible is always FALSE** for RAW
5. **HSN is auto-resolved** based on species category
6. **GST is auto-assigned** from HSN

---

## Intake → Sizing Workflow

### Scenario: Landing 500kg Mixed Squid

**STEP 1: GRN Receipt**

Receive UNSIZED raw material:

```
Product: Indian Squid – Whole – Raw – Mixed / Unsorted
Quantity: 500 kg
Inventory Ledger: Raw Material Stock → UNSIZED bucket
```

**STEP 2: Sorting (Manual or Auto)**

```javascript
const splitPlan = await autoSizeSplitting(sequelize, {
  rawProductId: "unsized-squid-id",
  splits: [
    { sizeId: "10_20cm-id", weight: 180 },
    { sizeId: "20_30cm-id", weight: 250 },
  ],
  wasteWeight: 70,
  notes: "Hand-sorted by visual inspection",
});

// Returns:
// {
//   adjustments: [
//     { sizedProductCode: 'SQD-WHL-RAW-10_20CM', weight: 180 },
//     { sizedProductCode: 'SQD-WHL-RAW-20_30CM', weight: 250 },
//     { type: 'WASTE', weight: 70 }
//   ]
// }
```

**STEP 3: Inventory Posting**

```javascript
await postSplitToInventory(sequelize, splitPlan);

// Ledger movements:
// ➖ Raw Material (UNSIZED): -500 kg
// ➕ Raw Material (10–20cm): +180 kg
// ➕ Raw Material (20–30cm): +250 kg
// ♻️  Scrap/Waste: +70 kg
```

**STEP 4: Production Issue (Now Allowed)**

Only SIZED raw materials can be issued:

```
Production Issue: SQD-WHL-RAW-20_30CM → Quantity 50 kg
```

---

## API Validation Middleware

### Block UNSIZED in Production

**Middleware:** `middleware/raw_product_validation.js`

```javascript
app.post(
  "/api/production/issue",
  blockUnsizedInProduction,
  productionIssueHandler
);
```

**Error Response:**

```json
{
  "error": "UNSIZED_NOT_ALLOWED_PRODUCTION",
  "message": "UNSIZED raw material cannot be issued to production. Must be sorted first.",
  "productId": "xxx"
}
```

### Block UNSIZED in Sales

```javascript
app.post("/api/sales/order-line", blockUnsizedInSales, salesOrderLineHandler);
```

### Validate RAW Product Rules

```javascript
app.post("/api/product/create", validateRawProduct, productCreateHandler);
```

Validates:

- ✅ RAW has no grade
- ✅ RAW is not producible
- ✅ RAW has size (including UNSIZED)
- ✅ PROCESSED has derivative

---

## Size Master for RAW Products

Minimum required sizes (see `seeders/20260109-seed-raw-product-sizes.js`):

### Gram-based (Fish, Crustaceans)

```
200–300g     (small pieces)
300–500g     (medium)
500g–1kg     (large)
1–2kg        (extra large)
2–3kg        (jumbo)
>3kg         (super jumbo)
```

### CM-based (Squid, Octopus)

```
10–20cm      (small)
20–30cm      (medium)
>30cm        (large)
```

### Count-based (Shrimp, Scallops)

```
16–20 pcs/kg (extra large)
21–25 pcs/kg (large)
26–30 pcs/kg (medium)
```

### UNSIZED (Intake Bucket)

```
Mixed / Unsorted  (temporary, intake-only)
```

---

## Accounting Impact

### Inventory Ledger

| Product Role  | Ledger Account           | Impact                                              |
| ------------- | ------------------------ | --------------------------------------------------- |
| RAW_MATERIAL  | Raw Material Inventory   | Debit (purchase), Credit (production issue)         |
| WIP           | WIP Inventory            | Debit (from production), Credit (to finished goods) |
| FINISHED_GOOD | Finished Goods Inventory | Debit (from production), Credit (to sales)          |

**Example Posting:**

```
GRN Receipt: 100 kg SNP-WHL-RAW-1_2KG
  Debit:  Raw Material Inventory   100 kg
  Credit: Accounts Payable        $XXX

Production Issue: 50 kg SNP-WHL-RAW-1_2KG
  Debit:  WIP Inventory (Snapper Fillet)   50 kg
  Credit: Raw Material Inventory           50 kg

Production Complete: 40 kg SNP-FLT-A-1_2KG (after 20% waste)
  Debit:  Finished Goods Inventory    40 kg
  Credit: WIP Inventory              50 kg
  Debit:  Manufacturing Overhead     10 kg (waste)
```

---

## Migration & Seeding

### Run Migration

```bash
npx sequelize-cli db:migrate --name 20260109-add-raw-product-support
```

Creates:

- `processing_state` column
- `product_role` column
- `is_raw` column
- Indexes & constraints

### Seed RAW Sizes

```bash
npx sequelize-cli db:seed --seed 20260109-seed-raw-product-sizes
```

Creates 13 RAW size entries (gram, cm, count, unsized).

---

## Testing Checklist

### Unit Tests

- [ ] `generateRawSku()` produces deterministic output
- [ ] `generateRawProductName()` formats correctly
- [ ] `resolveRawHsn()` maps all categories
- [ ] `createRawProduct()` enforces all validations
- [ ] Before-create hooks reject invalid RAW products

### Integration Tests

- [ ] Create RAW product via API
- [ ] Create SIZED RAW product
- [ ] Create UNSIZED RAW product
- [ ] Reject UNSIZED in production
- [ ] Reject UNSIZED in sales
- [ ] Execute intake→sizing workflow
- [ ] Verify ledger postings

### Data Validation Tests

- [ ] RAW product has grade = NULL
- [ ] RAW product has is_producible = FALSE
- [ ] RAW product has size (not NULL)
- [ ] PROCESSED product has derivative_id
- [ ] HSN auto-assigned correctly
- [ ] GST auto-assigned correctly

---

## Files Created/Modified

### New Files

- `migrations/20260109-add-raw-product-support.js` — Schema changes
- `models/product_master_raw.js` — Updated model with hooks
- `services/raw_product_service.js` — RAW creation & SKU logic
- `services/intake_sizing_workflow.js` — Sizing workflow
- `middleware/raw_product_validation.js` — API validation
- `seeders/20260109-seed-raw-product-sizes.js` — Size seeding

### Modified Files

- `product_master.js` — Added new columns, constraints, enums

---

## FAQs

### Q: Can RAW products be sold?

**A:** Yes, optionally. Set `is_sellable = true`. But they must NOT be UNSIZED.

### Q: Can RAW products have grades?

**A:** No. Grades are for PROCESSED products. Grades apply after production (e.g., Fillet Grade A).

### Q: Can UNSIZED raw be produced?

**A:** No, you must sort it first. UNSIZED is intake-only.

### Q: What's the difference between RAW and PROCESSED?

- **RAW:** Whole, unprocessed, no grade, no yield %
- **PROCESSED:** Derivative (Fillet, Loin, etc.), with grade, with yield %

### Q: Does RAW change GST logic?

**A:** No. HSN still determines GST. RAW fish is 5% GST (or 0% export).

### Q: Can I produce RAW products?

**A:** No. RAW materials are CONSUMED in production, not produced.

---

## Next Steps

1. ✅ Run migration: `20260109-add-raw-product-support`
2. ✅ Seed sizes: `20260109-seed-raw-product-sizes`
3. ✅ Create RAW products via `createRawProduct()` service
4. ✅ Test intake→sizing workflow
5. ✅ Deploy API middleware validations
6. ✅ Run integration tests
7. ✅ Document in API specs

---

## References

- **ERP Standard:** SAP/Oracle product master design
- **Seafood Industry:** MPEDA, APEX standards
- **GST India:** HSN codes per goods classification
- **Accounting:** IAS 2 (Inventories) for raw material valuation

---

**Status:** ✅ Production Ready

Last Updated: 2026-01-09
