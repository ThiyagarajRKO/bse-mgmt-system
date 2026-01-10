# AI-Powered Raw Material Calculator

## Overview

The AI-powered Raw Material Calculator uses intelligent algorithms to determine exactly how many raw materials need to be ordered based on:

1. **Product Category & Species**: Identifies the type of seafood product
2. **Yield Standards**: Uses conversion ratios specific to each species and product form
3. **Processing Type**: Accounts for different processing methods (WHOLE, CLEANED, FILLETED, PROCESSED)
4. **Product Form**: Considers the final product form (FRESH, FROZEN, COOKED, RTE)
5. **Current Inventory**: Adjusts calculations based on stock levels
6. **Safety Buffers**: Adds variance percentages for quality control

## How It Works

### Step 1: Finished Product Requirement

User specifies how many units of finished product are needed.

```
Finished Product Required: 100 units
```

### Step 2: Yield Standard Lookup

System fetches the yield percentage for the specific species and product form.

```
Species: Vannamei Shrimp
Product Form: FROZEN
Processing Type: CLEANED
Expected Yield: 75% (75 units of output from 100 units of input)
```

### Step 3: Raw Material Calculation

**Formula:**

```
Raw Material Needed = Finished Product Required ÷ Yield Percentage
```

**Example:**

```
Raw Material Needed = 100 ÷ 0.75 = 133.33 → 134 units (rounded up)
```

### Step 4: Safety Buffer

**Formula:**

```
Safety Buffer = Raw Material Needed × Variance Percentage
Total with Buffer = Raw Material Needed + Safety Buffer
```

**Example:**

```
Variance Percentage: 5%
Safety Buffer = 134 × 0.05 = 6.7 → 7 units
Total with Buffer = 134 + 7 = 141 units
```

### Step 5: Inventory Adjustment

**Formula:**

```
Recommended Order Quantity = Total with Buffer - Current Inventory
```

**Example:**

```
Total with Buffer: 141 units
Current Inventory: 50 units
Recommended Order Quantity = 141 - 50 = 91 units
```

### Step 6: AI Analysis

The system performs intelligent analysis to recommend:

- **Urgency Level**: LOW, MEDIUM, or HIGH
- **Risk Level**: LOW, MEDIUM, or HIGH
- **Confidence Score**: 0-100%
- **Optimization Tips**: Recommendations for process improvement

## API Endpoints

### 1. Calculate Raw Material Requirements

**Endpoint:** `GET /api/procurement/product/calculate/requirements`

**Parameters:**

```javascript
{
  productId: "UUID",              // Required: Product Master ID
  quantityRequired: 100,           // Required: Finished product quantity
  speciesId: "UUID",               // Optional: Auto-detected from product
  productCategoryId: "UUID",       // Optional: Auto-detected from product
  productForm: "FRESH",            // Optional: FRESH|FROZEN|COOKED|RTE (default: FRESH)
  processingType: "WHOLE"          // Optional: WHOLE|CLEANED|FILLETED|PROCESSED (default: WHOLE)
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    finishedProductRequired: 100,
    yieldPercentage: "75.00%",
    variancePercentage: "5.00%",
    conversionRatio: "1.33:1",
    rawMaterialNeeded: 134,
    safetyBuffer: 7,
    totalWithBuffer: 141,
    currentInventory: 50,
    inventoryGap: 91,
    recommendedOrderQuantity: 91,
    processingType: "CLEANED",
    productForm: "FROZEN",
    productCategory: "Peeled",
    species: "Vannamei Shrimp",
    yieldStandardId: "UUID",
    aiAnalysis: {
      recommendation: "● MINIMAL ORDER: Small quantity top-up recommended",
      confidence: 85,
      urgency: "LOW",
      riskLevel: "LOW",
      optimizationTips: [
        "Consider reducing variance threshold through better process control",
        "Similar products show higher yield - review processing standards",
        "Always verify with quality check before production"
      ]
    },
    timestamp: "2026-01-07T12:00:00.000Z"
  }
}
```

### 2. Get Multi-Category Recommendations

**Endpoint:** `GET /api/procurement/product/calculate/multi-category`

**Parameters:**

```javascript
{
  productId: "UUID",              // Required: Product Master ID
  quantityRequired: 100,           // Required: Finished product quantity
  speciesId: "UUID"                // Optional: Species ID
}
```

**Response:**

```javascript
{
  success: true,
  total: 16,
  data: [
    {
      productForm: "FRESH",
      processingType: "WHOLE",
      recommendedOrderQuantity: 150,
      ...
    },
    {
      productForm: "FRESH",
      processingType: "CLEANED",
      recommendedOrderQuantity: 145,
      ...
    },
    // ... more combinations sorted by order quantity
  ]
}
```

## Frontend Integration

### In Purchase Request Dialog

The AI calculator automatically runs when opening the "Raise Purchase Request" dialog:

```javascript
// Automatically fetches intelligent recommendations
loadRawMaterialsList(productId, quantityRequired);

// Internally calls:
loadAICalculatedRequirements(productId, quantityRequired);

// Displays AI insights with:
// - Recommended order quantity
// - Current inventory status
// - Conversion ratio (1.33:1 = 1.33 units raw material per 1 unit finished)
// - Yield percentage
// - AI recommendations and urgency level
```

