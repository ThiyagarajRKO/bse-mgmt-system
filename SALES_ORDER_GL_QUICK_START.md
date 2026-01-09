# Sales Order → GL Flow: Quick Start Guide

**Version**: 2.3.0-alpha  
**Last Updated**: 9 January 2026

---

## Prerequisites

- Node.js v22.3.0+
- PostgreSQL running
- Sequelize CLI installed
- Postman or similar API client

---

## Getting Started

### Step 1: Execute Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# You should see:
# Sequelized < Executing migration 20260116-create-sales-allocations.js
# Sequelized < Executing migration 20260116-create-production-demands.js
# Sequelized < Executing migration 20260116-create-sales-invoices.js
# Sequelized < Executing migration 20260116-create-sales-invoice-lines.js
# Sequelized < Executing migration 20260116-create-gl-postings.js
# Sequelized > Executed successfully
```

### Step 2: Start the Server

```bash
npm start

# Server starts on http://localhost:3000
# All routes registered and ready
```

### Step 3: Verify Routes

Test a simple endpoint:

```bash
curl -X GET http://localhost:3000/sales/invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Complete Order-to-Cash Workflow Example

### 1. Create an Order (Existing System)

```bash
POST http://localhost:3000/order
{
  "customer_id": "cust-uuid",
  "order_date": "2026-01-09",
  "delivery_date": "2026-01-15",
  "items": [
    {
      "product_id": "prod-uuid",
      "quantity": 100,
      "unit_price": 50
    }
  ]
}
```

**Response**: `order_id = ord-uuid`

### 2. Allocate Order Line to Production

```bash
POST http://localhost:3000/sales/allocations
{
  "order_id": "ord-uuid",
  "order_product_id": "prod-uuid",
  "allocated_quantity": 100,
  "remarks": "Allocated for production"
}
```

**Response**: `allocation_id = alloc-uuid`, status = PENDING

### 3. Confirm Allocation

```bash
PUT http://localhost:3000/sales/allocations/alloc-uuid/confirm
```

**Response**: status = ALLOCATED

### 4. Create Production Demand

```bash
POST http://localhost:3000/sales/allocations/alloc-uuid/create-demands
{
  "product_master_id": "prod-uuid",
  "demanded_quantity": 100,
  "priority": "HIGH",
  "required_date": "2026-01-15"
}
```

**Response**: `demand_id = dem-uuid`, demand_number = DEM-20260109-HHMMSS-XXXX

### 5. Execute Production (Existing System)

Create and execute production order:

```bash
POST http://localhost:3000/production/orders
{
  "production_order_number": "PO-20260109-001",
  "product_master_id": "prod-uuid",
  "quantity_to_produce": 100,
  "raw_material_issue": [...],
  "derivatives": [...],
  # ... 11-step production flow
}
```

**Result**: ProductionOutput created with `inventory_posted=true` and `sku_code`

### 6. Create Invoice

```bash
POST http://localhost:3000/sales/invoices
{
  "order_id": "ord-uuid",
  "customer_master_id": "cust-uuid",
  "invoice_date": "2026-01-09"
}
```

**Response**: `invoice_id = inv-uuid`, invoice_number = INV-20260109-HHMMSS-XXXX, status = DRAFT

### 7. Add Line Items

```bash
POST http://localhost:3000/sales/invoices/inv-uuid/line-items
{
  "line_items": [
    {
      "production_output_id": "po-output-uuid",
      "quantity": 100
    }
  ]
}
```

**Response**: Line items added, totals auto-calculated

- Cost per unit: $45.00
- Line total: $4,500.00
- Tax (18%): $810.00
- Invoice net: $5,310.00

### 8. Update Shipping & Discount (Optional)

```bash
PUT http://localhost:3000/sales/invoices/inv-uuid/charges
{
  "shipping_amount": 500,
  "discount_amount": 100
}
```

**Response**: Updated net total = $5,710.00

### 9. Receive Payment (Existing System)

```bash
POST http://localhost:3000/sales/payments
{
  "order_id": "ord-uuid",
  "paid_amount": 5710,
  "payment_method": "bank_transfer"
}
```

**Result**: Payment status = PAID

### 10. Post Invoice to GL

```bash
PUT http://localhost:3000/sales/invoices/inv-uuid/post
```

**Response**:

- Invoice status = POSTED
- GL entries created:
  - Dr 1200-Accounts Receivable: $5,710
  - Cr 4000-Sales Revenue: $5,710

### 11. Verify GL & Generate Reports

