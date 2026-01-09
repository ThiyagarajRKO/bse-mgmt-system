# RAW PRODUCT IMPLEMENTATION CHECKLIST

## Phase 1: Database Migration ⚡ [READY]

- [ ] **Execute Migration**

  ```bash
  npx sequelize-cli db:migrate --name 20260109-add-raw-product-support
  ```

  - Adds `processing_state` ENUM column
  - Adds `product_role` ENUM column
  - Adds `is_raw` BOOLEAN column
  - Creates performance indexes
  - Applies CHECK constraints
  - ✅ Migration file: `migrations/20260109-add-raw-product-support.js`

- [ ] **Verify Schema Changes**

  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'product_master'
  AND column_name IN ('processing_state', 'product_role', 'is_raw');
  ```

  - Expected: 3 new columns in product_master
  - processing_state: ENUM ('RAW', 'PROCESSED')
  - product_role: ENUM ('RAW_MATERIAL', 'WIP', 'FINISHED_GOOD')
  - is_raw: BOOLEAN DEFAULT false

- [ ] **Verify Indexes Created**

  ```sql
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'product_master'
  AND indexname LIKE 'idx_product_%';
  ```

  - Expected: 2 indexes
  - idx_product_processing_state
  - idx_product_role

- [ ] **Verify CHECK Constraints**
  ```sql
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'product_master'
  AND constraint_type = 'CHECK';
  ```
  - chk_raw_no_grade
  - chk_raw_not_producible
  - chk_raw_size_required

---

## Phase 2: Model Enhancement 🔧 [READY]

- [ ] **Replace product_master.js Model**

  - Current: `models/product_master.js`
  - New: `models/product_master_raw.js`
  - Action: Copy hooks and validation logic
    ```bash
    cp models/product_master_raw.js models/product_master.js
    ```

- [ ] **Verify Model Associations**

  - [ ] SpeciesMaster association
  - [ ] DerivativeMaster association
  - [ ] GradeMaster association
  - [ ] SizeMaster association
  - [ ] GstMaster association
  - [ ] UserProfile (createdBy, modifiedBy)

- [ ] **Verify Before-Create Hook**

  - [ ] Checks RAW has no grade
  - [ ] Checks RAW is not producible
  - [ ] Checks RAW has size
  - [ ] Sets is_raw flag automatically

- [ ] **Verify Before-Update Hook**

  - [ ] Prevents changing grade for RAW products
  - [ ] Allows size changes (for reclassification)
  - [ ] Allows status/sellable updates

- [ ] **Verify Helper Methods**
  - [ ] `getFormattedName()` returns "{Species} – {Derivative} – {Size}" or "{Species} – Whole – Raw – {Size}"
  - [ ] `isUnsized()` checks if size is UNSIZED

---

## Phase 3: Seed RAW Sizes 🌱 [READY]

- [ ] **Execute Seeder**

  ```bash
  npx sequelize-cli db:seed --seed 20260109-seed-raw-product-sizes
  ```

- [ ] **Verify Sizes Created in size_master**

  ```sql
  SELECT code, display_name, unit_of_measure
  FROM size_master
  WHERE code LIKE '%200_300G%' OR code LIKE '%UNSIZED%' OR code LIKE '%10_20CM%'
  ORDER BY code;
  ```

- [ ] **Verify 13 Size Entries**

  **Gram-based (Fish/Crustaceans):**

  - [ ] 200_300G
  - [ ] 300_500G
  - [ ] 500G_1KG
  - [ ] 1_2KG
  - [ ] 2_3KG
  - [ ] 3KGUP

  **CM-based (Squid/Octopus):**

  - [ ] 10_20CM
  - [ ] 20_30CM
  - [ ] 30CMUP

  **Count-based (Shrimp/Scallops):**

  - [ ] 16_20_COUNT
  - [ ] 21_25_COUNT
  - [ ] 26_30_COUNT

  **Intake Bucket:**

  - [ ] UNSIZED

---

## Phase 4: Integrate RAW Services ⚙️ [READY]

- [ ] **Copy Service Files to services/**

  - [ ] `services/raw_product_service.js` (core logic)
  - [ ] `services/intake_sizing_workflow.js` (workflow)

- [ ] **Verify Service Functions Exported**

  **raw_product_service.js:**

  ```javascript
  -generateRawSku(payload) -
    generateRawProductName(payload) -
    resolveRawHsn(category, isFrozen) -
    resolveRawGst(isExport) -
    createRawProduct(sequelize, payload) -
    splitUnsizedRaw(sequelize, payload) -
    validateRawForProduction(product) -
    validateRawForSales(product);
  ```

  **intake_sizing_workflow.js:**

  ```javascript
  -autoSizeSplitting(sequelize, payload) -
    postSplitToInventory(sequelize, splitPlan) -
    rejectUnsizedInProduction(payload) -
    rejectUnsizedInSales(payload);
  ```

- [ ] **Test Services Standalone**

  ```javascript
  const RawService = require("./services/raw_product_service");

  // Test 1: SKU Generation
  const sku = RawService.generateRawSku({
    speciesCode: "SQD",
    sizeCode: "10_20CM",
  });
  console.assert(sku === "SQD-WHL-RAW-10_20CM");

  // Test 2: Name Generation
  const name = RawService.generateRawProductName({
    speciesName: "Indian Squid",
    sizeDisplay: "10–20cm",
  });
  console.assert(name === "Indian Squid – Whole – Raw – 10–20cm");

  // Test 3: HSN Resolution
  const hsn = RawService.resolveRawHsn("MOLLUSC", true);
  console.assert(hsn === "0307");
  ```

---

## Phase 5: Integrate API Middleware ✅ [READY]

- [ ] **Copy Middleware File**

  - [ ] `middleware/raw_product_validation.js`

- [ ] **Integrate validateRawProduct in Product Routes**

  ```javascript
  const {
    validateRawProduct,
  } = require("../middleware/raw_product_validation");

  router.post("/api/product", validateRawProduct, createProductHandler);
  router.put("/api/product/:id", validateRawProduct, updateProductHandler);
  ```

- [ ] **Integrate blockUnsizedInProduction in Production Routes**

  ```javascript
  const {
    blockUnsizedInProduction,
  } = require("../middleware/raw_product_validation");

  router.post("/api/production/issue", blockUnsizedInProduction, issueHandler);
  router.post("/api/production/order", blockUnsizedInProduction, orderHandler);
  ```

- [ ] **Integrate blockUnsizedInSales in Sales Routes**

  ```javascript
  const {
    blockUnsizedInSales,
  } = require("../middleware/raw_product_validation");

  router.post("/api/sales/order-line", blockUnsizedInSales, lineItemHandler);
  router.post("/api/sales/quotation", blockUnsizedInSales, quoteHandler);
  ```

- [ ] **Test Middleware Rejection**
  - [ ] POST invalid RAW (with grade) → 400
  - [ ] POST UNSIZED → issue → 400
  - [ ] POST UNSIZED → sales → 400

---

## Phase 6: API Integration 🔌 [IN PROGRESS]

### Create RAW Product Endpoint

- [ ] **Implement POST /api/product/raw**

  ```javascript
  router.post("/api/product/raw", async (req, res) => {
    const { speciesId, sizeId, isFrozen, isExport, isActive, isVerified } =
      req.body;

    const rawProduct = await RawProductService.createRawProduct(sequelize, {
      species: { id: speciesId },
      size: { id: sizeId },
      isFrozen,
      isExport,
      isActive,
      isVerified,
      createdById: req.user.id,
    });

    return res.json({
      status: "success",
      data: rawProduct,
    });
  });
  ```

- [ ] **Test Endpoint**
  ```bash
  curl -X POST http://localhost:3000/api/product/raw \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "speciesId": "squid-uuid",
      "sizeId": "10_20cm-uuid",
      "isFrozen": true,
      "isExport": false
    }'
  ```
  - Expected: 200 with RAW product details
  - Response includes: product_code, product_name, processing_state=RAW, hsn_code, gst_id

### Intake → Sizing Endpoint

- [ ] **Implement POST /api/intake/sort**

  ```javascript
  router.post("/api/intake/sort", async (req, res) => {
    const { rawProductId, splits, wasteWeight, notes } = req.body;

    const splitPlan = await IntakeWorkflow.autoSizeSplitting(sequelize, {
      rawProductId,
      splits,
      wasteWeight,
      notes,
    });

    await IntakeWorkflow.postSplitToInventory(sequelize, splitPlan);

    return res.json({
      status: "success",
      adjustments: splitPlan.adjustments,
    });
  });
  ```

- [ ] **Test Endpoint**
  ```bash
  curl -X POST http://localhost:3000/api/intake/sort \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "rawProductId": "unsized-squid-uuid",
      "splits": [
        { "sizeId": "10_20cm-uuid", "weight": 180 },
        { "sizeId": "20_30cm-uuid", "weight": 250 }
      ],
      "wasteWeight": 70,
      "notes": "Hand-sorted by visual inspection"
    }'
  ```
  - Expected: 200 with adjustments list

---

## Phase 7: Testing 🧪 [PENDING]

### Unit Tests

- [ ] **Test RAW SKU Generation**

  - Input: { speciesCode: 'SNP', sizeCode: '1_2KG' }
  - Expected: 'SNP-WHL-RAW-1_2KG'

- [ ] **Test RAW Name Generation**

  - Input: { speciesName: 'Snapper', sizeDisplay: '1–2kg' }
  - Expected: 'Snapper – Whole – Raw – 1–2kg'

- [ ] **Test HSN Resolution**

  - Mollusc + Frozen → 0307
  - Fish + Fresh → 0302
  - Fish + Frozen → 0303
  - Crustacean → 0306

- [ ] **Test GST Resolution**
  - Domestic → 5%
  - Export → 0%

### Integration Tests

- [ ] **Create SIZED RAW Product**

  - Input: species=Squid, size=10_20CM, isFrozen=true
  - Verify: product_code='SQD-WHL-RAW-10_20CM'
  - Verify: processing_state='RAW'
  - Verify: grade_master_id=NULL
  - Verify: is_producible=FALSE
  - Verify: hsn_code='0307'
  - Verify: gst_rate=5

- [ ] **Create UNSIZED RAW Product**

  - Input: species=Squid, size=UNSIZED, isFrozen=true
  - Verify: product_code='SQD-WHL-RAW-UNSIZED'
  - Verify: processing_state='RAW'
  - Verify: is_raw=TRUE

- [ ] **Reject RAW with Grade**

  - Input: processing_state='RAW', grade_master_id='{some_grade}'
  - Expected: 400 "RAW products cannot have grade"

- [ ] **Reject UNSIZED in Production**

  - Create GRN: SQD-WHL-RAW-UNSIZED, qty=500kg
  - Attempt Issue: SQD-WHL-RAW-UNSIZED → Production
  - Expected: 400 "UNSIZED cannot be issued to production"

- [ ] **Reject UNSIZED in Sales**

  - Create Sales Order: SQD-WHL-RAW-UNSIZED, qty=100kg
  - Expected: 400 "UNSIZED cannot be sold"

- [ ] **Intake → Sizing Workflow**
  - GRN: SQD-WHL-RAW-UNSIZED, qty=500kg
  - Intake Sort: Split into [180kg 10_20CM, 250kg 20_30CM, 70kg waste]
  - Verify: Ledger postings correct
    - ➖ SQD-WHL-RAW-UNSIZED: -500kg
    - ➕ SQD-WHL-RAW-10_20CM: +180kg
    - ➕ SQD-WHL-RAW-20_30CM: +250kg
    - ♻️ Scrap: +70kg
  - Verify: Can now issue SQD-WHL-RAW-20_30CM to production

### API Tests (Postman/curl)

- [ ] **POST /api/product/raw** ✅

  - [ ] Success case: SIZED RAW product
  - [ ] Success case: UNSIZED RAW product
  - [ ] Error case: Missing species
  - [ ] Error case: Missing size

- [ ] **POST /api/intake/sort** ✅

  - [ ] Success case: Split UNSIZED into sized buckets
  - [ ] Success case: With waste tracking
  - [ ] Error case: UNSIZED product not found
  - [ ] Error case: Invalid size splits

- [ ] **POST /api/production/issue** ✅

  - [ ] Success case: Issue SIZED RAW to production
  - [ ] Error case: Attempt to issue UNSIZED RAW

- [ ] **POST /api/sales/order-line** ✅
  - [ ] Success case: Add SIZED RAW to sales order
  - [ ] Error case: Attempt to add UNSIZED RAW

---

## Phase 8: Documentation 📚 [COMPLETED]

- [x] **Create RAW_PRODUCT_GUIDE.md**

  - [x] Architecture overview
  - [x] SKU/naming conventions
  - [x] HSN/GST mapping
  - [x] Intake→sizing workflow
  - [x] API validation
  - [x] Accounting impact
  - [x] Testing checklist
  - [x] FAQs

- [x] **Create RAW_PRODUCT_IMPLEMENTATION_CHECKLIST.md** (This file)

- [ ] **Update API_ENDPOINT_REFERENCE.md**

  - [ ] Add `/api/product/raw` POST endpoint
  - [ ] Add `/api/intake/sort` POST endpoint
  - [ ] Document request/response schemas

- [ ] **Update SYSTEM_READY_CHECKLIST.md**
  - [ ] Add RAW product support
  - [ ] Mark as READY when all tests pass

---

## Phase 9: Production Deployment 🚀 [PENDING]

- [ ] **Pre-Deployment Checklist**

  - [ ] All unit tests passing
  - [ ] All integration tests passing
  - [ ] Load testing (1000 RAW products created)
  - [ ] Performance indexes verified
  - [ ] Backup taken
  - [ ] Rollback plan documented

- [ ] **Deployment Steps**

  1. Stop all services
  2. Run migration: `npx sequelize-cli db:migrate`
  3. Run seeder: `npx sequelize-cli db:seed --seed 20260109-seed-raw-product-sizes`
  4. Update models: Replace product_master.js
  5. Copy services: raw_product_service.js, intake_sizing_workflow.js
  6. Copy middleware: raw_product_validation.js
  7. Update routes with middleware integration
  8. Restart services
  9. Run smoke tests

- [ ] **Post-Deployment Verification**
  - [ ] Can create RAW products
  - [ ] Can execute intake→sizing workflow
  - [ ] API validation blocks UNSIZED in production
  - [ ] API validation blocks UNSIZED in sales
  - [ ] Ledger postings are correct
  - [ ] Reports show RAW materials in inventory

---

## Phase 10: Knowledge Transfer 🎓 [PENDING]

- [ ] **Team Training**

  - [ ] Document RAW product business logic
  - [ ] Train on SKU naming conventions
  - [ ] Train on intake→sizing workflow
  - [ ] Train on API usage

- [ ] **Documentation for QA**

  - [ ] Test plan for RAW products
  - [ ] Test scenarios for intake workflow
  - [ ] Performance test plan

- [ ] **Documentation for Warehouse**
  - [ ] How to receive UNSIZED RAW materials
  - [ ] How to sort into sized buckets
  - [ ] How to verify inventory records

---

## Sign-Off

| Role             | Name | Date | Signature |
| ---------------- | ---- | ---- | --------- |
| Developer        |      |      |           |
| QA Lead          |      |      |           |
| Business Analyst |      |      |           |
| Project Manager  |      |      |           |

---

## Success Criteria

✅ **Migration executed successfully**
✅ **13 RAW sizes seeded**
✅ **Model updated with validation hooks**
✅ **API endpoints created and tested**
✅ **Intake→sizing workflow operational**
✅ **UNSIZED blocking in effect**
✅ **All tests passing**
✅ **Documentation complete**
✅ **Production ready**

---

**Last Updated:** 2026-01-09  
**Status:** Ready for Execution
