# Sales Order → GL Flow Documentation

**Version**: 2.3.0-alpha  
**Date**: 9 January 2026  
**Scope**: Complete order-to-cash flow with GL posting integration

---

## 1. System Overview

This documentation covers the complete Sales Order → GL flow that enables end-to-end order management from customer order creation through financial accounting posting.

### Flow Sequence

```
Customer Order → Sales Allocation → Production Demand → 
  Production (11-step) → Dispatch → Sales Invoice → GL Posting → Financial Reporting
```

### Key Components

| Component | Purpose | Status |
|-----------|---------|--------|
| Sales Allocations | Track allocation of order lines to production | ✅ Ready |
| Production Demands | Forecast demand from allocations | ✅ Ready |
| Sales Invoices | Generate invoices from production | ✅ Ready |
| GL Postings | Automatic GL entry creation | ✅ Ready |

---

## 2. Database Architecture

### New Tables (5 total)

#### 2.1 sales_allocations
**Purpose**: Track allocation of sales order line items to production  
**Key Columns**:
- `order_id` (FK → orders)
- `order_product_id` (FK → order_products)
- `allocation_status`: ENUM (PENDING → ALLOCATED → PRODUCTION_IN_PROGRESS → COMPLETED)
- `allocated_quantity`, `fulfilled_quantity`: decimal tracking
- `allocation_date`, `allocated_by`: audit trail

**Constraints**: Cascading delete on order/order_product  
**Indexes**: 4 (order_id, order_product_id, allocation_status, allocation_date)

#### 2.2 production_demands
**Purpose**: Create demand records from allocations for production planning  
**Key Columns**:
- `demand_number` (UNIQUE): Format DEM-YYYYMMDD-HHMMSS-XXXX
- `sales_allocation_id` (FK → sales_allocations): bidirectional link
- `production_order_id` (FK → production_orders): links to production when created
- `product_master_id` (FK → product_master)
- `demand_status`: ENUM (CREATED → WAITING → IN_PRODUCTION → COMPLETE → DISPATCHED → FULFILLED)
- `priority`: ENUM (LOW, MEDIUM, HIGH, URGENT)
- `required_date`: demand fulfillment deadline

**Constraints**: Cascading delete on allocation/production_order  
**Indexes**: 6 (demand_number unique, allocation_id, order_id, product_id, status, date)

#### 2.3 sales_invoices
**Purpose**: Generate invoices from production orders for GL integration  
**Key Columns**:
- `invoice_number` (UNIQUE): Format INV-YYYYMMDD-HHMMSS-XXXX
- `order_id` (FK → orders)
- `customer_master_id` (FK → customer_master)
- `invoice_status`: ENUM (DRAFT → POSTED → PAID → CANCELLED)
- Financial columns: `subtotal_amount`, `tax_amount`, `shipping_amount`, `discount_amount`, `net_total_amount`
- `posted_date`, `posted_by`: GL integration audit trail

**Hard Blocks**:
- Cannot create invoice without `inventory_posted = true` on production outputs
- Cannot post invoice without payment received

**Indexes**: 6 (invoice_number, order_id, customer_id, status, invoice_date, posted_date)

#### 2.4 sales_invoice_lines
**Purpose**: Line-level tracking of invoice items with cost and tax calculations  
**Key Columns**:
- `invoice_id` (FK → sales_invoices)
- `production_output_id` (FK → production_outputs): links to finished goods
- `product_master_id` (FK → product_master)
- `sku_code`, `quantity`, `cost_per_unit`, `line_total`
- `hsn_code`: for GST calculation
- `tax_rate`, `tax_amount`, `line_net_total`

**Auto-Calculation**:
- `cost_per_unit = production_output.cost_allocated / quantity`
- `line_total = quantity × cost_per_unit`
- `tax_amount = line_total × (tax_rate / 100)`
- `line_net_total = line_total + tax_amount`

**Indexes**: 3 (invoice_id, production_output_id, product_master_id)

