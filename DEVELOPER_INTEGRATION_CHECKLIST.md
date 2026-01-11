# BOM Frontend - Developer Integration Checklist

**Project:** BOM-Driven Production Management  
**Phase:** Frontend Integration (Backend Developer Track)  
**Time Estimate:** 2-3 hours  

---

## ✅ Pre-Integration Checklist

- [ ] Read `FRONTEND_QUICK_START.md` (5 min)
- [ ] Understand workflow: Create → BOM → Consume Raw → Record Output → Variance
- [ ] Review 10 API endpoints needed (listed below)
- [ ] Database migrations ready to run
- [ ] Existing project has Fastify routes structure
- [ ] Git workflow configured for commits

---

## 🗂️ Step 1: Database Setup

### 1.1 Run Migrations
```bash
npm run migrate
```

**Verify:** Check database for 6 new tables:
- [ ] `inventory_stock`
- [ ] `inventory_transaction`
- [ ] `inventory_lot`
- [ ] `inventory_cost_layer`
- [ ] `production_consumption`
- [ ] `production_variance`

**Verify:** Check indexes created:
```sql
SELECT * FROM pg_indexes WHERE tablename LIKE 'inventory_%' OR tablename LIKE 'production_%';
```

### 1.2 Verify Data Relationships
- [ ] Check products table has species_id entries (for species dropdown)
- [ ] Check BOM records exist (from previous phase)
- [ ] Check yield_rules populated (9,488+ rules)

---

## 🛣️ Step 2: Create API Endpoints (8 Production Routes)

### 2.1 Create `src/routes/production/index.js`

#### Endpoint 1: Create Production Order
```javascript
POST /api/production/orders
Purpose: Create new production order
Input: {
  order_number,     // "PO-20260111-001"
  plant_id,         // 1
  input_species_id, // "ASC001"
  planned_quantity_kg, // 1000
  initial_grade,    // "B"
  size_code,        // "MEDIUM"
  remarks           // optional
}
Output: {
  id,
  order_number,
  status: "PLANNED",
  bom_id,
  input_species_id,
  planned_quantity_kg,
  created_at
}
Handler: Create production_order record
GL Posting: None (planning stage)
```

- [ ] Endpoint created
- [ ] Input validation working
- [ ] Auto-detects BOM from species_id
- [ ] Returns order with PLANNED status
- [ ] Tested with curl/Postman

#### Endpoint 2: List Production Orders
```javascript
GET /api/production/orders?page=1&limit=20&status=PLANNED&species_id=ASC001
Purpose: List all production orders (paginated, filterable)
Output: {
  data: [
    {
      id, order_number, input_species_id, input_species_name,
      planned_quantity_kg, status, created_at
    }
  ],
  total: 42,
  page: 1,
  pages: 3
}
Filter Params: status, species_id, plant_id
```

- [ ] Endpoint created
- [ ] Pagination works (default: page 1, limit 20)
- [ ] Filters work (status, species_id, plant_id)
- [ ] Returns data array + metadata
- [ ] Tested with curl/Postman

#### Endpoint 3: Get Single Production Order
```javascript
GET /api/production/orders/:id
Purpose: Get single order with all details
Output: {
  id,
  order_number,
  input_species_id,
  input_species_name,
  planned_quantity_kg,
  initial_grade,
  size_code,
  status,
  bom_id,
  created_at,
  started_at,
  completed_at
}
```

- [ ] Endpoint created
- [ ] Returns complete order details
- [ ] Handles 404 for non-existent order
- [ ] Tested with curl/Postman

#### Endpoint 4: Start Production (BOM Explosion)
```javascript
POST /api/production/:id/start
Purpose: Start production, calculate BOM explosion
Input: {
  bom_id // optional, auto-detected if not provided
}
Action:
  1. Call bom_explosion(species_id, quantity)
  2. Create production_consumption records (planned)
  3. Update status → "RAW_ISSUED"
Output: {
  id,
  status: "RAW_ISSUED",
  bom_explosion: [
    {
      derivative_id,
      derivative_name,
      derivative_code,
      base_yield_percent,
      grade_multiplier,
      size_multiplier,
      effective_yield_percent,
      planned_quantity_kg
    }
  ],
  started_at: timestamp
}
GL Posting: None (this is planning)
```

