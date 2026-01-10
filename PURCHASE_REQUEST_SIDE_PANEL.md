# Purchase Request Side Panel - Implementation Guide

## Overview

The "Raise Purchase Request" feature has been converted from a modal dialog (`$.confirm`) to a **slide-in side panel** for better UX and more space for displaying information.

## Changes Made

### 1. HTML Structure (Side Panel Added)

**Location:** `/views/Sales.ejs` (lines 741-792)

A new side panel (`purchaseRequestSlideInPanel`) has been added with:

- Order details section
- AI Analysis section (shows AI recommendations and insights)
- Raw materials selection section
- Quantity input field
- Action buttons (Create Request and Cancel)

### 2. JavaScript Functions Updated

#### `showRaisePurchaseRequestDialog()`

**Changed from:** Modal dialog (`$.confirm`) to side panel slide-in
**Location:** Lines 3400-3445

**Functionality:**

- Stores current purchase request data in `window.currentPurchaseRequest`
- Populates order details in the side panel
- Initializes quantity field with 20% buffer calculation
- Loads raw materials and AI analysis
- Opens the side panel using `slideInPanel()`

#### `loadRawMaterialsForPurchaseRequest()`

**New Function:** Lines 3447-3520

**Functionality:**

- Fetches AI calculations via `loadAICalculatedRequirementsForPanel()`
- Fetches product details from database
- Fetches procurement products (raw materials) for the selected product
- Displays raw materials with:
  - Available quantity
  - Status (Available/Out of Stock) with color coding
  - Radio button selection
  - Status bar with visual indicators

#### `loadAICalculatedRequirementsForPanel()`

**New Function:** Lines 3522-3551

**Functionality:**

- Calls the API endpoint: `/api/procurement/product/calculate/requirements`
- Passes: `productId` and `quantityRequired`
- Stores results in `window.aiCalculationResults`
- Calls `displayAIInsightsInPanel()` to render insights

#### `displayAIInsightsInPanel()`

**New Function:** Lines 3553-3591

**Functionality:**

- Displays AI analysis in the side panel with:
  - AI recommendation text
  - Confidence score (as percentage)
  - Urgency level (LOW/MEDIUM/HIGH) with color coding
  - Quick facts:
    - Conversion Ratio
    - Yield Percentage
    - Recommended Order Quantity
    - Current Inventory
  - Optimization tips (if available)

### 3. Event Handlers Added

**Location:** Lines 2145-2191

#### Close Button Handler

```javascript
$("#closePurchaseRequestPanelBtn").click(function () {
  closeSlidePanel("purchaseRequestSlideInPanel");
  window.currentPurchaseRequest = null;
});
```

#### Cancel Button Handler

```javascript
$("#purchaseRequestCancelBtn").click(function () {
  $("#closePurchaseRequestPanelBtn").click();
});
```

#### Create Request Button Handler

```javascript
$("#purchaseRequestCreateBtn").click(function () {
  // Validates material selection
  // Validates quantity input
  // Calls generatePurchaseRequest()
  // Closes the panel
});
```

## Side Panel Features

### Layout

- **Width:** 400px
- **Position:** Fixed, right side of screen
- **Animation:** Slides in from right with 0.3s transition
- **Z-Index:** 9999 (appears above all other content)
- **Height:** 90vh (90% of viewport height)
- **Overflow:** Auto-scrollable for long content

### Styling

