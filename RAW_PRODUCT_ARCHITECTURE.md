# RAW PRODUCT SYSTEM ARCHITECTURE

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/product/raw          POST /api/intake/sort           │
│  POST /api/production/issue     POST /api/sales/order-line      │
│                                                                   │
│  ↓ validateRawProduct ↓                                         │
│  ↓ blockUnsizedInProduction ↓                                   │
│  ↓ blockUnsizedInSales ↓                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  raw_product_validation.js                                      │
│  • blockUnsizedInProduction()                                   │
│  • blockUnsizedInSales()                                        │
│  • validateRawNotProducible()                                   │
│  • validateRawNoGrade()                                         │
│  • validateRawHasSize()                                         │
│  • validateProcessedHasDerivative()                             │
│  • validateRawProduct()                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICE/BUSINESS LOGIC LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │ raw_product_service  │   │ intake_sizing_       │           │
│  │                      │   │ workflow.js          │           │
│  │ • generateRawSku()   │   │                      │           │
│  │ • generateRawName()  │   │ • autoSizeSplitting()│           │
│  │ • resolveRawHsn()    │   │ • postSplitToInv()   │           │
│  │ • resolveRawGst()    │   │ • rejectUnsized...   │           │
│  │ • createRawProduct() │   │                      │           │
│  │ • splitUnsizedRaw()  │   │                      │           │
│  │ • validate...()      │   │                      │           │
│  └──────────────────────┘   └──────────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MODEL/ORM LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  product_master_raw.js (Sequelize Model)                       │
│                                                                   │
│  Fields:                        Hooks:                          │
│  • product_code (SKU)          • beforeCreate                   │
│  • product_name                • beforeUpdate                   │
│  • processing_state (ENUM)     • getFormattedName()            │
│  • product_role (ENUM)         • isUnsized()                   │
│  • is_raw (BOOLEAN)                                             │
│  • grade_id (nullable)                                          │
│  • size_id (required for RAW)                                   │
│  • derivative_id (required for PROCESSED)                       │
│  • hsn_code                                                     │
│  • gst_id                                                       │
│                                                                   │
│  Associations:                                                  │
│  • belongsTo(SpeciesMaster)                                    │
│  • belongsTo(SizeMaster)                                       │
│  • belongsTo(GradeMaster)                                      │
│  • belongsTo(DerivativeMaster)                                 │
│  • belongsTo(GstMaster)                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  product_master TABLE                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id                                                       │  │
│  │ product_code (UNIQUE, generated)                         │  │
│  │ product_name (generated)                                │  │
│  │ species_master_id (FK)                                   │  │
│  │ size_master_id (FK, NOT NULL for RAW)                    │  │
│  │ grade_master_id (FK, NULL for RAW)                       │  │
│  │ derivative_master_id (FK, NULL for RAW)                  │  │
│  │ processing_state (ENUM: RAW, PROCESSED) — NEW            │  │
│  │ product_role (ENUM) — NEW                                │  │
│  │ is_raw (BOOLEAN) — NEW                                   │  │
│  │ hsn_code (auto-assigned)                                │  │
│  │ gst_master_id (FK, auto-assigned)                        │  │
│  │ is_sellable, is_producible                               │  │
│  │ ... other columns ...                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  CONSTRAINTS:                                                   │
│  • chk_raw_no_grade: RAW → grade IS NULL                      │
│  • chk_raw_not_producible: RAW → is_producible = FALSE        │
│  • chk_raw_size_required: RAW → size_id IS NOT NULL           │
│                                                                   │
│  INDEXES:                                                       │
│  • idx_product_processing_state (for RAW filtering)            │
│  • idx_product_role (for inventory ledger)                     │
│                                                                   │
│  size_master TABLE — 13 RAW SIZES:                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Gram-based: 200_300G, 300_500G, 500G_1KG, 1_2KG,         │  │
│  │             2_3KG, 3KGUP                                 │  │
│  │ CM-based:   10_20CM, 20_30CM, 30CMUP                     │  │
│  │ Count-based: 16_20_COUNT, 21_25_COUNT, 26_30_COUNT       │  │
│  │ Intake:     UNSIZED (temporary)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Raw Product Creation