- [ ] Endpoint created
- [ ] Calls bom_explosion handler
- [ ] Creates production_consumption records
- [ ] Updates status to RAW_ISSUED
- [ ] Returns BOM explosion details
- [ ] Tested with curl/Postman

#### Endpoint 5: Consume Raw Material (FIFO)
```javascript
POST /api/production/:id/consume
Purpose: Consume raw material using FIFO
Input: {
  lot_allocations: [
    { inventory_lot_id: 1, quantity_kg: 500, cost_per_unit: 5.50 },
    { inventory_lot_id: 2, quantity_kg: 500, cost_per_unit: 5.50 }
  ]
}
Action:
  1. Call raw_consumption handler
  2. FIFO pick from RAW_INVENTORY
  3. Create WIP_RAW_CONSUMPTION transaction
  4. Post GL: DR WIP_INVENTORY / CR RAW_INVENTORY
  5. Update status → "RAW_ISSUED"
Output: {
  id,
  status: "RAW_ISSUED",
  transaction_id: 123,
  gl_entries_created: 2,
  total_consumed_kg: 1000,
  total_cost: 5500.00
}
GL Posting: 
  - DR WIP_INVENTORY (asset): +5500.00
  - CR RAW_INVENTORY (asset): -5500.00
```

- [ ] Endpoint created
- [ ] Calls raw_consumption handler
- [ ] Validates lot allocation = required quantity
- [ ] Creates WIP transaction
- [ ] Posts GL entries
- [ ] Tested with curl/Postman

#### Endpoint 6: Record Production Output
```javascript
POST /api/production/:id/output
Purpose: Record actual output, allocate costs, post variance GL
Input: {
  actual_outputs: [
    {
      derivative_id: 1,
      actual_quantity_kg: 360,
      actual_grade: "B",
      size_code: "MEDIUM",
      variance_reason: "slight shrinkage"
    },
    { derivative_id: 2, actual_quantity_kg: 250, ... },
    ...
  ]
}
Action:
  1. Call production_output handler
  2. Create FG_INVENTORY items
  3. Allocate costs proportionally
  4. Calculate variance per derivative
  5. Post GL: DR FG_INVENTORY / CR WIP_INVENTORY
  6. Post GL for abnormal variances
  7. Update status → "COMPLETED"
Output: {
  id,
  status: "COMPLETED",
  fg_inventory_created: 4,
  fg_transaction_id: 124,
  variance_records: [
    {
      derivative_id,
      planned_quantity_kg,
      actual_quantity_kg,
      variance_quantity_kg,
      variance_percent,
      variance_type: "NORMAL" | "ABNORMAL",
      gl_posted: true
    }
  ],
  total_gl_entries_posted: 6,
  completed_at: timestamp
}
GL Posting:
  - DR FG_INVENTORY: +allocation
  - CR WIP_INVENTORY: -allocation
  - [If abnormal] DR VARIANCE_LOSS: +variance_amount
  - [If abnormal] CR COGS: -variance_amount
```

- [ ] Endpoint created
- [ ] Calls production_output handler
- [ ] Creates FG inventory items
- [ ] Allocates costs proportionally
- [ ] Calculates variance
- [ ] Posts GL entries (normal + abnormal)
- [ ] Tested with curl/Postman

#### Endpoint 7: Close Production Order
```javascript
POST /api/production/:id/close
Purpose: Close production order
Input: {
  remarks // optional
}
Action:
  1. Verify status = COMPLETED
  2. Update status → CLOSED
  3. Set closed_at timestamp
Output: {
  id,
  status: "CLOSED",
  closed_at: timestamp
}
GL Posting: None (all GL already posted)
```

- [ ] Endpoint created
- [ ] Validates status = COMPLETED
- [ ] Updates to CLOSED
- [ ] Tested with curl/Postman