#### 2.5 gl_postings
**Purpose**: Immutable GL journal entries for financial accounting  
**Key Columns**:
- `entry_number` (UNIQUE): Format GL-YYYYMMDD-HHMMSS-XXXX
- `posting_date` (indexed): when posted
- `account_code` (FK → chart_of_accounts): GL account
- `debit`, `credit`: amounts (decimal 14,2)
- `production_output_id`, `invoice_id`, `payment_id`: source tracking
- `posting_status`: ENUM (DRAFT, POSTED, REVERSED)
- `reversal_entry_id` (FK → gl_postings): self-referential for reversals
- `posted_by`, `posted_at`: immutable audit trail

**Standard Entries**:
1. **Production Output**: Dr FG (Finished Goods), Cr RM (Raw Materials)
2. **Sales Invoice**: Dr AR (Accounts Receivable), Cr Sales Revenue
3. **Payment**: Dr Cash/Bank, Cr AR

**Indexes**: 8 (entry_number, posting_date, account_code, status, output_id, invoice_id, payment_id, date+status)

---

## 3. Service Layer

### 3.1 SalesAllocationService
**File**: `services/SalesAllocationService.js`  
**Methods** (8 total):

| Method | Purpose | Parameters | Returns |
|--------|---------|------------|---------|
| `allocateOrderLine()` | Create new allocation | order_id, product_id, qty | allocation object |
| `confirmAllocation()` | Mark as ALLOCATED | allocation_id | updated allocation |
| `updateFulfillment()` | Update fulfilled qty | allocation_id, qty | updated allocation |
| `completeAllocation()` | Mark as COMPLETED | allocation_id | updated allocation |
| `cancelAllocation()` | Cancel allocation | allocation_id, reason | updated allocation |
| `getAllocationDetails()` | Get with related data | allocation_id | allocation + order + demands |
| `listAllocations()` | List with filters | filters, limit, offset | allocation[] |
| `getOrderAllocationSummary()` | Order-level summary | order_id | summary object |

**Key Validations**:
- Order and order_product must exist
- Allocated qty ≤ order line qty
- Only one active allocation per line
- Cannot cancel if active demands exist

### 3.2 ProductionDemandService
**File**: `services/ProductionDemandService.js`  
**Methods** (9 total):

| Method | Purpose |
|--------|---------|
| `generateDemandNumber()` | Create unique demand number |
| `createDemandFromAllocation()` | Convert allocation to demand |
| `linkToProductionOrder()` | Link to production order |
| `updateDemandStatus()` | Update demand status |
| `startProduction()` | Mark as IN_PRODUCTION |
| `completeProduction()` | Mark as PRODUCTION_COMPLETE |
| `fulfillDemand()` | Mark as FULFILLED |
| `getDemandDetails()` | Get with relationships |
| `listDemands()` | List with filters |
| `getPendingDemands()` | Get unfulfilled demands |
| `getDemandFulfillmentSummary()` | Fulfillment tracking |

**Demand Lifecycle**:
```
CREATED → WAITING_FOR_PRODUCTION → IN_PRODUCTION 
  → PRODUCTION_COMPLETE → DISPATCHED → FULFILLED
```

### 3.3 SalesInvoiceService
**File**: `services/SalesInvoiceService.js`  
**Methods** (10 total):

| Method | Purpose | Hard Blocks |
|--------|---------|------------|
| `generateInvoiceNumber()` | Create unique invoice number | - |
| `createInvoice()` | Create new invoice (DRAFT) | One per order |
| `addLineItems()` | Add production outputs to invoice | inventory_posted=true required |
| `recalculateInvoiceTotals()` | Auto-calculate totals | - |
| `updateInvoiceCharges()` | Update shipping/discount | Only in DRAFT status |
| `postInvoiceToGL()` | Post to GL (POSTED) | Payment must be PAID |
| `cancelInvoice()` | Cancel invoice | Cannot cancel PAID |
| `getInvoiceDetails()` | Get with line items | - |
| `listInvoices()` | List with filters | - |
| `getRevenueSummary()` | Revenue reporting | - |