```bash
# View GL entries for invoice
GET http://localhost:3000/gl/entries?invoice_id=inv-uuid

# Get account balance
GET http://localhost:3000/gl/accounts/1200/balance

# Get trial balance
GET http://localhost:3000/gl/trial-balance
```

---

## Common API Calls

### List All Allocations

```bash
GET http://localhost:3000/sales/allocations?limit=20&offset=0
```

### Get Allocation Details

```bash
GET http://localhost:3000/sales/allocations/alloc-uuid
```

### Get Order Allocation Summary

```bash
GET http://localhost:3000/sales/orders/ord-uuid/allocation-summary
```

### List All Invoices

```bash
GET http://localhost:3000/sales/invoices?invoice_status=DRAFT&limit=20
```

### Get Revenue Summary

```bash
GET http://localhost:3000/sales/invoices/summary/revenue?from_date=2026-01-01&to_date=2026-01-31
```

### List GL Entries

```bash
GET http://localhost:3000/gl/entries?account_code=1200&posting_status=POSTED
```

---

## Error Scenarios & Solutions

### ❌ Error: "HARD BLOCK: Cannot add line items - inventory not posted"

**Cause**: Production output not yet posted to inventory

**Solution**: Ensure production flow is complete and `inventory_posted=true`

```bash
# Check production output status
GET http://localhost:3000/production/outputs/po-output-uuid
```

### ❌ Error: "HARD BLOCK: Cannot post invoice without payment received"

**Cause**: No payment received for invoice

**Solution**: Receive payment first

```bash
POST http://localhost:3000/sales/payments
{
  "order_id": "ord-uuid",
  "paid_amount": 5710
}
```

### ❌ Error: "Cannot add line items - only in DRAFT status"

**Cause**: Trying to edit a POSTED invoice

**Solution**: Line items can only be added to DRAFT invoices

### ❌ Error: "Cannot cancel allocation with active production demands"

**Cause**: Production demand still active

**Solution**: Either complete the production or cancel the demand first

---

## Testing Checklist

- [ ] Create order with 2 line items
- [ ] Allocate both lines
- [ ] Create demands
- [ ] Execute production (both items)
- [ ] Create invoice
- [ ] Add both line items
- [ ] Update shipping/discount
- [ ] Receive payment
- [ ] Post invoice to GL
- [ ] Verify GL entries (4 total)
- [ ] Check trial balance
- [ ] Verify account balances

---

## Performance Tips

1. **Batch invoice creation**: Create multiple invoices, then add line items in bulk
2. **Use pagination**: Always use `limit` and `offset` for list operations
3. **Filter early**: Use `allocation_status` and `invoice_status` filters
4. **Index on posting_date**: GL queries are optimized for date ranges

---

## Troubleshooting

### Migrations Not Executing

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# If stuck, try rolling back one
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

### Routes Not Loading

```bash
# Check if models are loaded
node -e "const m = require('./models'); console.log(Object.keys(m))"

# Restart server
npm stop
npm start
```

### GL Entries Not Created

Check:

1. Invoice status is POSTED
2. Payment status is PAID
3. No duplicate entries exist

```bash
# Query existing GL entries
GET http://localhost:3000/gl/entries?invoice_id=inv-uuid
```

### Trial Balance Not Balanced

```bash
GET http://localhost:3000/gl/trial-balance

# Response should have: is_balanced = true
```

If not balanced, check for reversed entries or incomplete postings.

---

## API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {
    /* object or array */
  },
  "pagination": { "limit": 20, "offset": 0 }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description"
}
```

### Hard Block Error (403)

```json
{
  "success": false,
  "message": "HARD BLOCK: Detailed reason why operation is blocked"
}
```

---

## Important Notes

1. **Unique Invoice Numbers**: System generates INV-YYYYMMDD-HHMMSS-XXXX automatically
2. **Auto-Calculation**: Tax rates come from HSN code in product_master
3. **GL Immutability**: Posted GL entries cannot be modified, only reversed
4. **Cascading Deletes**: Deleting an order cascades to allocations and demands
5. **Hard Blocks**: 6 rules prevent invalid states (see documentation)

---

## Support

For detailed information, see:

- **System Documentation**: `SALES_ORDER_GL_FLOW_DOCUMENTATION.md`
- **API Reference**: `SALES_ORDER_GL_API_REFERENCE.md`
- **Implementation Guide**: `SALES_ORDER_GL_IMPLEMENTATION_CHECKLIST.md`

---

**Quick Start Version**: 1.0  
**Status**: Ready for Testing  
**Support**: See main documentation files