#### Endpoint 8: Get Variance Report
```javascript
GET /api/production/:id/variance
Purpose: Get complete variance analysis with GL details
Output: {
  derivative_count: 4,
  normal_variance_count: 3,
  abnormal_variance_count: 1,
  gl_posted_count: 1,
  
  variances: [
    {
      id,
      derivative_id,
      derivative_name,
      derivative_code,
      planned_quantity_kg,
      actual_quantity_kg,
      variance_quantity_kg,
      variance_percent,
      variance_type: "NORMAL" | "ABNORMAL" | "GRADE_VARIANCE",
      variance_reason
    }
  ],
  
  gl_postings: [
    {
      id,
      variance_id,
      description,
      amount,
      account_code,
      posted_date,
      transaction_id
    }
  ],
  
  summary: {
    total_planned_kg: 1000,
    total_actual_kg: 960,
    total_variance_kg: -40,
    overall_variance_percent: -4,
    total_waste_kg: 40,
    waste_percent: 4,
    total_gl_amount: 220,
    gl_status: "complete"
  }
}
```

- [ ] Endpoint created
- [ ] Queries production_variance records
- [ ] Queries GL postings for abnormal
- [ ] Calculates summary metrics
- [ ] Tested with curl/Postman

---

## 🛣️ Step 3: Create Inventory Endpoint (1 Inventory Route)

### 3.1 Create/Update `src/routes/inventory/index.js`

#### Endpoint 9: Get Inventory Stock
```javascript
GET /api/inventory/stock?warehouse=RAW_INVENTORY&status=ON_HAND&product_id=ASC001&page=1&limit=50
Purpose: Get current inventory with filters
Query Params:
  warehouse: "RAW_INVENTORY" | "WIP_RAW_CONSUMPTION" | "FG_INVENTORY" (optional)
  status: "ON_HAND" | "RESERVED" | "DAMAGED" | "EXPIRED" (optional)
  product_id: product ID (optional)
  species_id: species ID (optional)
  page: page number (default 1)
  limit: items per page (default 50)

Output: {
  data: [
    {
      id,
      warehouse,
      product_id,
      product_name,
      product_code,
      lot_id,
      lot_number,
      on_hand_quantity,
      reserved_quantity,
      available_quantity,
      cost_per_unit,
      status,
      received_date,
      expiry_date,
      supplier_name
    }
  ],
  total: 150,
  page: 1,
  pages: 3
}
```

- [ ] Endpoint created
- [ ] Filters by warehouse
- [ ] Filters by status
- [ ] Filters by product_id
- [ ] Filters by species_id
- [ ] Pagination works
- [ ] Tested with curl/Postman

---

## 🛣️ Step 4: Product Endpoint (1 Product Route)

### 4.1 Verify/Update `src/routes/products/index.js`

#### Endpoint 10: Get Products
```javascript
GET /api/products?limit=500&offset=0&species_id=ASC001
Purpose: Get all products for species dropdown
Output: {
  data: [
    {
      id,
      name,
      code,
      species_id,
      species_name,
      description,
      unit_of_measure,
      is_active
    }
  ],
  total: 487
}
Note: Should return species-level products for dropdown
```

- [ ] Endpoint exists or create if missing
- [ ] Returns product list with species_id
- [ ] Tested with curl/Postman

---

## ✅ Step 5: Frontend Integration

### 5.1 Copy Frontend Files
```bash
# From this workspace to your project
cp public/js/services/productionService.js → <app>/public/js/services/
cp public/js/components/ProductionOrderForm.js → <app>/public/js/components/
cp public/js/components/BOMExplosionViewer.js → <app>/public/js/components/
cp public/js/components/RawMaterialConsumption.js → <app>/public/js/components/
cp public/js/components/ProductionOutputRecorder.js → <app>/public/js/components/
cp public/js/components/VarianceReport.js → <app>/public/js/components/
cp public/js/components/InventoryDashboard.js → <app>/public/js/components/
cp public/production-workflow.html → <app>/public/
```

- [ ] All 7 component files copied
- [ ] Service file copied
- [ ] Workflow HTML copied
- [ ] No file overwrites (only adds new files)