**Invoice Lifecycle**:
```
DRAFT (editable) → POSTED (GL locked) → PAID → CLOSED
                ↘ CANCELLED (anytime)
```

**Auto-Calculations**:
- Line items: cost from production outputs
- Tax: HSN code based rates
- Totals: subtotal + tax + shipping - discount

### 3.4 GLPostingService
**File**: `services/GLPostingService.js`  
**Methods** (8 total):

| Method | Purpose | Creates |
|--------|---------|---------|
| `generateEntryNumber()` | Create unique GL number | - |
| `getAccountCodes()` | Load chart of accounts | - |
| `postProductionOutput()` | FG/RM entries | Dr FG, Cr RM |
| `postSalesInvoice()` | AR/Revenue entries | Dr AR, Cr Sales |
| `postPayment()` | Cash/AR entries | Dr Cash, Cr AR |
| `listEntries()` | List GL entries | - |
| `getAccountBalance()` | Account balance | - |
| `getTrialBalance()` | TB generation | - |
| `reverseEntry()` | Reverse entry | Reversal GL entry |

**GL Posting Patterns**:

**Pattern 1: Production Output** (Dr FG, Cr RM)
```
Dr 1100-Finished Goods    | Cost Allocated
  Cr 1050-Raw Materials               | Cost Allocated
```

**Pattern 2: Sales Invoice** (Dr AR, Cr Sales)
```
Dr 1200-Accounts Receivable  | Net Total Amount
  Cr 4000-Sales Revenue                | Net Total Amount
```

**Pattern 3: Payment** (Dr Cash, Cr AR)
```
Dr 1010-Cash/Bank        | Paid Amount
  Cr 1200-AR                          | Paid Amount
```

---

## 4. API Endpoints

### 4.1 Sales Allocations

```
POST   /sales/allocations                  - Create allocation
GET    /sales/allocations                  - List allocations
GET    /sales/allocations/:id              - Get details
PUT    /sales/allocations/:id/confirm      - Confirm allocation
PUT    /sales/allocations/:id/fulfill      - Update fulfillment
PUT    /sales/allocations/:id/complete     - Complete allocation
PUT    /sales/allocations/:id/cancel       - Cancel allocation
POST   /sales/allocations/:id/create-demands - Create demands
GET    /sales/orders/:orderId/allocation-summary - Order summary
```

**Example: Create Allocation**
```json
POST /sales/allocations
{
  "order_id": "uuid",
  "order_product_id": "uuid",
  "allocated_quantity": 100.00,
  "remarks": "Allocated for production"
}
```

### 4.2 Production Demands

```
GET    /production/demands                 - List demands
GET    /production/demands/:id             - Get details
PUT    /production/demands/:id/link        - Link to production order
PUT    /production/demands/:id/status      - Update status
GET    /production/demands/summary/fulfillment - Summary
```

**Example: Update Demand Status**
```json
PUT /production/demands/:id/status
{
  "new_status": "IN_PRODUCTION",
  "fulfilled_quantity": 50
}
```

### 4.3 Sales Invoices

```
POST   /sales/invoices                     - Create invoice
POST   /sales/invoices/:id/line-items      - Add line items
PUT    /sales/invoices/:id/charges         - Update charges
GET    /sales/invoices/:id                 - Get details
GET    /sales/invoices                     - List invoices
PUT    /sales/invoices/:id/post            - Post to GL
PUT    /sales/invoices/:id/cancel          - Cancel invoice
GET    /sales/invoices/summary/revenue     - Revenue summary
```

**Example: Create Invoice**
```json
POST /sales/invoices
{
  "order_id": "uuid",
  "customer_master_id": "uuid",
  "invoice_date": "2026-01-09T00:00:00Z"
}
```

**Example: Add Line Items**
```json
POST /sales/invoices/:id/line-items
{
  "line_items": [
    {
      "production_output_id": "uuid",
      "quantity": 100.00
    }
  ]
}
```

