# Automated Purchase Approval → Allocation Flow

This directory contains scripts to automate the complete purchase approval and allocation workflow.

## Overview

The automation executes these steps in sequence:

1. **Create ProcurementProduct** - Creates a purchase request for an order
2. **Approve Purchase** - Sets status to "Approved" and updates supplier details
3. **Create PurchaseInventory** - Records available stock from approved purchase
4. **Auto-Create SalesAllocations** - Automatically creates allocations with "ALLOCATED" status

## Available Scripts

### Option 1: Bash Script (execute-purchase-allocation-flow.sh)

**Prerequisites:**
- `bash` shell
- `psql` (PostgreSQL client)
- Database credentials in environment variables

**Usage:**
```bash
./execute-purchase-allocation-flow.sh <order_id> <product_id> <quantity> [price] [supplier_id]
```

**Example:**
```bash
./execute-purchase-allocation-flow.sh \
  a3dffcd4-2b05-4e26-b20a-94b6a4880584 \
  c7310936-bac3-4e73-b234-e3471b004499 \
  1000 \
  50.00
```

**Environment Variables:**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=automatly
export DB_SECRET=kZ5Z5RAYFMjK5778p88F
export DB_NAME=seafood-erp
export SYSTEM_USER_ID=87ffbaff-b7e9-4198-90d2-0fa12d85ef82
```

### Option 2: Node.js Script (execute-purchase-allocation-flow.js)

**Prerequisites:**
- `node` v14+
- `sequelize` package
- Database credentials in environment variables or `.env`

**Usage:**
```bash
node execute-purchase-allocation-flow.js <order_id> <product_id> <quantity> [price] [supplier_id]
```

**Example:**
```bash
node execute-purchase-allocation-flow.js \
  a3dffcd4-2b05-4e26-b20a-94b6a4880584 \
  c7310936-bac3-4e73-b234-e3471b004499 \
  1000 \
  50.00
```

**From Project Root:**
```bash
# Ensure .env is loaded
node scripts/execute-purchase-allocation-flow.js <order_id> <product_id> <quantity>
```

---

## Workflow Details

### Step 1: Create ProcurementProduct

Creates a new purchase request linked to an order:

```sql
INSERT INTO procurement_products (
  id, procurement_lot_id, supplier_master_id, product_master_id,
  procurement_product_type, procurement_quantity, procurement_price,
  procurement_purchaser, order_id, ...
)
```

**Result:** Purchase request in PENDING status, ready for approval

### Step 2: Approve Purchase Request

Updates procurement product status to "Approved":

```sql
UPDATE procurement_products 
SET status = 'Approved', approver_name = 'System Automation'
WHERE id = procurement_product_id
```

**Result:** Purchase request approved by system

### Step 3: Create PurchaseInventory

Records the available stock from approved purchase:

```sql
INSERT INTO purchase_inventory (
  product_master_id, procurement_product_id,
  quantity, available_quantity, available_stock, ...
) VALUES (
  product_id, procurement_product_id,
  quantity, quantity, quantity, ...  -- ← available_stock NOW SET!
)
```

**Result:** Inventory available for allocation (available_stock > 0)

### Step 4: Auto-Create SalesAllocations

Automatically creates allocations with ALLOCATED status:

```sql
INSERT INTO sales_allocations (
  order_id, order_product_id,
  allocated_quantity, ordered_quantity,
  allocation_status, ...
) VALUES (
  order_id, order_product_id,
  quantity, order_qty,
  'ALLOCATED', ...  -- ← KEY: ALLOCATED not PENDING
)
```

**Result:** Order now shows "ALLOCATED" status instead of "PENDING"

---

## Examples

### Test Order with Single Product

```bash
# Order: a3dffcd4-2b05-4e26-b20a-94b6a4880584
# Product: Blackfin Tuna (c7310936-bac3-4e73-b234-e3471b004499)
# Quantity: 1000 kg
# Price: $50/kg

./execute-purchase-allocation-flow.sh \
  a3dffcd4-2b05-4e26-b20a-94b6a4880584 \
  c7310936-bac3-4e73-b234-e3471b004499 \
  1000 \
  50.00
```

### Batch Processing Multiple Orders

```bash
#!/bin/bash

# Create a list of orders to process
orders=(
  "order_id_1|product_id_1|1000|50.00"
  "order_id_2|product_id_2|500|75.00"
  "order_id_3|product_id_3|750|60.00"
)

for order_data in "${orders[@]}"; do
  IFS='|' read -r order_id product_id qty price <<< "$order_data"
  
  echo "Processing order: $order_id"
  ./execute-purchase-allocation-flow.sh "$order_id" "$product_id" "$qty" "$price"
  echo "---"
  sleep 2
done
```

### Using with Node.js Directly

```bash
cd /path/to/project

# From project root with .env loaded
npx node scripts/execute-purchase-allocation-flow.js \
  a3dffcd4-2b05-4e26-b20a-94b6a4880584 \
  c7310936-bac3-4e73-b234-e3471b004499 \
  1000 \
  50.00
```

---

## Expected Output

### Successful Execution

```
▶ Starting Purchase Approval → Allocation Flow

