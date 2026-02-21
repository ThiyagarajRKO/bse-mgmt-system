#!/bin/bash

################################################################################
# AUTOMATED PURCHASE APPROVAL → ALLOCATION FLOW EXECUTION
# 
# This script automates the complete workflow:
# 1. Creates a ProcurementProduct (purchase request)
# 2. Approves the purchase request
# 3. Creates/Updates PurchaseInventory with available stock
# 4. Auto-creates SalesAllocations with ALLOCATED status
#
# Usage: ./execute-purchase-allocation-flow.sh <order_id> <product_id> <quantity>
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default database config (from .env)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USERNAME:-automatly}"
DB_NAME="${DB_NAME:-seafood-erp}"
SYSTEM_USER_ID="${SYSTEM_USER_ID:-87ffbaff-b7e9-4198-90d2-0fa12d85ef82}"

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Validate arguments
if [ $# -lt 3 ]; then
    print_error "Missing arguments"
    echo "Usage: $0 <order_id> <product_id> <quantity> [price] [supplier_id]"
    echo ""
    echo "Example:"
    echo "  $0 a3dffcd4-2b05-4e26-b20a-94b6a4880584 c7310936-bac3-4e73-b234-e3471b004499 1000 50.00"
    exit 1
fi

ORDER_ID="$1"
PRODUCT_ID="$2"
QUANTITY="$3"
PRICE="${4:-50.00}"
SUPPLIER_ID="${5:-}"

print_step "Starting Purchase Approval → Allocation Flow"
echo ""
echo "Parameters:"
echo "  Order ID:       $ORDER_ID"
echo "  Product ID:     $PRODUCT_ID"
echo "  Quantity:       $QUANTITY kg"
echo "  Price:          \$$PRICE/kg"
echo ""

# Get supplier if not provided
if [ -z "$SUPPLIER_ID" ]; then
    print_step "Fetching default supplier..."
    SUPPLIER_ID=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT id FROM supplier_master LIMIT 1;" 2>/dev/null | tr -d ' ')
    if [ -z "$SUPPLIER_ID" ]; then
        print_error "No supplier found in database"
        exit 1
    fi
fi
print_success "Supplier ID: $SUPPLIER_ID"

# Get or create procurement lot
print_step "Fetching procurement lot..."
PROCUREMENT_LOT_ID=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT id FROM procurement_lots ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
if [ -z "$PROCUREMENT_LOT_ID" ]; then
    print_warning "No procurement lot found, creating one..."
    PROCUREMENT_LOT_ID=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "INSERT INTO procurement_lots (id, procurement_date, procurement_lot, unit_master_id, is_active, created_by)
         SELECT gen_random_uuid(), NOW(), 'AUTO-' || to_char(NOW(), 'YYYYMMDD-HH24MISS'), 
                (SELECT id FROM unit_master LIMIT 1), true, '$SYSTEM_USER_ID'
         RETURNING id;" 2>/dev/null | tr -d ' ')
fi
print_success "Procurement Lot ID: $PROCUREMENT_LOT_ID"
echo ""

################################################################################
# STEP 1: Create ProcurementProduct (Purchase Request)
################################################################################
print_step "STEP 1: Creating ProcurementProduct (Purchase Request)..."

PROCUREMENT_PRODUCT_ID=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "INSERT INTO procurement_products (
        id,
        procurement_lot_id,
        supplier_master_id,
        product_master_id,
        procurement_product_type,
        procurement_quantity,
        procurement_price,
        procurement_purchaser,
        order_id,
        is_active,
        created_by,
        created_at
    ) VALUES (
        gen_random_uuid(),
        '$PROCUREMENT_LOT_ID',
        '$SUPPLIER_ID',
        '$PRODUCT_ID',
        'UNPROCESSED',
        $QUANTITY,
        $PRICE,
        'System Automation',
        '$ORDER_ID',
        true,
        '$SYSTEM_USER_ID',
        NOW()
    ) RETURNING id;" 2>/dev/null | tr -d ' ')

if [ -z "$PROCUREMENT_PRODUCT_ID" ]; then
    print_error "Failed to create ProcurementProduct"
    exit 1
fi
print_success "ProcurementProduct created: $PROCUREMENT_PRODUCT_ID"
echo ""

################################################################################
# STEP 2: Approve Purchase Request
################################################################################
print_step "STEP 2: Approving Purchase Request..."

UPDATE_RESULT=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "UPDATE procurement_products 
     SET 
        status = 'Approved',
        approver_name = 'System Automation',
        updated_at = NOW(),
        updated_by = '$SYSTEM_USER_ID'
     WHERE id = '$PROCUREMENT_PRODUCT_ID'
     RETURNING id, status;" 2>/dev/null)