```
API Request
│
├─ POST /api/product/raw
│  {
│    speciesId: "squid-uuid",
│    sizeId: "10_20cm-uuid",
│    isFrozen: true,
│    isExport: false
│  }
│
↓ validateRawProduct Middleware
│  ├─ Check species exists
│  ├─ Check size exists
│  ├─ Validate processing_state
│  └─ Pass/Reject
│
↓ createRawProduct(sequelize, payload)
│
├─ generateRawSku({ speciesCode, sizeCode })
│  └─ Returns: "SQD-WHL-RAW-10_20CM"
│
├─ generateRawProductName({ speciesName, sizeDisplay })
│  └─ Returns: "Indian Squid – Whole – Raw – 10–20cm"
│
├─ resolveRawHsn(speciesCategory, isFrozen)
│  └─ Returns: "0307"
│
├─ resolveRawGst(isExport)
│  └─ Returns: { gstRate: 5, code: "GST_5_RAW_SEAFOOD" }
│
├─ ProductMaster.create({
│    product_code: "SQD-WHL-RAW-10_20CM",
│    product_name: "Indian Squid – Whole – Raw – 10–20cm",
│    processing_state: "RAW",
│    product_role: "RAW_MATERIAL",
│    is_raw: true,
│    grade_master_id: null,
│    is_producible: false,
│    hsn_code: "0307",
│    gst_id: "{gst-uuid}",
│    ...
│  })
│
↓ beforeCreate Hook (Sequelize)
│  ├─ Verify grade_id IS NULL
│  ├─ Verify is_producible = FALSE
│  ├─ Verify size_id IS NOT NULL
│  └─ Persist to DB
│
↓ Database Layer
│  ├─ INSERT into product_master (with checks)
│  ├─ Verify constraints:
│  │  ├─ chk_raw_no_grade: ✅ grade IS NULL
│  │  ├─ chk_raw_not_producible: ✅ is_producible = FALSE
│  │  └─ chk_raw_size_required: ✅ size_id IS NOT NULL
│  └─ COMMIT
│
↓ API Response
{
  "status": "success",
  "data": {
    "id": "product-uuid",
    "product_code": "SQD-WHL-RAW-10_20CM",
    "product_name": "Indian Squid – Whole – Raw – 10–20cm",
    "processing_state": "RAW",
    "product_role": "RAW_MATERIAL",
    "is_raw": true,
    "hsn_code": "0307",
    "gst_rate": 5,
    "is_producible": false
  }
}
```

---

## Data Flow: Intake → Sizing → Production

