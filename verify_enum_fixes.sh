#!/bin/bash

# Verification script for invalid order status enum fixes

echo "Checking for invalid order_status values..."
echo ""

# Check for invalid order_status values (NOT in delivery_status or status fields)
echo "❌ Searching for PENDING_PRODUCTION in order_status..."
grep -n "order_status.*PENDING_PRODUCTION" src/**/*.js 2>/dev/null || echo "✅ None found"

echo ""
echo "❌ Searching for PENDING_PROCUREMENT in order_status..."
grep -n "order_status.*PENDING_PROCUREMENT" src/**/*.js 2>/dev/null || echo "✅ None found"

echo ""
echo "❌ Searching for READY_FOR_PRODUCTION in order_status..."
grep -n "order_status.*READY_FOR_PRODUCTION" src/**/*.js 2>/dev/null || echo "✅ None found"

echo ""
echo "❌ Searching for READY_FOR_ALLOCATION in order_status..."
grep -n "order_status.*READY_FOR_ALLOCATION" src/**/*.js 2>/dev/null || echo "✅ None found"

echo ""
echo "✅ Checking for valid order_status values..."
echo ""

echo "✅ IN_PRODUCTION:"
grep -n 'order_status.*"IN_PRODUCTION"' src/**/*.js 2>/dev/null | head -3

echo ""
echo "✅ CONFIRMED:"
grep -n 'order_status.*"CONFIRMED"' src/**/*.js 2>/dev/null | head -3

echo ""
echo "✅ READY_FOR_DISPATCH:"
grep -n 'order_status.*"READY_FOR_DISPATCH"' src/**/*.js 2>/dev/null | head -3

echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