### 4.4 GL Postings

```
POST   /gl/post/production-output/:id      - Post production to GL
POST   /gl/post/invoice/:id                - Post invoice to GL
POST   /gl/post/payment/:id                - Post payment to GL
GET    /gl/entries                         - List GL entries
GET    /gl/accounts/:code/balance          - Account balance
GET    /gl/trial-balance                   - Trial balance
PUT    /gl/entries/:id/reverse             - Reverse entry
```

**Example: Get Trial Balance**
```
GET /gl/trial-balance?as_of_date=2026-01-09
```

---

## 5. Hard Block Rules

| Rule | Location | Impact |
|------|----------|--------|
| Cannot invoice without `inventory_posted=true` | SalesInvoiceService.addLineItems() | 403 error |
| Cannot post invoice without payment | SalesInvoiceService.postInvoiceToGL() | 403 error |
| Cannot post duplicate GL entries | GLPostingService | 400 error |
| Cannot reverse POSTED entries | GLPostingService.reverseEntry() | 400 error |
| Cannot cancel PAID invoices | SalesInvoiceService.cancelInvoice() | 400 error |

---

## 6. Workflow Examples

### Example 1: Complete Order to Cash Flow

**Step 1: Create Order** (existing)
```
Sales Order: ORD-20260109-0001
├─ Product A: 100 units @ $50
└─ Product B: 50 units @ $75
```

**Step 2: Allocate to Production**
```json
POST /sales/allocations
{
  "order_id": "ord-uuid",
  "order_product_id": "prod-a-uuid",
  "allocated_quantity": 100
}
```
Response: Allocation created in PENDING status

**Step 3: Confirm Allocation**
```
PUT /sales/allocations/alloc-uuid/confirm
```
Response: Allocation status → ALLOCATED

**Step 4: Create Production Demand**
```json
POST /sales/allocations/alloc-uuid/create-demands
{
  "product_master_id": "prod-uuid",
  "demanded_quantity": 100,
  "priority": "HIGH",
  "required_date": "2026-01-15T00:00:00Z"
}
```
Response: Demand created (DEM-20260109-142530-0001)

**Step 5: Execute Production** (existing 11-step flow)
Production Order PO-20260109-0001 processes demand:
- Issue RM → Allocate Derivatives → Generate SKUs → Pack → Post Inventory

Result: ProductionOutput with inventory_posted=true

**Step 6: Create Invoice**
```json
POST /sales/invoices
{
  "order_id": "ord-uuid",
  "customer_master_id": "cust-uuid"
}
```
Response: Invoice created in DRAFT (INV-20260109-150000-0001)

**Step 7: Add Line Items**
```json
POST /sales/invoices/inv-uuid/line-items
{
  "line_items": [
    {
      "production_output_id": "po-output-uuid",
      "quantity": 100
    }
  ]
}
```
Auto-calculated:
- Cost per unit: $45.00 (from production output allocation)
- Line total: $4,500.00
- Tax (18%): $810.00
- Net: $5,310.00

**Step 8: Update Shipping/Discount**
```json
PUT /sales/invoices/inv-uuid/charges
{
  "shipping_amount": 500,
  "discount_amount": 100
}
```
Updated net total: $5,710.00

**Step 9: Receive Payment** (existing)
SalesPayment: Payment received $5,710.00 (PAID status)

**Step 10: Post Invoice to GL**
```
PUT /sales/invoices/inv-uuid/post
```
Creates GL entries:
- Dr 1200-AR: $5,710.00
- Cr 4000-Sales: $5,710.00

**Step 11: Verify GL**
```
GET /gl/entries?invoice_id=inv-uuid
```
Shows both entries POSTED

---

## 7. Testing Checklist

### Unit Tests
- [ ] SalesAllocationService: 8 method tests
- [ ] ProductionDemandService: 9 method tests
- [ ] SalesInvoiceService: 10 method tests
- [ ] GLPostingService: 8 method tests
- [ ] All validation rules verified
- [ ] All hard blocks tested