```
┌───────────────────────┐
│ STEP 1: GRN RECEIPT   │
└───────────────────────┘

GRN Input:
  Product: SQD-WHL-RAW-UNSIZED
  Quantity: 500 kg
  Supplier: ABC Seafood

→ Inventory Posting (Raw Material Stock)
  ├─ Debit: Raw Material – Unsized  500 kg
  └─ Credit: Accounts Payable      $5,000

Inventory State:
  SQD-WHL-RAW-UNSIZED: 500 kg ✓


┌──────────────────────┐
│ STEP 2: SORTING      │
└──────────────────────┘

Manual/Auto Sorting:
  Input: 500 kg mixed squid
  Splits:
    ├─ 180 kg → 10–20cm
    ├─ 250 kg → 20–30cm
    └─  70 kg → Waste

→ API: POST /api/intake/sort
  {
    "rawProductId": "unsized-squid-id",
    "splits": [
      { "sizeId": "10_20cm-id", "weight": 180 },
      { "sizeId": "20_30cm-id", "weight": 250 }
    ],
    "wasteWeight": 70
  }

→ autoSizeSplitting() validates & creates adjustment plan
→ blockUnsizedInProduction() middleware validates splits


┌───────────────────────────────┐
│ STEP 3: INVENTORY POSTING     │
└───────────────────────────────┘

postSplitToInventory() executes:

  Inventory Adjustments:
  ├─ SQD-WHL-RAW-UNSIZED: -500 kg
  ├─ SQD-WHL-RAW-10_20CM: +180 kg
  ├─ SQD-WHL-RAW-20_30CM: +250 kg
  └─ SCRAP/WASTE: +70 kg

Inventory State:
  SQD-WHL-RAW-UNSIZED: 0 kg (empty)
  SQD-WHL-RAW-10_20CM: 180 kg ✓
  SQD-WHL-RAW-20_30CM: 250 kg ✓
  SCRAP: 70 kg ✓


┌──────────────────────────┐
│ STEP 4: PRODUCTION ISSUE │
└──────────────────────────┘

Issue to Production:
  Product: SQD-WHL-RAW-20_30CM
  Quantity: 50 kg
  Destination: Cleaning Unit

→ API: POST /api/production/issue
  {
    "productId": "sqd-10_20cm-id",
    "quantity": 50,
    "destination": "Cleaning Unit"
  }

→ blockUnsizedInProduction() allows ✓ (not UNSIZED)

→ Inventory Posting:
  ├─ Debit: WIP – Squid Cleaning    50 kg
  └─ Credit: Raw Material – 20_30cm 50 kg

Inventory State:
  SQD-WHL-RAW-20_30CM: 200 kg (250 - 50)
  WIP – Squid Cleaning: 50 kg


┌──────────────────────────┐
│ STEP 5: PRODUCTION       │
└──────────────────────────┘

Production Recipe:
  Input:  SQD-WHL-RAW-20_30CM 50 kg
  Output: SQD-FLT-A-20_30CM 40 kg (80% yield)
  Loss:   Trim waste 10 kg

→ Inventory Posting:
  ├─ Debit: Finished Goods – Fillet 40 kg
  ├─ Credit: WIP – Cleaning        50 kg
  └─ Debit: Manufacturing OH       10 kg (loss)

Inventory State:
  WIP – Squid Cleaning: 0 kg (50 - 50)
  Finished Goods – Fillet: 40 kg


┌──────────────────────────┐
│ STEP 6: SALES/SHIPMENT   │
└──────────────────────────┘

Sales Order:
  Product: SQD-FLT-A-20_30CM
  Quantity: 40 kg
  Customer: Fresh Market Distributor

→ blockUnsizedInSales() allows ✓ (PROCESSED product, not RAW)

→ Inventory Posting:
  ├─ Debit: Cost of Goods Sold    $3,200
  └─ Credit: Finished Goods        40 kg

Inventory State:
  Finished Goods – Fillet: 0 kg (40 - 40)
  ✓ Order Complete
```

---

## Validation Matrix

```
┌─────────────────────┬──────────┬──────────┬───────────┬──────────┐
│ Property            │ RAW      │ WIP      │ PROCESSED │ Location │
├─────────────────────┼──────────┼──────────┼───────────┼──────────┤
│ grade_master_id     │ ✗ NULL   │ ✗ NULL   │ ✓ required│ DB Check │
│ is_producible       │ ✗ FALSE  │ ✓ varies │ ✓ varies  │ DB Check │
│ size_master_id      │ ✓ req'd  │ ✓ req'd  │ ✓ req'd   │ DB Check │
│ derivative_id       │ ✗ NULL   │ ✓ varies │ ✓ req'd   │ Model    │
│ product_role        │ RAW_MAT  │ WIP      │ FIN_GOOD  │ Model    │
│ processing_state    │ RAW      │ RAW/PROC │ PROCESSED │ Model    │
│ is_raw              │ ✓ TRUE   │ ✗ FALSE  │ ✗ FALSE   │ Model    │
├─────────────────────┼──────────┼──────────┼───────────┼──────────┤
│ Can be produced     │ ✗ NO     │ ~ maybe  │ ✗ NO      │ Middleware│
│ Can be issued       │ ✓ if ~   │ ✓ yes    │ ✗ NO      │ Middleware│
│ Can be sold         │ ~ sized  │ ✗ NO     │ ✓ yes     │ Middleware│
│ Can be UNSIZED      │ ~ intake │ ✗ NO     │ ✗ NO      │ Middleware│
└─────────────────────┴──────────┴──────────┴───────────┴──────────┘

Legend:
  ✓ = Always required/allowed
  ✗ = Never allowed
  ~ = Conditional (UNSIZED allowed only at intake)
```

---

## SKU Generation Algorithm

```
INPUT: Species Code, Size Code
│
├─ SPECIES_CODE = {species.code}
│  Examples: SNP (Snapper), SQD (Squid), CRB (Crab), TUN (Tuna)
│
├─ CONSTANT = "WHL" (Whole)
│
├─ CONSTANT = "RAW"
│
├─ SIZE_CODE = {size.code}
│  Examples: 1_2KG, 10_20CM, UNSIZED
│
OUTPUT: {SPECIES_CODE}-{WHL}-{RAW}-{SIZE_CODE}

Examples:
  SNP-WHL-RAW-1_2KG
  SQD-WHL-RAW-10_20CM
  CRB-WHL-RAW-300_500G
  TUN-WHL-RAW-3KGUP
  SQD-WHL-RAW-UNSIZED
```

