# Production Order Management System - Complete Implementation

## Overview

The Production Order Management System implements a comprehensive 11-step production workflow that ensures:

- **Deterministic SKU generation** (species-derivative-grade-size-pack)
- **Immutable grade/size tracking** (locked at raw issue)
- **System-driven yield calculations** (from YieldMaster, not user-editable)
- **Hard block enforcement** (grade upgrade, yield override, direct posting prevention)
- **Complete cost allocation** (raw + processing + packaging)
- **Audit trail** (immutable validation logs)

## Architecture

```
Production Order Flow (11 Steps):

┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Create Production Order                                      │
│ POST /production/orders                                              │
│ Input: species_id, order_type, quantity, start_date, plant_id        │
│ Output: Production Order (PLANNED status)                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 2: Issue Raw Material                                           │
│ POST /production/orders/{id}/issue-raw                               │
│ Input: lot_id, quantity, measured_size, size_code, grade             │
│ Output: production_raw_issues (IMMUTABLE: size_locked, grade_locked) │
│ HARD BLOCK: Cannot issue expired or QC-failed lots                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 3: Validate Grade-Size (Automatic)                              │
│ Server-side rule engine runs                                         │
│ Output: grade_size_validation_logs (immutable snapshot)              │
│ HARD BLOCK: Invalid combinations blocked                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 4: Allocate Derivatives                                         │
│ POST /production/orders/{id}/derive                                  │
│ Input: [{ derivative_id, planned_percentage }, ...]                  │
│ Validation: Percentages sum to 100%                                  │
│ Output: production_derivatives with theoretical_yield_percent        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 5: Calculate Expected Yield (System-Driven)                    │
│ GET /production/orders/{id}/expected-yield                           │
│ Lookup: YieldMaster[species][derivative][grade]                     │
│ Calculation: expected_qty = issued_qty × yield% (READ-ONLY)         │
│ HARD BLOCK: User cannot override yield percentage                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 6: Record Production                                            │
│ POST /production/orders/{id}/produce                                  │
│ Input: derivative_id, actual_qty, actual_grade, size_code            │
│ Validation: actual_grade can only DOWNGRADE                          │
│ Output: production_outputs with SKU_code                             │
│ HARD BLOCK: Grade upgrade forbidden                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 7: Auto-Generate SKU (Deterministic)                            │
│ SKU Format: SPECIES-DERIVATIVE-GRADE-SIZE-PACK                      │
│ Example: POM-FIL-B-800GM-1KG                                        │
│ Output: product_master record created if needed                      │
│ HARD BLOCK: No manual SKU creation allowed                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 8: Allocate Costs                                               │
│ POST /production/orders/{id}/allocate-cost                           │
│ Input: raw_cost + processing_cost + packaging_cost                   │
│ Calculation: Distribution by yield share                             │
│ Output: cost_allocated stored in production_outputs                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 9: Post Inventory                                               │
│ POST /production/orders/{id}/post-inventory                          │
│ Operations:                                                          │
│ - Create FG (Finished Goods) inventory                               │
│ - Consume RM (Raw Material) inventory                                │
│ - Clear WIP (Work In Progress)                                       │
│ - Post GL entries (Dr FG, Cr RM)                                     │
│ Output: inventory_posted = true, gl_posted = true                    │
│ HARD BLOCK: Must complete before invoice generation                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 10: Tag GST (Auto)                                              │
│ Auto-assign HSN from derivative_master                               │
│ Auto-assign GST rate from tax_code_master                            │
│ No manual tax logic inside production                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│ Step 11: Close Order                                                 │
│ POST /production/orders/{id}/close                                   │
│ Validations:                                                         │
│ - All raw issued = consumed                                          │
│ - All outputs posted (inventory_posted = true)                       │
│ - WIP = 0                                                            │
│ Output: status = CLOSED (IRREVERSIBLE)                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### production_orders

Central production order tracking

```sql
CREATE TABLE production_orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,      -- ORD-YYYYMMDD-HHMMSS-XXXX
  order_type ENUM('PRIMARY', 'SECONDARY', 'VALUE_ADDED', 'REWORK'),
  plant_id VARCHAR(20) NOT NULL,
  input_species_id UUID NOT NULL FK → species_master,
  planned_quantity_kg DECIMAL(10,2) NOT NULL,
  planned_start_date DATE NOT NULL,
  status ENUM('PLANNED', 'RAW_ISSUED', 'IN_PRODUCTION', 'COMPLETED', 'CLOSED', 'CANCELLED'),
  issued_quantity_kg DECIMAL(10,2),
  produced_quantity_kg DECIMAL(10,2),
  wastage_quantity_kg DECIMAL(10,2),
  yield_variance_percent DECIMAL(5,2),
  created_by UUID,
  approved_by UUID,
  closed_by UUID,
  closed_at DATE,
  remarks TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