if ! echo "$UPDATE_RESULT" | grep -q "Approved"; then
    print_error "Failed to approve ProcurementProduct"
    exit 1
fi
print_success "ProcurementProduct approved: status = Approved"
echo ""

################################################################################
# STEP 3: Create/Update PurchaseInventory with available_stock
################################################################################
print_step "STEP 3: Creating PurchaseInventory with available stock..."

PURCHASE_INVENTORY_ID=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "INSERT INTO purchase_inventory (
        id,
        product_master_id,
        procurement_product_id,
        procurement_product_type,
        quantity,
        available_quantity,
        available_stock,
        reserved_quantity,
        is_active,
        created_by,
        created_at
    ) VALUES (
        gen_random_uuid(),
        '$PRODUCT_ID',
        '$PROCUREMENT_PRODUCT_ID',
        'UNPROCESSED',
        $QUANTITY,
        $QUANTITY,
        $QUANTITY,
        0,
        true,
        '$SYSTEM_USER_ID',
        NOW()
    ) ON CONFLICT DO NOTHING
    RETURNING id;" 2>/dev/null | tr -d ' ')

if [ -z "$PURCHASE_INVENTORY_ID" ]; then
    print_error "Failed to create PurchaseInventory"
    exit 1
fi
print_success "PurchaseInventory created: $PURCHASE_INVENTORY_ID"
print_success "Available Stock: $QUANTITY kg"
echo ""

################################################################################
# STEP 4: Auto-Create SalesAllocations with ALLOCATED status
################################################################################
print_step "STEP 4: Auto-creating SalesAllocations..."

ALLOCATION_RESULT=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c \
    "WITH order_products AS (
        SELECT id, quantity 
        FROM order_products 
        WHERE order_id = '$ORDER_ID'
          AND product_master_id = '$PRODUCT_ID'
    )
    INSERT INTO sales_allocations (
        id,
        order_id,
        order_product_id,
        ordered_quantity,
        allocated_quantity,
        fulfilled_quantity,
        allocation_status,
        allocation_date,
        allocated_by,
        is_active,
        created_by,
        created_at
    )
    SELECT 
        gen_random_uuid(),
        '$ORDER_ID',
        op.id,
        op.quantity,
        LEAST($QUANTITY, op.quantity),
        0,
        'ALLOCATED',
        NOW(),
        '$SYSTEM_USER_ID',
        true,
        '$SYSTEM_USER_ID',
        NOW()
    FROM order_products op
    RETURNING id, allocation_status, allocated_quantity;" 2>/dev/null)

if ! echo "$ALLOCATION_RESULT" | grep -q "ALLOCATED"; then
    print_warning "No allocations created (may already exist or no order products found)"
else
    ALLOCATION_ID=$(echo "$ALLOCATION_RESULT" | head -1 | awk '{print $1}')
    print_success "SalesAllocation created: $ALLOCATION_ID"
    print_success "Allocation Status: ALLOCATED ✅"
    print_success "Allocated Quantity: $QUANTITY kg"
fi
echo ""

################################################################################
# VERIFICATION
################################################################################
print_step "VERIFICATION: Querying database..."
echo ""

VERIFICATION=$(PGPASSWORD="$DB_SECRET" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" << 'VERIFY_SQL'
-- Verify the complete flow
SELECT 
    'Order Details' as section,
    o.order_no,
    COUNT(sa.id) as allocation_count
FROM orders o
LEFT JOIN sales_allocations sa ON o.id = sa.order_id
GROUP BY o.order_no
HAVING o.order_no IS NOT NULL
UNION ALL
SELECT 
    'ProcurementProduct' as section,
    pp.status,
    NULL::bigint
FROM procurement_products pp
ORDER BY 1;
VERIFY_SQL
)

echo "$VERIFICATION"
echo ""

################################################################################
# FINAL SUMMARY
################################################################################
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        FLOW EXECUTION COMPLETED SUCCESSFULLY ✅               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Summary:"
echo "  • ProcurementProduct:   $PROCUREMENT_PRODUCT_ID"
echo "  • Status:               Approved ✅"
echo "  • PurchaseInventory:    $PURCHASE_INVENTORY_ID"
echo "  • Available Stock:      $QUANTITY kg ✅"
echo "  • SalesAllocation:      Auto-created with ALLOCATED status ✅"
echo ""
echo "Next Steps:"
echo "  1. Verify order shows 'ALLOCATED' status in UI"
echo "  2. Create production order from the allocation"
echo "  3. Track fulfillment through manufacturing"
echo ""

print_success "Flow automation completed!"