---

## HSN Auto-Assignment Logic

```
INPUT: Species Category, Is Frozen
│
├─ IF category = 'FISH'
│  ├─ IF isFrozen = true → HSN = 0303 (Frozen Fish)
│  └─ IF isFrozen = false → HSN = 0302 (Fresh Fish)
│
├─ IF category = 'CRUSTACEAN'
│  └─ HSN = 0306 (Crustaceans)
│
├─ IF category = 'MOLLUSC'
│  └─ HSN = 0307 (Molluscs)
│
└─ ELSE
   └─ Default: 0302 (Fallback)

OUTPUT: HSN Code (0302, 0303, 0306, 0307)

GST Mapping:
  HSN 0302, 0303, 0306, 0307 → 5% (Domestic) or 0% (Export)
```

---

## Error Response Codes

```
Validation Failure → HTTP 400 Bad Request

┌─────────────────────────────────────┬──────────────────────────┐
│ Error Code                          │ Cause & Resolution       │
├─────────────────────────────────────┼──────────────────────────┤
│ RAW_CANNOT_HAVE_GRADE               │ grade_id must be NULL    │
│ RAW_MUST_NOT_BE_PRODUCIBLE          │ is_producible=FALSE      │
│ RAW_MUST_HAVE_SIZE                  │ size_id required         │
│ PROCESSED_MUST_HAVE_DERIVATIVE      │ derivative_id required   │
│ UNSIZED_NOT_ALLOWED_PRODUCTION      │ Must sort first          │
│ UNSIZED_NOT_ALLOWED_SALES           │ Must sort first          │
│ SPECIES_NOT_FOUND                   │ Invalid speciesId        │
│ SIZE_NOT_FOUND                      │ Invalid sizeId           │
│ GRADE_NOT_FOUND                     │ Invalid gradeId          │
│ INVALID_SPLIT_TOTAL                 │ Splits + waste ≠ input   │
└─────────────────────────────────────┴──────────────────────────┘
```

---

## Performance Optimization

```
Index Strategy:

┌──────────────────────────┬────────────────────────┐
│ Index                    │ Query Pattern          │
├──────────────────────────┼────────────────────────┤
│ idx_product_processing   │ WHERE processing_state │
│ _state                   │       = 'RAW'          │
│                          │                        │
│ idx_product_role         │ WHERE product_role IN  │
│                          │ ('RAW_MATERIAL',...)   │
│                          │                        │
│ product_code (UNIQUE)    │ WHERE product_code =   │
│                          │ 'SQD-WHL-RAW-10_20CM'  │
│                          │                        │
│ species_master_id        │ WHERE species_id = X   │
│ (existing)               │                        │
│                          │                        │
│ size_master_id           │ WHERE size_id = Y      │
│ (existing)               │                        │
└──────────────────────────┴────────────────────────┘

Expected Performance:
  • List RAW products: ~10ms (with idx_processing_state)
  • Lookup by SKU: ~2ms (unique index)
  • Intake sorting: ~50ms (transactional)
  • Inventory queries: <100ms (indexed)
```

---

## Security & Compliance

```
┌──────────────────────────────────────┐
│ Data Protection                      │
├──────────────────────────────────────┤
│ • Processing state immutable post-   │
│   creation (prevents tampering)      │
│ • Grade NULL enforced at DB level    │
│   (not just application)             │
│ • SKU deterministic (auditable)      │
│ • All changes logged via auditable   │
│   created_by, modified_by            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Data Integrity                       │
├──────────────────────────────────────┤
│ • CHECK constraints prevent invalid  │
│   state combinations                 │
│ • Foreign keys to species, size      │
│ • Transaction integrity for splits   │
│ • Atomic inventory postings          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Accounting Compliance                │
├──────────────────────────────────────┤
│ • HSN auto-assigned (no manual error)│
│ • GST auto-assigned (no manual error)│
│ • Ledger postings atomic & complete  │
│ • Audit trail via created_by fields  │
└──────────────────────────────────────┘
```

---

**Diagram Version:** 1.0  
**Last Updated:** 2026-01-09  
**Format:** ASCII + Text (for version control)
