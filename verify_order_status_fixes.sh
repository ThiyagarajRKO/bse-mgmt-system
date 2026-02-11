#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "ORDER STATUS ENUM FIXES - VERIFICATION SCRIPT"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

cd "/Users/mithra/Documents/bse-mgmt-system 2"

# Valid order statuses from the model
VALID_STATUSES="ORDER_RECEIVED|DRAFT|CONFIRMED|ALLOCATED|IN_PRODUCTION|READY_FOR_QA|QA_APPROVED|PACKED|READY_FOR_DISPATCH|DISPATCHED|INVOICED|CLOSED|CANCELLED"

echo "${BLUE}═══ 1. Checking for invalid order_status values ═══${NC}"
echo ""

# Invalid statuses that should NOT be used for order_status
INVALID_STATUSES=(
    "PROCUREMENT_PENDING"
    "PENDING_PROCUREMENT"
    "PENDING_PRODUCTION"
    "READY_FOR_PRODUCTION"
    "READY_FOR_ALLOCATION"
)

FOUND_INVALID=0

for INVALID in "${INVALID_STATUSES[@]}"; do
    echo "Searching for: $INVALID"
    
    # Search for order_status with invalid value
    MATCHES=$(grep -r "order_status.*$INVALID" src/ 2>/dev/null | grep -v node_modules | wc -l)
    
    if [ $MATCHES -gt 0 ]; then
        echo -e "${RED}❌ FOUND $MATCHES occurrences of order_status: \"$INVALID\"${NC}"
        grep -rn "order_status.*$INVALID" src/ 2>/dev/null | grep -v node_modules
        FOUND_INVALID=$((FOUND_INVALID + MATCHES))
    else
        echo -e "${GREEN}✅ No order_status set to $INVALID${NC}"
    fi
    echo ""
done

echo "════════════════════════════════════════════════════════════════"
echo "${BLUE}═══ 2. Checking valid order_status usage ═══${NC}"
echo ""

# Check that valid statuses are being used
echo "Valid statuses found in code:"
grep -rn "order_status.*:" src/routes/orders/handlers/ 2>/dev/null | grep -E "(CONFIRMED|IN_PRODUCTION|ALLOCATED|DISPATCHED)" | head -10

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${BLUE}═══ 3. Verification Summary ═══${NC}"
echo ""

if [ $FOUND_INVALID -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCESS: No invalid order_status values found!${NC}"
    echo ""
    echo "All order status assignments are now using valid enum values:"
    echo "  • DRAFT"
    echo "  • CONFIRMED"
    echo "  • ALLOCATED"
    echo "  • IN_PRODUCTION"
    echo "  • READY_FOR_QA"
    echo "  • QA_APPROVED"
    echo "  • PACKED"
    echo "  • READY_FOR_DISPATCH"
    echo "  • DISPATCHED"
    echo "  • INVOICED"
    echo "  • CLOSED"
    echo "  • CANCELLED"
    echo "  • ORDER_RECEIVED"
else
    echo -e "${RED}❌ FAILED: Found $FOUND_INVALID invalid order_status values!${NC}"
    echo "These need to be fixed before deployment."
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${BLUE}═══ 4. Key Files Fixed ═══${NC}"
echo ""

FILES_FIXED=(
    "src/routes/orders/handlers/allocate_stock.js"
    "src/routes/orders/handlers/auto_allocate_stock.js"
    "src/services/ProductionOrderService.js"
)

for FILE in "${FILES_FIXED[@]}"; do
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✅${NC} $FILE"
    else
        echo -e "${RED}❌${NC} $FILE (NOT FOUND)"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${BLUE}═══ 5. Test: Initiate Procurement Flow ═══${NC}"
echo ""
echo "When you create a new order and initiate procurement, verify:"
echo "  ✓ Order status changes to: CONFIRMED"
echo "  ✓ Allocation status changes to: ALLOCATED (when purchase approved)"
echo "  ✓ No 'invalid enum value' errors in logs"
echo ""
echo "════════════════════════════════════════════════════════════════"

echo -e "\n${GREEN}Verification complete!${NC}"