INDEX: order_number (UNIQUE)
INDEX: (input_species_id)
INDEX: (status, created_at)
INDEX: (plant_id)
```

### production_raw_issues

Raw material issuance with immutable size/grade snapshot

```sql
CREATE TABLE production_raw_issues (
  id UUID PRIMARY KEY,
  production_order_id UUID UNIQUE NOT NULL FK → production_orders CASCADE,
  inventory_lot_id UUID NOT NULL FK → inventory_master,
  issued_quantity_kg DECIMAL(10,2) NOT NULL,
  measured_avg_size_kg DECIMAL(8,3) NOT NULL,    -- Immutable: captured at issuance
  size_code VARCHAR(20) NOT NULL FK → size_master,
  initial_grade ENUM('A', 'B', 'C', 'D') NOT NULL,
  grade_locked BOOLEAN DEFAULT TRUE,              -- Immutable flag
  size_locked BOOLEAN DEFAULT TRUE,               -- Immutable flag
  is_expired BOOLEAN DEFAULT FALSE,
  is_qc_failed BOOLEAN DEFAULT FALSE,
  issued_by UUID,
  issued_at TIMESTAMP DEFAULT NOW(),
  remarks TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CONSTRAINT: UNIQUE(production_order_id)  -- One issue per order
INDEX: (production_order_id)
INDEX: (inventory_lot_id)
```

### production_derivatives

Derivative split planning per order

```sql
CREATE TABLE production_derivatives (
  id UUID PRIMARY KEY,
  production_order_id UUID NOT NULL FK → production_orders CASCADE,
  derivative_id UUID NOT NULL FK → derivative_master,
  planned_percentage DECIMAL(5,2) NOT NULL,      -- Must sum to 100%
  theoretical_yield_percent DECIMAL(5,2) NOT NULL, -- From YieldMaster (read-only)
  expected_quantity_kg DECIMAL(10,2),             -- issued_qty × planned_% × (yield% / 100)
  is_auto_enabled BOOLEAN DEFAULT FALSE,          -- True for MINCE on high trim loss
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CONSTRAINT: UNIQUE(production_order_id, derivative_id)
INDEX: (production_order_id)
INDEX: (derivative_id)
```

### production_outputs

Final outputs with auto-generated SKUs

```sql
CREATE TABLE production_outputs (
  id UUID PRIMARY KEY,
  production_order_id UUID NOT NULL FK → production_orders CASCADE,
  production_derivative_id UUID NOT NULL FK → production_derivatives CASCADE,
  derivative_id UUID NOT NULL FK → derivative_master,
  product_id UUID FK → product_master,            -- Auto-generated SKU
  actual_quantity_kg DECIMAL(10,2) NOT NULL,
  actual_grade ENUM('A', 'B', 'C', 'D') NOT NULL, -- DOWNGRADE ONLY (hard block upgrade)
  size_code VARCHAR(20) NOT NULL FK → size_master, -- Immutable from raw issue
  expected_quantity_kg DECIMAL(10,2),
  actual_yield_percent DECIMAL(5,2),              -- actual / expected * 100
  cost_allocated DECIMAL(12,2),                   -- Raw + processing + packaging
  sku_code VARCHAR(100),                          -- Deterministic: SPECIES-DERIV-GRADE-SIZE-PACK
  inventory_posted BOOLEAN DEFAULT FALSE,         -- Must be TRUE before invoice
  gl_posted BOOLEAN DEFAULT FALSE,                -- 2-phase posting with inventory_posted
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

INDEX: (production_order_id)
INDEX: (product_id)
INDEX: (sku_code)
```

### grade_size_validation_logs

Immutable audit trail of validation decisions

```sql
CREATE TABLE grade_size_validation_logs (
  id UUID PRIMARY KEY,
  production_order_id UUID NOT NULL FK → production_orders CASCADE,
  species_id UUID NOT NULL FK → species_master,
  derivative_id UUID NOT NULL FK → derivative_master,
  measured_size_kg DECIMAL(8,3) NOT NULL,
  mapped_size_code VARCHAR(20) NOT NULL,
  declared_grade ENUM('A', 'B', 'C', 'D') NOT NULL,
  validation_status ENUM('VALID', 'INVALID', 'BLOCKED'),
  validation_reason TEXT,
  size_locked_at TIMESTAMP,
  grade_locked_at TIMESTAMP,
  validated_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

INDEX: (production_order_id)
INDEX: (species_id, derivative_id)
INDEX: (validation_status)
```

## Service Layer

### ProductionOrderService

Manages order lifecycle

```javascript
// Methods:
- createOrder(data) → Creates order with species/calendar validation
- getOrderById(orderId) → Retrieves order with all relationships
- getOrders(filter) → Lists orders with filtering
- updateOrderStatus(orderId, newStatus, userId) → Transitions status
- _validateProductionCalendar() → Checks plant availability
- _generateOrderNumber() → Creates unique order number
- _validateStatusTransition() → Enforces state machine
```

### RawMaterialIssueService

Issues raw material with immutability

```javascript
// Methods:
- issueRawMaterial(data) → Issues raw, locks grade/size
- getRawIssueById(issueId) → Retrieves issue
- getByProductionOrderId(orderId) → Gets issue for order
- _validateProductionOrder() → Checks order state
- _validateInventoryLot() → Checks lot availability
- _validateSizeMapping() → Validates size_code
- _createValidationLog() → Creates immutable log entry
```

### DerivativeAllocationService

Allocates derivatives and calculates yield

```javascript
// Methods:
- allocateDerivatives(data) → Allocates derivatives, validates %, looks up yield
- getDerivativesByOrderId(orderId) → Lists derivatives
- _validateOrder() → Checks order state
- _validateDerivativeAllowed() → Business rule check
- _getTheoreticalYield() → Looks up YieldMaster
- _validatePercentageSum() → Ensures sum = 100%
- _getOrCreateMince() → Auto-enables MINCE on high loss
```

### SKUGenerationService

Generates deterministic SKUs

```javascript
// Methods:
- generateSKU(data) → Generates SKU, creates product_master
- generateAndLinkSKUForOutput(data) → Updates output with SKU
- getOrCreateSKU(spec) → Gets existing or creates new
- getOrderSKUs(orderId) → Lists all SKUs for order
- _generateSKUCode() → Deterministic format: SPECIES-DERIV-GRADE-SIZE-PACK
- _validateSpecies() / _validateDerivative() / _validateSize()
```

### ProductionExecutionService

Records production and allocates costs

```javascript
// Methods:
- recordProduction(data) → Records output, validates grade downgrade, generates SKU
- getOutputById(outputId) → Retrieves output
- getOutputsByOrderId(orderId) → Lists outputs
- allocateCosts(data) → Allocates costs to output
- postInventory(data) → Posts FG/RM inventory and GL
- getOrderProductionSummary(orderId) → Summary metrics
- _validateGradeDowngrade() → Hard block on upgrade
```

## API Endpoints

### Create Production Order

```
POST /production/orders
Content-Type: application/json

{
  "input_species_id": "uuid",
  "order_type": "PRIMARY",
  "planned_quantity_kg": 100.50,
  "planned_start_date": "2025-02-15T09:00:00Z",
  "plant_id": "PLANT-001",
  "remarks": "Optional notes"
}

Response 201:
{
  "success": true,
  "message": "Production order created",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-20250215-093045-1234",
    "status": "PLANNED",
    "species": { "id": "uuid", "species_name": "Pomfret" }
  }
}
```

### Issue Raw Material

```
POST /production/orders/{id}/issue-raw

{
  "inventory_lot_id": "uuid",
  "issued_quantity_kg": 95.25,
  "measured_avg_size_kg": 0.800,
  "size_code": "800GM",
  "initial_grade": "A",
  "remarks": "Optional"
}

Response 200:
{
  "success": true,
  "message": "Raw material issued and locked",
  "data": {
    "issue_id": "uuid",
    "issued_quantity_kg": 95.25,
    "grade": "A",
    "size_locked": true,
    "grade_locked": true
  }
}
```

### Allocate Derivatives

```
POST /production/orders/{id}/derive

{
  "derivatives": [
    {
      "derivative_id": "uuid",
      "planned_percentage": 75.5
    },
    {
      "derivative_id": "uuid",
      "planned_percentage": 24.5
    }
  ]
}

Response 200:
{
  "success": true,
  "message": "Derivatives allocated. Yield calculated from YieldMaster.",
  "data": {
    "order_id": "uuid",
    "derivatives": [
      {
        "derivative_id": "uuid",
        "derivative_name": "FILLET",
        "planned_percentage": 75.5,
        "theoretical_yield_percent": 94.2,
        "expected_quantity_kg": 71.45
      }
    ]
  }
}
```

### Record Production

```
POST /production/orders/{id}/produce

{
  "production_derivative_id": "uuid",
  "actual_quantity_kg": 71.50,
  "actual_grade": "B",
  "size_code": "800GM",
  "remarks": "Slight downgrade due to scale wear"
}

Response 201:
{
  "success": true,
  "message": "Production recorded. SKU auto-generated.",
  "data": {
    "output_id": "uuid",
    "sku_code": "POM-FIL-B-800GM-1KG",
    "actual_quantity_kg": 71.50,
    "actual_grade": "B",
    "actual_yield_percent": "99.93%"
  }
}
```

### Allocate Costs

```
POST /production/orders/{id}/allocate-cost

{
  "production_output_id": "uuid",
  "raw_cost_share": 1000.00,
  "processing_cost_share": 250.00,
  "packaging_cost_share": 50.00
}

Response 200:
{
  "success": true,
  "message": "Costs allocated. Ready for inventory posting.",
  "data": {
    "output_id": "uuid",
    "total_cost_allocated": 1300.00,
    "sku_code": "POM-FIL-B-800GM-1KG"
  }
}
```

### Post Inventory

```
POST /production/orders/{id}/post-inventory

{
  "production_output_id": "uuid",
  "location_code": "FG-COLD-001"
}

Response 200:
{
  "success": true,
  "message": "Inventory posted. FG created, RM consumed, GL posted.",
  "data": {
    "output_id": "uuid",
    "inventory_posted": true,
    "gl_posted": true
  }
}
```

### Close Order

```
POST /production/orders/{id}/close

{
  "remarks": "Order completed successfully"
}

Response 200:
{
  "success": true,
  "message": "Production order closed. No further changes allowed.",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD-20250215-093045-1234",
    "status": "CLOSED",
    "total_produced_kg": 214.50,
    "yield_variance_percent": "-1.23%"
  }
}
```

## Hard Blocks Enforcement

### 1. Grade Upgrade Prevention

```javascript
// HARD BLOCK: Cannot upgrade grade
// A → B ✓ (downgrade allowed)
// B → A ✗ (BLOCKED)
// Enforced in: ProductionExecutionService._validateGradeDowngrade()
// HTTP 403: HARD_BLOCK_VIOLATION
```

### 2. Yield Override Prevention

```javascript
// HARD BLOCK: Yield % from YieldMaster cannot be overridden
// User can only specify quantity (which determines yield %)
// Expected yield locked at allocation time
// Enforced in: DerivativeAllocationService._validatePercentageSum()
// HTTP 403: HARD_BLOCK_VIOLATION
```

### 3. Direct Posting Prevention

```javascript
// HARD BLOCK: Cannot post inventory without:
// - Cost allocation (cost_allocated > 0)
// - Completing all production steps
// Enforced in: ProductionExecutionService.postInventory()
// HTTP 409: INVALID_STATE
```

### 4. Size Immutability

```javascript
// HARD BLOCK: Size locked at raw issue time
// size_locked = true (immutable)
// Cannot change size_code in production
// Enforced in: production_raw_issues.size_locked = true
```

### 5. SKU Creation Bypass Prevention

```javascript
// HARD BLOCK: No manual SKU creation allowed
// All SKUs auto-generated deterministically
// product_id must reference auto-generated SKU
// Enforced in: SKUGenerationService (sole creator)
```

## Error Handling

### Hard Block Violations (HTTP 403)

```json
{
  "success": false,
  "error": "HARD_BLOCK_VIOLATION",
  "message": "HARD BLOCK: Cannot upgrade grade from A to B. Only downgrade allowed.",
  "code": "HARD_BLOCK_003"
}
```

### Validation Errors (HTTP 400)

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Derivative percentages must sum to 100%. Current sum: 99.50%"
}
```

### State Errors (HTTP 409)

```json
{
  "success": false,
  "error": "INVALID_STATE",
  "message": "Order must be in RAW_ISSUED status. Current status: PLANNED"
}
```

## Example Workflows

### Workflow 1: Standard Primary Processing

```
1. Create order: Pomfret, 100kg, PLANT-001
   → Order created (PLANNED)

2. Issue raw: Lot #LOT-001, 95kg @ 800g, Grade A
   → Raw issued, size & grade LOCKED

3. Allocate derivatives: FILLET 75%, TRIM 25%
   → Yield from YieldMaster: FILLET 94.2%, TRIM 78.5%
   → Expected: FILLET 71.45kg, TRIM 18.62kg

4. Record production: FILLET 71.50kg @ Grade B
   → Grade downgrade (A→B) allowed ✓
   → SKU auto-generated: POM-FIL-B-800GM-1KG

5. Record production: TRIM 18.60kg @ Grade C
   → SKU auto-generated: POM-TRM-C-800GM-1KG

6. Allocate costs: Raw 1000 + Processing 250 + Packaging 50
   → Total 1300 split between outputs

7. Post inventory: FG created in COLD-001
   → inventory_posted = true, gl_posted = true

8. Close order: All raw consumed, all outputs posted
   → Order CLOSED (irreversible)
```

### Workflow 2: Grade Downgrade with Exception Handling

```
1. Create order: Tuna, 50kg
2. Issue raw: Grade A, 50kg
3. Allocate derivatives: SAKU 80%, TRIM 20%
4. Record production: SAKU 39.8kg @ Grade C
   → Downgrade: A→C (allowed) ✓
   → Exception logged in GradeDowngradeExceptionLog
   → Reason: "Temperature variance during freezing"
5. Record production: TRIM 9.95kg @ Grade D
   → Downgrade: A→D (allowed) ✓
6. Complete production & inventory posting
```

### Workflow 3: Hard Block - Grade Upgrade Attempt

```
1. Create order, issue raw (Grade B)
2. Allocate derivatives, record production attempt:
   → actual_grade = "A" (upgrade from B)
   → HTTP 403: HARD_BLOCK_VIOLATION
   → Message: "Cannot upgrade grade from B to A. Only downgrade allowed."
   → Request REJECTED, no output created
```

## Testing Strategy

### Unit Tests

- ProductionOrderService.createOrder() - species validation, order creation
- RawMaterialIssueService.issueRawMaterial() - lot validation, immutability
- DerivativeAllocationService.allocateDerivatives() - percentage validation, yield lookup
- SKUGenerationService.generateSKU() - deterministic generation, uniqueness
- ProductionExecutionService.recordProduction() - grade downgrade, yield validation

### Integration Tests

- Full workflow: order → issue → derive → produce → cost → post → close
- Grade downgrade with exception logging
- Hard block enforcement on all endpoints
- Cascade delete on order deletion

### Edge Cases

- Expired/QC-failed lot issuance (hard block)
- Grade upgrade attempt (hard block)
- Yield over tolerance (hard block)
- Percentage sum ≠ 100% (hard block)
- Multiple outputs per derivative
- High trim loss auto-enabling MINCE

## Implementation Checklist

- [x] 5 Database migrations created
- [x] 5 Sequelize models with associations
- [x] 4 Production services (ProductionOrderService, RawMaterialIssueService, DerivativeAllocationService, SKUGenerationService)
- [x] 1 Extended service (ProductionExecutionService with cost & inventory)
- [x] 1 API controller with 11 endpoints
- [ ] Middleware for hard block enforcement
- [ ] Unit & integration tests (56+ cases)
- [ ] Service registration in app.js
- [ ] Route registration in Fastify
- [ ] Documentation (this file)
- [ ] Deployment & git tag v2.2.0

## References

- **Business Rules**: See `DerivativeGradeBusinessRules.js`
- **Yield Master**: See migrations `20240328150007` (derivative_yield_master)
- **Grade Downgrade**: See `GradeDowngradeExceptionService.js`
- **Hard Blocks**: See `HardBlockEnforcementMiddleware.js`

---

**Last Updated**: 2025-01-16
**Version**: 2.2.0 (Production Order Management)