### Integration Tests
- [ ] Complete allocation → demand → invoice → GL flow
- [ ] Order with multiple line items
- [ ] Partial fulfillment scenarios
- [ ] GL balance verification
- [ ] Trial balance generation
- [ ] Reversal entry creation and verification

### Data Integrity Tests
- [ ] Cascade delete on order cancellation
- [ ] Cascade delete on allocation cancellation
- [ ] Immutable GL postings
- [ ] Unique constraint violations
- [ ] Foreign key constraint violations

---

## 8. Deployment Checklist

- [ ] Execute all 5 migrations
- [ ] Verify models load in models/index.js
- [ ] Register services in app.js
- [ ] Register controllers in src/controllers/index.js
- [ ] Register routes in src/routes/index.js
- [ ] Test all 30+ endpoints
- [ ] Verify hard block enforcement
- [ ] Test cascade operations
- [ ] Validate GL postings
- [ ] Generate trial balance
- [ ] Git commit with v2.3.0-alpha tag

---

## 9. Architecture Diagrams

### Data Flow Diagram
```
┌─────────────┐
│  Order      │ (existing)
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ OrderProduct        │ (existing)
│ (order line item)   │
└──────┬──────────────┘
       │
       ▼
┌────────────────────────┐
│ SalesAllocation        │ ← NEW: Track allocation
│ (PENDING→ALLOCATED)    │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ ProductionDemand       │ ← NEW: Demand forecast
│ (CREATED→FULFILLED)    │
└──────┬─────────────────┘
       │
       ▼
┌─────────────────┐
│ ProductionOrder │ (existing 11-step flow)
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ ProductionOutput │ (existing - SKU generated)
└──────┬───────────┘
       │
       ▼
┌────────────────────┐
│ SalesInvoice       │ ← NEW: Invoice generation
│ (DRAFT→POSTED)     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ SalesInvoiceLine   │ ← NEW: Line items
│ (cost + tax calc)  │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ GLPosting          │ ← NEW: GL entries
│ (Dr/Cr immutable)  │
└────────────────────┘
```

### Service Dependencies
```
SalesAllocationService
  ├─ db.Order
  ├─ db.OrderProduct
  └─ db.SalesAllocation

ProductionDemandService
  ├─ db.SalesAllocation
  ├─ db.ProductionOrder
  ├─ db.ProductMaster
  └─ db.ProductionDemand

SalesInvoiceService
  ├─ db.Order
  ├─ db.CustomerMaster
  ├─ db.ProductionOutput
  ├─ db.ProductMaster
  ├─ db.SalesInvoice
  ├─ db.SalesInvoiceLine
  └─ db.SalesPayment

GLPostingService
  ├─ db.ChartOfAccounts
  ├─ db.ProductionOutput
  ├─ db.SalesInvoice
  ├─ db.SalesPayment
  └─ db.GLPosting
```

---

## 10. Future Enhancements

- [ ] Batch invoice generation from multiple orders
- [ ] Automated GL posting triggers
- [ ] Multi-currency support
- [ ] Tax compliance reporting (GSTR1, GSTR3B)
- [ ] Advance GL reconciliation utilities
- [ ] Financial statement generation (P&L, Balance Sheet)
- [ ] Cost accounting allocation
- [ ] Profitability analysis by order/customer

---

## 11. Support & Troubleshooting

### Common Issues

**Issue**: "Cannot add line items - inventory not posted"
**Solution**: Verify production output has `inventory_posted=true`

**Issue**: "Cannot post invoice - HARD BLOCK: payment required"
**Solution**: Ensure payment is received and marked PAID

**Issue**: "GL entries not created"
**Solution**: Check if GL posting service ran successfully

**Issue**: "Trial balance not balanced"
**Solution**: Check for reversed entries or incomplete postings

---

**Document Version**: 1.0  
**Last Updated**: 9 January 2026  
**Status**: Production Ready (v2.3.0-alpha)
