# AI Raw Material Calculator - Testing Guide

## Quick Start Test

### 1. Access the Purchase Request Feature

1. Navigate to: **Sales → Allocate Orders**
2. Click the **👁️ View** icon on any order
3. Click **Raise Purchase Request** button
4. A dialog will open with AI analysis

### 2. What You'll See

#### Before (Old Behavior):

- Just material name and auto-calculated quantity

#### After (New Behavior):

- ✅ Material name with inventory status
- ✅ Available stock information
- ✅ **NEW:** 🤖 AI Analysis Panel showing:
  - Conversion ratio (e.g., 1.33:1)
  - Yield percentage (e.g., 75%)
  - Recommended order quantity (calculated from inventory)
  - Current inventory status
  - Urgency level (LOW/MEDIUM/HIGH)
  - Confidence score
  - Optimization tips

### 3. Test Scenarios

#### Scenario A: Sufficient Inventory (LOW Urgency)

```
Product: Vannamei Shrimp (Frozen, Cleaned)
Quantity Required: 100 units
Expected Yield: 75%
Current Inventory: 150 units

Expected Result:
- Recommended Order: 0 units
- Urgency: LOW
- Recommendation: "✓ SUFFICIENT INVENTORY: No additional purchase needed"
- Confidence: 95%
```

**Test:**

1. Select a product with known high inventory
2. Set quantity required to low value
3. Observe recommendation shows no order needed

#### Scenario B: Partial Inventory (MEDIUM Urgency)

```
Product: Tilapia (Fresh, Whole)
Quantity Required: 500 units
Expected Yield: 95%
Current Inventory: 100 units

Expected Result:
- Raw Material Needed: 526 units
- With Buffer: 542 units
- Recommended Order: 442 units
- Urgency: MEDIUM
- Recommendation: "⚠ MODERATE ORDER: Significant quantity needed within 3 days"
- Confidence: 80%
```

**Test:**

1. Select a product with moderate inventory
2. Set large quantity requirement
3. Observe medium urgency recommendation

#### Scenario C: No Inventory (HIGH Urgency)

```
Product: Squid (Cooked, Filleted)
Quantity Required: 250 units
Expected Yield: 65%
Current Inventory: 0 units

Expected Result:
- Raw Material Needed: 385 units
- With Buffer: 416 units
- Recommended Order: 416 units
- Urgency: HIGH
- Recommendation: "🔴 URGENT ORDER: Large quantity needed ASAP (within 24hrs)"
- Confidence: 75%
- Risk Level: HIGH
```

**Test:**

1. Select a product with zero inventory
2. Set moderate to high quantity requirement
3. Observe high urgency with risk warning

### 4. API Testing (Advanced)

#### Test Endpoint 1: Calculate Requirements

```bash
curl "http://localhost:4000/api/procurement/product/calculate/requirements?productId=YOUR_PRODUCT_ID&quantityRequired=100&productForm=FROZEN&processingType=CLEANED"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "finishedProductRequired": 100,
    "yieldPercentage": "75.00%",
    "variancePercentage": "5.00%",
    "conversionRatio": "1.33:1",
    "rawMaterialNeeded": 134,
    "safetyBuffer": 7,
    "totalWithBuffer": 141,
    "currentInventory": 50,
    "inventoryGap": 91,
    "recommendedOrderQuantity": 91,
    "aiAnalysis": {
      "recommendation": "● MINIMAL ORDER: Small quantity top-up recommended",
      "confidence": 85,
      "urgency": "LOW",
      "riskLevel": "LOW"
    }
  }
}
```

#### Test Endpoint 2: Multi-Category Recommendations

```bash
curl "http://localhost:4000/api/procurement/product/calculate/multi-category?productId=YOUR_PRODUCT_ID&quantityRequired=100"
```

**Expected Response:**