### 5.2 Add Route to Serve Workflow Page
In main server file (e.g., `src/server.js` or `src/app.js`):

```javascript
// Add this route to serve the production workflow page
app.get('/production-workflow', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/production-workflow.html'));
});

// Or use your existing pattern if you have one
```

- [ ] Route added to serve production-workflow.html
- [ ] Test: http://localhost:3000/production-workflow.html loads

---

## 🧪 Step 6: Testing

### 6.1 Test Each Endpoint

#### Test Endpoint 1: Create Order
```bash
curl -X POST http://localhost:3000/api/production/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "PO-TEST-001",
    "plant_id": 1,
    "input_species_id": "ASC001",
    "planned_quantity_kg": 1000,
    "initial_grade": "B",
    "size_code": "MEDIUM"
  }'
```

Expected Response:
```json
{
  "id": 1,
  "order_number": "PO-TEST-001",
  "status": "PLANNED",
  "planned_quantity_kg": 1000
}
```

- [ ] Returns 201 status
- [ ] Order created in database
- [ ] Status is PLANNED

#### Test Endpoint 2: List Orders
```bash
curl http://localhost:3000/api/production/orders
```

Expected: Returns list with pagination

- [ ] Returns array of orders
- [ ] Includes pagination metadata

#### Test Endpoint 3: Get Single Order
```bash
curl http://localhost:3000/api/production/orders/1
```

Expected: Returns order details

- [ ] Returns order object
- [ ] Includes all fields

#### Test Endpoint 4: Start Production
```bash
curl -X POST http://localhost:3000/api/production/1/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: Returns BOM explosion

- [ ] Status changes to RAW_ISSUED
- [ ] Returns bom_explosion array
- [ ] Shows derivatives with planned quantities
- [ ] production_consumption records created

#### Test Endpoint 5: Consume Raw Material
```bash
curl -X POST http://localhost:3000/api/production/1/consume \
  -H "Content-Type: application/json" \
  -d '{
    "lot_allocations": [
      {"inventory_lot_id": 1, "quantity_kg": 1000, "cost_per_unit": 5.50}
    ]
  }'
```

Expected: WIP transaction + GL posting

- [ ] Returns transaction_id
- [ ] GL entries created
- [ ] WIP inventory updated
- [ ] RAW inventory decreased

#### Test Endpoint 6: Record Output
```bash
curl -X POST http://localhost:3000/api/production/1/output \
  -H "Content-Type: application/json" \
  -d '{
    "actual_outputs": [
      {"derivative_id": 1, "actual_quantity_kg": 360, "actual_grade": "B", "size_code": "MEDIUM"},
      {"derivative_id": 2, "actual_quantity_kg": 250, "actual_grade": "B", "size_code": "MEDIUM"}
    ]
  }'
```

Expected: FG inventory + GL posting

- [ ] Status changes to COMPLETED
- [ ] FG inventory items created
- [ ] GL entries posted
- [ ] Variance calculated

#### Test Endpoint 7: Get Variance
```bash
curl http://localhost:3000/api/production/1/variance
```

Expected: Variance report with GL details

- [ ] Returns variance records
- [ ] Shows GL postings
- [ ] Calculates summary metrics

#### Test Endpoint 8: Get Inventory
```bash
curl "http://localhost:3000/api/inventory/stock?warehouse=RAW_INVENTORY"
```

Expected: Inventory stock list

- [ ] Returns array of stock items
- [ ] Filters by warehouse work

### 6.2 Test Frontend Page

- [ ] Open: http://localhost:3000/production-workflow.html
- [ ] Page loads without errors
- [ ] All components display
- [ ] Can create order (submit form)
- [ ] Can allocate raw material
- [ ] Can record output
- [ ] Can view variance
- [ ] Inventory dashboard works

### 6.3 End-to-End Workflow Test

Complete steps:
1. [ ] Create production order via form
2. [ ] View BOM explosion (shows derivatives)
3. [ ] Allocate raw material (FIFO lots)
4. [ ] Record production output (actual quantities)
5. [ ] Review variance report
6. [ ] Check inventory dashboard
7. [ ] Verify GL entries in GL module
8. [ ] Verify inventory balances

---

## 📋 Step 7: Database Verification

After full workflow, verify:

```sql
-- Check production_order created
SELECT * FROM production_orders WHERE order_number = 'PO-TEST-001';