### UI Components

1. **Material Information Panel**

   - Product name, category, species
   - Available stock in real-time

2. **AI Insights Panel** (NEW)

   - 🤖 Recommendation with confidence score
   - Urgency level (LOW/MEDIUM/HIGH)
   - Conversion ratio
   - Quick facts (yield, recommended order, current inventory)
   - Optimization tips

3. **Purchase Quantity Field**
   - Auto-filled with calculated amount
   - User can adjust if needed

## Yield Standard Data

Yield standards are stored in the `yield_standard_master` table:

```javascript
{
  id: "UUID",
  species_id: "UUID",              // References species_master
  product_form: "FROZEN",           // FROZEN|COOKED|RTE|FRESH
  processing_type: "CLEANED",       // WHOLE|CLEANED|FILLETED|PROCESSED
  expected_yield_pct: 75.00,        // Yield percentage (0-100)
  allowed_variance_pct: 5.00,       // Variance for safety buffer (0-10)
  min_yield_threshold: 70.00,       // Minimum acceptable yield
  max_yield_threshold: 85.00,       // Maximum expected yield
  is_active: true,
  created_by: "UUID",
  updated_by: "UUID"
}
```

## Default Behavior

If no yield standard is found for a species/form/type combination:

- **Default Yield**: 60% (conservative)
- **Default Variance**: 5%
- **Conversion Ratio**: 1.67:1
- **Flag**: "⚠️ Using conservative default yield (60%) - no yield standard found"

## Examples

### Example 1: Vannamei Shrimp - Frozen Cleaned

```
Requirement: 100 units of frozen, cleaned shrimp
Yield: 75%
Variance: 5%

Calculation:
- Raw Material Needed = 100 ÷ 0.75 = 134 units
- Safety Buffer = 134 × 0.05 = 7 units
- Total with Buffer = 141 units
- Current Inventory = 50 units
- RECOMMENDED ORDER = 91 units

AI Recommendation: "● MINIMAL ORDER: Small quantity top-up recommended"
Urgency: LOW
Confidence: 85%
```

### Example 2: Tilapia - Fresh Whole

```
Requirement: 500 units of fresh whole tilapia
Yield: 95% (whole fish, minimal processing loss)
Variance: 3% (higher confidence in whole form)

Calculation:
- Raw Material Needed = 500 ÷ 0.95 = 526 units
- Safety Buffer = 526 × 0.03 = 16 units
- Total with Buffer = 542 units
- Current Inventory = 0 units
- RECOMMENDED ORDER = 542 units

AI Recommendation: "🔴 URGENT ORDER: Large quantity needed ASAP (within 24hrs)"
Urgency: HIGH
Confidence: 75%
Risk Level: HIGH
```

### Example 3: Squid - Cooked Filleted

```
Requirement: 250 units of cooked, filleted squid
Yield: 65% (significant processing loss)
Variance: 8% (higher variance due to quality variation)

Calculation:
- Raw Material Needed = 250 ÷ 0.65 = 385 units
- Safety Buffer = 385 × 0.08 = 31 units
- Total with Buffer = 416 units
- Current Inventory = 100 units
- RECOMMENDED ORDER = 316 units

AI Recommendation: "⚠ MODERATE ORDER: Significant quantity needed within 3 days"
Urgency: MEDIUM
Confidence: 80%
Risk Level: MEDIUM
Optimization Tips:
- "Consider reducing variance threshold through better process control"
- "Similar products show higher yield - review processing standards"
```

## AI Optimization Features

1. **Pattern Learning**: Analyzes similar products in the same category
2. **Inventory Trends**: Considers current stock levels and usage patterns
3. **Risk Assessment**: Flags high-risk scenarios (large orders, new species)
4. **Confidence Scoring**: Provides confidence level based on data availability
5. **Tip Generation**: Suggests process improvements based on yield analysis

## Best Practices

1. **Always Update Yield Standards**: Keep yield data current for accuracy
2. **Review Variance Percentages**: Adjust based on actual production data
3. **Set Appropriate Thresholds**: Define min/max yield expectations
4. **Regular Audits**: Compare recommended vs. actual consumption
5. **Supplier Coordination**: Align order quantities with supplier capabilities

## Troubleshooting

### Issue: Very High Recommended Quantities

**Possible Causes:**

- Yield percentage too low - verify against actual production
- Variance percentage too high - adjust based on quality data
- No inventory records - ensure inventory records are created

**Solution:**

1. Update yield standard in database
2. Review and adjust variance percentage
3. Verify inventory data is current

### Issue: AI Recommendations Not Showing

**Possible Causes:**

- Yield standard not found for species/form combination
- API connection issue
- Missing product category mapping

**Solution:**

1. Create yield standard for the species/form
2. Check browser console for errors
3. Verify product has category and species assigned

## Future Enhancements

1. **Machine Learning**: Learn from historical data to refine yield estimates
2. **Seasonal Adjustments**: Modify calculations based on season/availability
3. **Multi-Supplier Optimization**: Recommend best supplier based on quantity
4. **Predictive Analytics**: Forecast demand based on order patterns
5. **Dynamic Pricing**: Integrate cost factors into recommendations