Parameters:
  Order ID:       a3dffcd4-2b05-4e26-b20a-94b6a4880584
  Product ID:     c7310936-bac3-4e73-b234-e3471b004499
  Quantity:       1000 kg
  Price:          $50.00/kg

▶ Fetching supplier...
✅ Supplier ID: 60d83d2d-4a8f-40da-b248-42e94bcf41a1

▶ Fetching procurement lot...
✅ Procurement Lot ID: df6c00ef-e0f9-4d4e-b2b0-d335616cb507

▶ STEP 1: Creating ProcurementProduct (Purchase Request)...
✅ ProcurementProduct created: e5191776-dada-4cc9-8ec6-98f67b3338da

▶ STEP 2: Approving Purchase Request...
✅ ProcurementProduct approved: status = Approved

▶ STEP 3: Creating PurchaseInventory with available stock...
✅ PurchaseInventory created: 0e8ad7f0-8104-49a4-83ae-68d41d1c099a
✅ Available Stock: 1000 kg

▶ STEP 4: Auto-creating SalesAllocations...
✅ SalesAllocation created: 39a46435-84a2-4485-9215-02a29d77f738
✅ Allocation Status: ALLOCATED ✅
✅ Allocated Quantity: 1000 kg

▶ VERIFICATION: Querying database...

Verification Results:
  Order Number:        2026020916
  Allocations:         1
  Procurement Status:  Approved

╔════════════════════════════════════════════════════════════╗
║   FLOW EXECUTION COMPLETED SUCCESSFULLY ✅                ║
╚════════════════════════════════════════════════════════════╝

Summary:
  • ProcurementProduct:   e5191776-dada-4cc9-8ec6-98f67b3338da
  • Status:               Approved ✅
  • Quantity:             1000 kg
  • SalesAllocation:      Auto-created with ALLOCATED status ✅

Next Steps:
  1. Verify order shows "ALLOCATED" status in UI
  2. Create production order from the allocation
  3. Track fulfillment through manufacturing

✅ Flow automation completed!
```

---

## Troubleshooting

### Issue: "No supplier found in database"

**Cause:** Database has no suppliers configured

**Solution:**
```bash
# Manually specify supplier ID
./execute-purchase-allocation-flow.sh \
  <order_id> <product_id> <quantity> <price> <supplier_id>
```

### Issue: "No order products found"

**Cause:** Order exists but has no products, or product mismatch

**Solution:**
```bash
# Verify order has products for the product_id:
psql -h localhost -U automatly -d seafood-erp -c \
  "SELECT * FROM order_products WHERE order_id = '<order_id>'"
```

### Issue: Database connection timeout

**Cause:** Database not running or connection details wrong

**Solution:**
```bash
# Verify database connection
psql -h localhost -U automatly -d seafood-erp -c "SELECT 1"

# Check environment variables
echo $DB_HOST $DB_PORT $DB_USERNAME $DB_NAME
```

### Issue: "Allocation already exists"

**Cause:** Allocation already created for this order/product

**Solution:** Script will skip and continue - this is normal behavior

---

## Database Verification

To manually verify the flow after execution:

```sql
-- Check ProcurementProduct
SELECT id, status, procurement_quantity 
FROM procurement_products 
WHERE order_id = '<order_id>'
LIMIT 1;

-- Check PurchaseInventory
SELECT id, available_stock, quantity 
FROM purchase_inventory 
WHERE procurement_product_id = '<procurement_id>'
LIMIT 1;

-- Check SalesAllocations
SELECT id, allocation_status, allocated_quantity, ordered_quantity 
FROM sales_allocations 
WHERE order_id = '<order_id>'
LIMIT 1;
```

---

## Integration with API

The automation can be integrated with the application API:

```javascript
// Example: Trigger from API endpoint
app.post('/api/v1/orders/:orderId/auto-allocate', async (req, res) => {
  const { orderId } = req.params;
  const { productId, quantity, price, supplierId } = req.body;
  
  // Call the Node.js script
  const { execFile } = require('child_process');
  execFile('node', [
    'scripts/execute-purchase-allocation-flow.js',
    orderId, productId, quantity, price, supplierId
  ], (error, stdout, stderr) => {
    if (error) return res.status(500).send(error);
    res.json({ success: true, output: stdout });
  });
});
```

---

## Performance Notes

- **Bash Script:** ~2-3 seconds per execution (database I/O bound)
- **Node.js Script:** ~1-2 seconds per execution (connection pooling faster)
- **Batch Operations:** 100+ orders can be processed in 2-3 minutes

---

## Security Considerations

1. **Database Credentials:** Store in `.env`, never in version control
2. **User ID:** System user ID used for created_by/updated_by audit trail
3. **Approval Chain:** Currently auto-approves - consider adding approval workflow
4. **Audit Logging:** All operations logged in database audit tables

---

## Related Files

- `PURCHASE_APPROVAL_ALLOCATION_FLOW.md` - Detailed workflow documentation
- `FLOW_EXECUTION_RESULTS.md` - Example execution results
- Code fixes: `cea88ad`, `c344e32`, `f221f0b` - Allocation status logic improvements

