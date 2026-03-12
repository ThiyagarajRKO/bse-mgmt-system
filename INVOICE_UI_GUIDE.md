# Sales Invoice UI - Location & Access Guide

## File Locations

### View File
- **File**: `/views/Invoice.ejs`
- **Size**: ~18 KB
- **Type**: EJS template for rendering HTML UI

### Route Registration
- **File**: `/src/index.js`
- **Lines**: 174-182
- **Route**: `GET /invoices`

### Backend Routes (API)
- **File**: `/src/routes/sales_invoices/index.js`
- **API Endpoints**:
  - `GET /api/sales/invoices` - List all invoices (paginated)
  - `POST /api/sales/invoices` - Create new invoice
  - `GET /api/sales/invoices/:id` - Get invoice details
  - `POST /api/sales/invoices/:id/line-items` - Add line items
  - `PUT /api/sales/invoices/:id/charges` - Update charges
  - `PUT /api/sales/invoices/:id/post` - Post to GL
  - `PUT /api/sales/invoices/:id/cancel` - Cancel invoice
  - `GET /api/sales/invoices/summary/revenue` - Revenue summary

### Controller
- **File**: `/src/controllers/SalesInvoiceController.js`
- **Methods**:
  - `createInvoice()` - Create new invoice
  - `addLineItems()` - Add items to invoice
  - `updateCharges()` - Update shipping, discount, etc.
  - `getInvoiceDetails()` - Get single invoice
  - `listInvoices()` - List with pagination
  - `postInvoiceToGL()` - Post to accounting
  - `cancelInvoice()` - Soft delete
  - `getRevenueSummary()` - Revenue stats

### Database Model
- **File**: `/models/sales_invoices.js`
- **Table**: `sales_invoices`
- **Columns**: 
  - invoice_number, invoice_date, due_date
  - customer_id, order_reference
  - shipping_location_id, status, is_posted
  - line_items (relationship), charges, notes

---

## How to Access Invoice UI

### 1. **Direct URL Access**
```
http://127.0.0.1:3000/invoices
```

### 2. **Features in Invoice UI**

#### Tab 1: Invoice List
- DataTable with all invoices
- Columns: Invoice #, Date, Customer, Order Ref, Amount, Status, Posted, Actions
- Inline actions: View, Edit (draft only), Delete (draft only)
- Status badges: Draft (blue), Posted (green), Cancelled (red)

#### Tab 2: Create Invoice
- Invoice header form (number, date, due date)
- Customer selection (dropdown)
- Order reference and shipping location
- Line items table with:
  - Product selection
  - HSN code (auto-populated)
  - Quantity, unit, rate
  - Discount %, automatic calculations
  - Tax rate %, tax amount
  - Total per line
- Additional charges:
  - Shipping charge
  - Packing charge
  - Other charges
  - Discount amount
- Total summary:
  - Subtotal
  - Total tax
  - Grand total
- Action buttons:
  - Save Invoice (draft)
  - Save & Post to GL (immediate posting)
  - Clear Form

#### Tab 3: Revenue Summary
- Dashboard metrics:
  - Total invoices count
  - Total revenue (₹)
  - Posted invoices count
  - Average invoice value
- Additional analytics section

---

## Integration Points

### 1. **Master Data Dependencies**
- Customers: `/api/master/customer-master`
- Products: `/api/master/product-master`
- Locations: `/api/master/location-master`
- GL Accounts: `/api/master/gl-account`

### 2. **Accounting Integration**
- Posts invoices to GL posting journals
- Creates accounting entries for revenue recognition
- Links to `gl_postings` table

### 3. **Product GST Integration**
- Uses product GST mapping from `product_gst_mapping` table
- Auto-calculates tax based on product's GST rate
- Supports different tax rates per line item

---

## UI Components & Libraries

### CSS Framework
- Bootstrap 5
- MDB5 (Material Design Bootstrap)

### JavaScript Libraries
- jQuery
- DataTables with server-side processing
- Select2 for dropdowns
- Toastr for notifications
- jQuery Confirm for confirmations

### Features Included
- Responsive design (mobile-friendly)
- Real-time calculations
- Form validation
- Error handling with toast notifications
- Pagination for invoice list
- Search & filter in DataTable
- Status tracking with visual badges

---

## Database Schema

### sales_invoices table
```sql
CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  customer_id UUID NOT NULL REFERENCES customer_master(id),
  order_reference VARCHAR(100),
  shipping_location_id UUID REFERENCES location_master(id),
  subtotal DECIMAL(15,2),
  total_tax DECIMAL(15,2),
  total_charges DECIMAL(15,2),
  total_discount DECIMAL(15,2),
  total_amount DECIMAL(15,2) NOT NULL,
  status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
  is_posted BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

---

## Next Steps / TODO

- [ ] Add customer dropdown population from API
- [ ] Add product dropdown with search/select2
- [ ] Implement auto-calculation of GST on line items
- [ ] Add PDF export functionality
- [ ] Add email invoice feature
- [ ] Implement payment tracking
- [ ] Add invoice number auto-generation
- [ ] Implement approval workflow
- [ ] Add invoice templates/customization
- [ ] Add recurring invoices

---

## Testing the Invoice UI

### 1. **Start Server**
```bash
npm start
```

### 2. **Navigate to Invoice Page**
```
http://127.0.0.1:3000/invoices
```

### 3. **Test List Tab**
- View existing invoices
- Check pagination
- Test action buttons

### 4. **Test Create Tab**
- Fill in invoice details
- Add line items
- Calculate totals
- Save invoice

### 5. **Test Revenue Summary**
- View summary metrics
- Check calculations

---

## Troubleshooting

### Invoice UI not loading
- Ensure server is running: `npm start`
- Check browser console for JavaScript errors
- Verify route is registered: `grep -n "invoices" src/index.js`

### API errors
- Check if backend API endpoints are registered
- Verify database tables exist
- Check API response: `curl http://127.0.0.1:3000/api/sales/invoices`

### Data not showing
- Verify seeding was run for master data
- Check database connectivity
- Review browser network tab for API errors