-- Check inventory_transaction entries
SELECT * FROM inventory_transactions ORDER BY created_at DESC LIMIT 10;

-- Check production_consumption
SELECT * FROM production_consumptions ORDER BY created_at DESC;

-- Check production_variance
SELECT * FROM production_variances ORDER BY created_at DESC;

-- Check GL entries
SELECT * FROM gl_entries WHERE description LIKE '%production%' ORDER BY created_at DESC;

-- Verify inventory balances
SELECT warehouse, product_id, SUM(on_hand_quantity) as total
FROM inventory_stock
GROUP BY warehouse, product_id;
```

- [ ] All records created as expected
- [ ] Quantities balance
- [ ] GL entries posted correctly

---

## 📊 Step 8: Validation Checklist

### Functional Validation
- [ ] Can create production orders
- [ ] BOM explosion calculates correctly
- [ ] FIFO picking selects oldest lots first
- [ ] Cost allocation is proportional
- [ ] Variance % calculated correctly
- [ ] Abnormal variances flagged (>5%)
- [ ] GL entries posted for all movements
- [ ] Inventory balances maintained

### Data Validation
- [ ] No orphaned records
- [ ] Foreign keys valid
- [ ] Timestamps correct
- [ ] Quantities non-negative
- [ ] GL entries balanced (debits = credits)

### Performance Validation
- [ ] Page loads in <1 second
- [ ] API responses in <500ms
- [ ] Database queries use indexes
- [ ] No N+1 query problems

### UI Validation
- [ ] All components render
- [ ] Forms validate input
- [ ] Error messages display
- [ ] Filters work correctly
- [ ] Export/print functionality works

---

## 🚀 Step 9: Deployment Preparation

### Code Review
- [ ] Code follows project standards
- [ ] No console.log() left in code
- [ ] Error handling complete
- [ ] Input validation on all endpoints
- [ ] Security: SQL injection protection
- [ ] Security: XSS prevention

### Documentation
- [ ] Code comments added to complex logic
- [ ] API docs updated
- [ ] Team trained on endpoints
- [ ] Troubleshooting guide shared

### Monitoring
- [ ] Logging configured for API calls
- [ ] Error tracking configured
- [ ] Database performance monitored
- [ ] GL posting verified

---

## 📝 Step 10: Sign-Off

### Integration Complete When:
- [ ] All 10 API endpoints implemented
- [ ] All endpoints return correct responses
- [ ] Frontend loads without errors
- [ ] End-to-end workflow tested
- [ ] GL entries created correctly
- [ ] Inventory balances verified
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Code reviewed
- [ ] Team trained

### Deployment Checklist
- [ ] Migrations run in production
- [ ] Secrets/config updated
- [ ] Monitoring configured
- [ ] Backups confirmed
- [ ] Rollback plan documented
- [ ] Users notified
- [ ] Support team trained

---

## 📞 Support Resources

| Issue | Reference |
|-------|-----------|
| API specification | FRONTEND_INTEGRATION_GUIDE.md |
| Component details | FRONTEND_QUICK_REFERENCE.md |
| Quick setup | FRONTEND_QUICK_START.md |
| Architecture | FRONTEND_DELIVERY_COMPLETE.md |
| Error handling | FRONTEND_INTEGRATION_GUIDE.md → Troubleshooting |

---

## ✅ Final Checklist

- [ ] Database migrations complete (6 tables)
- [ ] 10 API endpoints implemented
- [ ] 7 frontend components deployed
- [ ] Frontend page serves correctly
- [ ] End-to-end workflow tested
- [ ] GL entries verified
- [ ] Inventory balances verified
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Team trained
- [ ] Ready for production deployment

---

**Status: Ready for Backend Development** ✅

Estimated time: 2-3 hours for backend developer to complete all endpoints and testing.