- **Background:** Dark theme (#1f2d3e)
- **Text Color:** Light (#e3e3e3)
- **Cards:** Bootstrap cards for section organization
- **Color Coding:**
  - Green: Available stock
  - Red: Out of stock or urgent
  - Blue: AI recommendations
  - Yellow: Tips and warnings

## User Workflow

1. **User clicks "Raise Purchase Request"** on an order
2. **Side panel slides in from right** with:
   - Order details
   - AI analysis and recommendations
   - Available raw materials to select from
   - Quantity input field (pre-filled with 20% buffer)
3. **User can:**
   - Review AI recommendations
   - Select a raw material from the list
   - Adjust the quantity if needed
4. **User clicks "Create Request"** to submit
   - Validation occurs
   - Purchase request is created
   - Panel closes automatically
   - Success notification displays

## API Endpoints Used

### 1. Calculate Requirements

```
GET /api/procurement/product/calculate/requirements
Parameters:
  - productId: UUID of the product
  - quantityRequired: Number of units needed
```

**Response:**

```json
{
  "success": true,
  "data": {
    "finishedProductRequired": 100,
    "yieldPercentage": "75.00%",
    "conversionRatio": "1.33:1",
    "rawMaterialNeeded": 134,
    "safetyBuffer": 7,
    "totalWithBuffer": 141,
    "currentInventory": 50,
    "recommendedOrderQuantity": 91,
    "aiAnalysis": {
      "recommendation": "● MINIMAL ORDER: Small quantity top-up recommended",
      "confidence": 85,
      "urgency": "LOW",
      "riskLevel": "LOW",
      "optimizationTips": [...]
    }
  }
}
```

### 2. Get Product Details

```
GET /api/master/product/{productId}
```

### 3. Get Procurement Products

```
GET /api/procurement/products?productId={productId}
```

## Database Dependencies

- **ProductMaster** - Product information
- **ProductCategoryMaster** - Product categorization
- **SpeciesMaster** - Species information
- **YieldStandardMaster** - Conversion ratios for AI calculations
- **ProcurementProducts** - Raw materials available
- **PurchaseInventory** - Current inventory levels

## Styling Classes

### CSS Classes Used

- `.slideInPanel` - Main panel container
- `.panelClose` - Close button styling
- `.card` - Card sections
- `.card-body` - Card content
- `.form-control` - Input fields
- `.btn` - Button styling

### Custom Inline Styles

- Color coding for urgency levels
- Responsive layout for different material options
- Visual indicators for available/out of stock materials

## Browser Console Logging

The implementation includes detailed logging for debugging:

- 📊 `Starting AI calculation for:` - When calculation begins
- ✅ `API Response received:` - When API responds
- 🤖 `AI Calculation Result:` - When calculation is successful
- ⚠️ `No calculation data in response` - When data is missing
- ❌ `AI calculation API error:` - When API fails

## Troubleshooting

### Issue: Side panel doesn't slide in

- **Solution:** Verify `slideInPanel()` plugin is loaded
- Check that `purchaseRequestSlideInPanel` ID is correct

### Issue: AI insights not showing

- **Solution:** Check browser console for API errors
- Verify product exists in database
- Check yield standards are populated for species

### Issue: Raw materials not loading

- **Solution:** Verify procurement products exist for the product
- Check API response in browser Network tab
- Ensure product has valid category and species

## Future Enhancements

1. **Add multi-material support** - Allow selecting multiple raw materials
2. **Save as template** - Save common order templates
3. **View alternatives** - Show all form/processing combinations
4. **Bulk operations** - Create multiple purchase requests at once
5. **Supplier suggestions** - Recommend suppliers based on availability
6. **History view** - Show previous purchase requests for this product

## Testing Checklist

- [ ] Side panel slides in when "Raise Purchase Request" is clicked
- [ ] Order details display correctly
- [ ] AI analysis shows with all sections (recommendation, confidence, urgency, tips)
- [ ] Raw materials load and display with correct availability status
- [ ] Quantity field pre-fills with 20% buffer
- [ ] Material selection works with radio buttons
- [ ] "Create Request" button submits the form
- [ ] "Cancel" button closes the panel without creating request
- [ ] Close button (X) closes the panel
- [ ] Panel closes automatically after successful request creation
- [ ] Success notification displays after creation
- [ ] AI API calls complete within reasonable time (<2 seconds)