```json
{
  "success": true,
  "total": 16,
  "data": [
    { "productForm": "FRESH", "processingType": "WHOLE", "recommendedOrderQuantity": 150, ... },
    { "productForm": "FRESH", "processingType": "CLEANED", "recommendedOrderQuantity": 145, ... },
    { "productForm": "FROZEN", "processingType": "WHOLE", "recommendedOrderQuantity": 140, ... },
    ...
  ]
}
```

### 5. Validating AI Analysis

✅ **Confidence Score Check:**

- Should be 95% for sufficient inventory scenarios
- Should be 80-85% for moderate scenarios
- Should be 75% for high-risk scenarios

✅ **Urgency Level Check:**

- LOW: When order ≤ 10% of raw material needed
- MEDIUM: When order is 10-50% of raw material needed
- HIGH: When order > 50% of raw material needed

✅ **Conversion Ratio Check:**

- Formula: `1 ÷ (yield_percentage / 100)`
- Example: 75% yield = 1.33:1 ratio ✓

✅ **Recommended Order Check:**

- Formula: `Total with Buffer - Current Inventory`
- Should never be negative
- Should be 0 if inventory sufficient

### 6. Common Issues & Solutions

| Issue                    | Cause                    | Solution                          |
| ------------------------ | ------------------------ | --------------------------------- |
| AI Analysis not showing  | Yield standard not found | Create yield standard for species |
| Recommended qty too high | Inventory data stale     | Refresh inventory records         |
| Confidence score 75%     | Using default yield      | Add yield standard to database    |
| Error in response        | Invalid product ID       | Verify product ID in database     |

### 7. Data to Prepare for Testing

Before running tests, ensure you have:

1. **Product Masters** with:

   - ✓ Product name
   - ✓ Product category assigned
   - ✓ Species assigned to category

2. **Yield Standards** for at least one species:

   ```sql
   INSERT INTO yield_standard_master (
     species_id, product_form, processing_type,
     expected_yield_pct, allowed_variance_pct, is_active
   ) VALUES (
     'species-uuid', 'FROZEN', 'CLEANED', 75.00, 5.00, true
   );
   ```

3. **Purchase Inventory** (optional, for inventory checks):
   ```sql
   INSERT INTO purchase_inventory (
     procurement_product_id, quantity, is_active
   ) VALUES (
     'procurement-product-uuid', 50, true
   );
   ```

### 8. Performance Expectations

- **Calculate Requirements**: < 500ms
- **Multi-Category Recommendations**: < 2 seconds (all 16 combinations)
- **Dialog Display**: < 1 second

### 9. Browser Console Debugging

Open browser Developer Tools (F12) and check Console tab:

✓ Should see logs like:

```
🔍 Starting Raw Material Calculation: {productId: "...", quantityRequired: 100}
📦 Product Info: {productName: "...", category: "...", species: "..."}
✅ Raw Material Calculation Complete: {...calculation results...}
🤖 AI Calculation Result: {...ai analysis...}
```

### 10. Testing Checklist

- [ ] Dialog opens without errors
- [ ] AI insights panel displays
- [ ] Conversion ratio appears correct
- [ ] Yield percentage matches database
- [ ] Recommended order quantity is realistic
- [ ] Urgency level is appropriate
- [ ] Confidence score shows
- [ ] Optimization tips display
- [ ] User can still modify quantity
- [ ] Purchase request can be created
- [ ] API responses are fast (<2 sec)

## Success Criteria

✅ **Test Passed If:**

1. AI insights panel displays in purchase request dialog
2. Conversion ratio = 1 ÷ (yield_percentage / 100)
3. Recommended order = (finished qty ÷ yield%) × (1 + variance%) - current inventory
4. Urgency level matches order quantity tier
5. Confidence score ≥ 75%
6. All calculations are accurate to 2 decimal places

## Support

For issues or questions:

1. Check browser console for errors (F12)
2. Verify yield standard exists for species
3. Check inventory records are current
4. Review API endpoint responses
5. Consult AI_RAW_MATERIAL_CALCULATOR.md documentation
