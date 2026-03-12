# BSE Management System - Complete Documentation

**Last Updated:** March 12, 2026  
**System Status:** ✅ Production Ready  
**Current Branch:** add-accounts

---

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [System Overview](#system-overview)
3. [Tax Code Master System](#tax-code-master-system)
4. [GST System Architecture](#gst-system-architecture)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Database Schema](#database-schema)
7. [Migration Management](#migration-management)
8. [Sales Invoice System](#sales-invoice-system)
9. [Accounting Integration](#accounting-integration)
10. [Testing & Verification](#testing--verification)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Deployment Checklist](#deployment-checklist)

---

## Quick Start Guide

### Prerequisites

- Node.js 22.3.0+
- PostgreSQL 12+
- npm or yarn

### Installation & Setup

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run migrations
npx sequelize db:migrate

# Start the server
npm start
```

**Database Configuration:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seafood-erp
DB_USERNAME=automatly
DB_SECRET=your_password
STORE_DB_NAME=users_sessions
```

---

## System Overview

### Architecture

The BSE Management System is built with:

- **Framework:** Fastify (async/await web framework)
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** Session-based with secure cookies
- **API Format:** RESTful JSON APIs with DataTables integration

### Core Modules

```
├── GST Management System
│   ├── consolidated_gst_master (GST rates)
│   ├── tax_code_master (Tax definitions)
│   ├── product_gst_mapping (Product → GST)
│   └── derivative_gst_mapping (Derivative → GST)
├── Sales Invoice System
│   ├── Sales orders
│   ├── Invoice generation
│   ├── Payment tracking
│   └── Shipment management
├── Accounting Integration
│   ├── Journal entries
│   ├── GL accounts
│   ├── Financial reporting
│   └── Audit trails
└── Master Data Management
    ├── Products
    ├── Customers
    ├── Suppliers
    ├── Carriers
    └── Locations
```

---

## Tax Code Master System

### Overview

The Tax Code Master system manages all tax code definitions and their mappings to GST rates. It supports:

- Multiple tax types (GST, IGST, NON_GST, ZERO_RATED, EXEMPT, REVERSE_CHARGE)
- Inward and Outward supply types
- HSN code mapping
- GL account assignments for CGST, SGST, IGST
- Export applicability and reverse charge settings
- Date-based effective rates

### Database Schema

**Table:** `tax_code_master`

```sql
CREATE TABLE tax_code_master (
  tax_code_id UUID PRIMARY KEY,
  tax_code VARCHAR(32) NOT NULL UNIQUE,
  tax_code_name VARCHAR(100) NOT NULL,
  description TEXT,
  tax_type ENUM('GST', 'IGST', 'NON_GST', 'ZERO_RATED', 'EXEMPT', 'REVERSE_CHARGE'),
  supply_type ENUM('INWARD', 'OUTWARD'),
  gst_rate_id VARCHAR(50),
  hsn_code VARCHAR(32),
  ledger_cgst_id UUID,
  ledger_sgst_id UUID,
  ledger_igst_id UUID,
  is_refundable BOOLEAN DEFAULT false,
  is_export_applicable BOOLEAN DEFAULT false,
  is_reverse_charge BOOLEAN DEFAULT false,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  company_id UUID NOT NULL,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tax_code ON tax_code_master(tax_code);
CREATE INDEX idx_tax_code_company ON tax_code_master(company_id);
CREATE INDEX idx_tax_code_active ON tax_code_master(is_active);
```

### API Endpoints

#### 1. Get All Tax Codes (DataTables Format)

**Endpoint:** `GET /api/master/tax-code`  
**Alias:** `GET /api/master/tax-code-master`  
**Method:** GET  
**Authentication:** Required (Session)

**Query Parameters:**

| Parameter              | Type    | Required | Description                    |
| ---------------------- | ------- | -------- | ------------------------------ |
| draw                   | number  | Yes      | DataTables request identifier  |
| start                  | number  | No       | Pagination offset (default: 0) |
| length                 | number  | No       | Records per page (default: 10) |
| search[value]          | string  | No       | Global search term             |
| search[regex]          | boolean | No       | Enable regex search            |
| columns[n][data]       | string  | No       | Column identifier              |
| columns[n][name]       | string  | No       | Column name                    |
| columns[n][searchable] | boolean | No       | Is column searchable           |
| columns[n][orderable]  | boolean | No       | Is column orderable            |
| tax_code               | string  | No       | Filter by tax code             |
| tax_code_name          | string  | No       | Filter by tax code name        |
| gst_rate_id            | string  | No       | Filter by GST rate             |
| tax_type               | string  | No       | Filter by tax type             |
| supply_type            | string  | No       | Filter by supply type          |
| is_export_applicable   | string  | No       | Filter by export applicability |

**Response:**

```json
{
  "success": true,
  "message": "Tax codes retrieved successfully",
  "recordsTotal": 44,
  "recordsFiltered": 44,
  "data": [
    {
      "tax_code_id": "550e8400-e29b-41d4-a716-446655440000",
      "tax_code": "TC_16055100_DOM",
      "tax_code_name": "Breaded or battered seafood – Domestic",
      "description": "Seafood products with breading or batter",
      "tax_type": "GST",
      "supply_type": "OUTWARD",
      "gst_rate_id": "gst_5_0",
      "hsn_code": "1605",
      "ledger_cgst_id": null,
      "ledger_sgst_id": null,
      "ledger_igst_id": null,
      "is_refundable": true,
      "is_export_applicable": false,
      "is_reverse_charge": false,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "is_active": true,
      "company_id": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2025-03-12T10:30:00.000Z",
      "updated_at": "2025-03-12T10:30:00.000Z",
      "gstMaster": {
        "gst_rate_id": "gst_5_0",
        "gst_name": "GST 5%",
        "hsn_code": "1605",
        "cgst_rate": 2.5,
        "sgst_rate": 2.5,
        "igst_rate": 0
      }
    }
  ]
}
```

**Example Request:**

```bash
curl -X GET \
  "http://127.0.0.1:3000/api/master/tax-code?draw=1&start=0&length=10&search[value]=&tax_code=TC_16055100" \
  -H "Cookie: sessionId=your_session_id"
```

#### 2. Create Tax Code

**Endpoint:** `POST /api/master/tax-code`  
**Method:** POST  
**Authentication:** Required (Session)  
**Content-Type:** application/json

**Request Body:**

```json
{
  "tax_code": "TC_NEW_CODE",
  "tax_code_name": "New Tax Code Name",
  "description": "Optional description",
  "tax_type": "GST",
  "supply_type": "OUTWARD",
  "gst_rate_id": "gst_5_0",
  "hsn_code": "0302",
  "is_refundable": true,
  "is_export_applicable": false,
  "is_reverse_charge": false,
  "effective_from": "2026-01-01",
  "company_id": "company-uuid-here"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tax code created successfully",
  "data": {
    "tax_code_id": "new-uuid",
    "tax_code": "TC_NEW_CODE",
    "tax_code_name": "New Tax Code Name",
    ...
  }
}
```

#### 3. Get Single Tax Code

**Endpoint:** `GET /api/master/tax-code/:id`  
**Method:** GET  
**Authentication:** Required (Session)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Tax code retrieved successfully",
  "data": { ... }
}
```

#### 4. Update Tax Code

**Endpoint:** `PUT /api/master/tax-code`  
**Method:** PUT  
**Authentication:** Required (Session)  
**Content-Type:** application/json

**Request Body:**

```json
{
  "tax_code_id": "550e8400-e29b-41d4-a716-446655440000",
  "tax_code": "TC_UPDATED",
  "tax_code_name": "Updated Tax Code Name",
  "tax_type": "GST",
  "supply_type": "OUTWARD",
  "hsn_code": "0302",
  "effective_from": "2026-01-01",
  "is_refundable": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Tax code updated successfully",
  "data": { ... }
}
```

#### 5. Delete Tax Code

**Endpoint:** `DELETE /api/master/tax-code/:id`  
**Method:** DELETE  
**Authentication:** Required (Session)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Tax code deleted successfully"
}
```

### Validation Rules

- **tax_code:** Must be unique, alphanumeric with underscores
- **tax_code_name:** Required, max 100 characters
- **tax_type:** One of: GST, IGST, NON_GST, ZERO_RATED, EXEMPT, REVERSE_CHARGE
- **supply_type:** One of: INWARD, OUTWARD
- **effective_from:** Required, must be valid date
- **effective_to:** Optional, if provided must be after effective_from
- **company_id:** Required UUID

---

## GST System Architecture

### Overview

The GST (Goods and Services Tax) system is built on four main tables that work together:

1. **consolidated_gst_master** - Primary GST rates lookup
2. **tax_code_master** - Tax code definitions (links to gst_master)
3. **product_gst_mapping** - Product → GST rate mapping
4. **derivative_gst_mapping** - Derivative → GST rate mapping

### Table Relationships

```
consolidated_gst_master (Primary)
├── (1) ← → (Many) product_gst_mapping
│        └─ gst_master_id (FK)
│
├── (1) ← → (Many) derivative_gst_mapping
│        └─ gst_master_id (FK)
│
└── Referenced by tax_code_master
     └─ gst_rate_id (lookup field)
```

### consolidated_gst_master

**Purpose:** Stores GST rates by HSN code

```sql
CREATE TABLE consolidated_gst_master (
  id UUID PRIMARY KEY,
  company_id UUID,
  hsn_code VARCHAR(32),
  description TEXT,
  gst_rate_percent DECIMAL(5,2) NOT NULL,
  gst_type VARCHAR(32) NOT NULL,
  is_export BOOLEAN DEFAULT false,
  gst_name VARCHAR(100),
  cgst_rate DECIMAL(5,2) DEFAULT 0,
  sgst_rate DECIMAL(5,2) DEFAULT 0,
  igst_rate DECIMAL(5,2) DEFAULT 0,
  effective_from DATE,
  effective_to DATE,
  gst_rate_id VARCHAR(50) UNIQUE,
  export_gst DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_gst_company_hsn UNIQUE(company_id, hsn_code)
);
```

**Indexes:**

- `idx_gst_hsn_lower` - On lower(hsn_code)
- `idx_gst_desc_trgm` - GIN trigram index on description
- `idx_gst_rate_id` - Unique on gst_rate_id where gst_rate_id IS NOT NULL

### product_gst_mapping

**Purpose:** Maps products to their applicable GST rates

```sql
CREATE TABLE product_gst_mapping (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  gst_master_id UUID NOT NULL,
  tax_code_id UUID,
  supply_type VARCHAR(50),
  cgst_rate DECIMAL(5,2),
  sgst_rate DECIMAL(5,2),
  igst_rate DECIMAL(5,2),
  effective_from DATE,
  effective_to DATE,
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES product_master(id),
  FOREIGN KEY (gst_master_id) REFERENCES consolidated_gst_master(id),
  CONSTRAINT uq_product_gst_mapping UNIQUE(product_id, gst_master_id)
);
```

**Indexes:**

- `idx_product_gst_product` - On product_id
- `idx_product_gst_master` - On gst_master_id
- `idx_product_gst_active` - On is_active

### derivative_gst_mapping

**Purpose:** Maps derivatives to their GST rates based on processing state

```sql
CREATE TABLE derivative_gst_mapping (
  id UUID PRIMARY KEY,
  species_master_id UUID NOT NULL,
  derivative_master_id UUID,
  processing_state ENUM('RAW', 'PROCESSED'),
  gst_master_id UUID NOT NULL,
  hsn_code_override VARCHAR(10),
  effective_from DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,

  FOREIGN KEY (species_master_id) REFERENCES species_master(id),
  FOREIGN KEY (derivative_master_id) REFERENCES derivative_master(id),
  FOREIGN KEY (gst_master_id) REFERENCES consolidated_gst_master(id),
  CONSTRAINT uq_derivative_gst_mapping_species_derivative_state
    UNIQUE(species_master_id, derivative_master_id, processing_state)
);
```

### Data Flow

```
Product Creation
  ↓
Add to product_gst_mapping with GST rate
  ↓
GST rate comes from consolidated_gst_master
  ↓
HSN code determines GST rate
  ↓
Tax code linked for compliance reporting
```

---

## API Endpoints Reference

### Authentication Endpoints

All endpoints require active session. Session is stored in HTTP-only cookies.

```bash
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

### Master Data Endpoints

#### Tax Code Master

```bash
GET    /api/master/tax-code                 # List with pagination
GET    /api/master/tax-code/:id             # Get single record
POST   /api/master/tax-code                 # Create
PUT    /api/master/tax-code                 # Update
DELETE /api/master/tax-code/:id             # Delete (soft delete)

# Aliases (for backward compatibility)
GET    /api/master/tax-code-master
```

#### GST Master

```bash
GET    /api/master/gst-master               # List
GET    /api/master/gst-master/:id           # Get single
POST   /api/master/gst-master               # Create
PUT    /api/master/gst-master               # Update
DELETE /api/master/gst-master/:id           # Delete
```

#### Product GST Mapping

```bash
GET    /api/master/product-gst-mapping      # List
GET    /api/master/product-gst-mapping/:id  # Get single
POST   /api/master/product-gst-mapping      # Create
PUT    /api/master/product-gst-mapping      # Update
DELETE /api/master/product-gst-mapping/:id  # Delete
```

#### Derivative GST Mapping

```bash
GET    /api/master/derivative-gst-mapping   # List
GET    /api/master/derivative-gst-mapping/:id
POST   /api/master/derivative-gst-mapping   # Create
PUT    /api/master/derivative-gst-mapping   # Update
DELETE /api/master/derivative-gst-mapping/:id
```

### Sales Invoice Endpoints

```bash
GET    /api/sales/invoices                  # List invoices
GET    /api/sales/invoices/:id              # Get single invoice
POST   /api/sales/invoices                  # Create invoice
PUT    /api/sales/invoices/:id              # Update invoice
DELETE /api/sales/invoices/:id              # Delete invoice
GET    /api/sales/invoices/:id/details      # Get invoice with line items
```

### Accounting Endpoints

```bash
GET    /api/accounting/journal-entries      # List entries
POST   /api/accounting/journal-entries      # Create entry
GET    /api/accounting/gl-accounts          # List GL accounts
GET    /api/accounting/reports/ledger       # Ledger report
GET    /api/accounting/reports/trial-balance # Trial balance
```

---

## Database Schema

### Core Tables

#### users

```sql
- user_id (UUID, PK)
- username (VARCHAR)
- email (VARCHAR)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- is_active (BOOLEAN)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### sessions

```sql
- sid (VARCHAR, PK)
- user_id (UUID, FK)
- data (JSON)
- expires (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### role_master

```sql
- role_id (UUID, PK)
- role_name (VARCHAR)
- description (TEXT)
- permissions (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### company_master

```sql
- company_id (UUID, PK)
- company_name (VARCHAR)
- gstin (VARCHAR)
- registration_number (VARCHAR)
- address (TEXT)
- city (VARCHAR)
- state (VARCHAR)
- country (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### product_master

```sql
- product_id (UUID, PK)
- product_code (VARCHAR)
- product_name (VARCHAR)
- description (TEXT)
- unit_id (UUID, FK)
- category_id (UUID, FK)
- hsn_code (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### customer_master

```sql
- customer_id (UUID, PK)
- customer_code (VARCHAR)
- customer_name (VARCHAR)
- gstin (VARCHAR)
- address (TEXT)
- contact_person (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## Migration Management

### Current Migrations

All GST-related migrations have been consolidated into a single, idempotent migration:

**File:** `migrations/20260320000001-fix-gst-consolidation-idempotent.js`

This migration:

- ✅ Checks if tables exist before creating
- ✅ Checks if constraints exist before adding
- ✅ Gracefully handles existing database state
- ✅ Supports running multiple times safely

### Migration Execution

```bash
# Run pending migrations
npx sequelize db:migrate

# Undo last migration
npx sequelize db:migrate:undo

# Undo all migrations
npx sequelize db:migrate:undo:all

# List executed migrations
psql -U automatly -d seafood-erp -c "SELECT * FROM sequelizemeta ORDER BY name;"
```

### Creating New Migrations

```bash
npx sequelize migration:generate --name add-new-field-to-table

# Edit migrations/YYYYMMDDHHMM-add-new-field-to-table.js
# Then run:
npx sequelize db:migrate
```

---

## Sales Invoice System

### Invoice Generation Flow

```
1. Customer places order
   ↓
2. Order is created in sales_orders
   ↓
3. Invoice is generated from order
   ↓
4. Line items are created with GST calculations
   ↓
5. Tax amounts calculated based on tax_code_master
   ↓
6. Journal entries created for accounting
   ↓
7. Invoice status: Draft → Confirmed → Billed
   ↓
8. Payment tracked and reconciled
```

### Invoice Status Flow

```
Draft
  ↓ (Confirm)
Confirmed
  ↓ (Generate)
Billed
  ↓ (Payment)
Paid
  ↓ (Reconcile)
Reconciled
```

### Tax Calculation in Invoices

For each line item:

1. Look up product in product_gst_mapping
2. Get GST rate from consolidated_gst_master
3. Get tax details from tax_code_master
4. Calculate:
   - Line amount = quantity × unit_price
   - Tax amount = line_amount × (tax_rate / 100)
   - Total = line_amount + tax_amount

### Example Invoice Calculation

```
Product: Breaded Seafood (TC_16055100_DOM)
Quantity: 100 kg
Unit Price: ₹500/kg

Line Amount: 100 × 500 = ₹50,000

Tax Lookup:
- Tax Code: TC_16055100_DOM (GST 5%)
- HSN Code: 1605
- CGST Rate: 2.5%
- SGST Rate: 2.5%

CGST: ₹50,000 × 2.5% = ₹1,250
SGST: ₹50,000 × 2.5% = ₹1,250

Total Invoice Amount: ₹50,000 + ₹1,250 + ₹1,250 = ₹52,500
```

---

## Accounting Integration

### Journal Entry Creation

When an invoice is confirmed, automatic journal entries are created:

```
Journal Entry for Sales Invoice:
  Debit: Accounts Receivable (Customer account)     ₹52,500
    Credit: Sales Revenue (GL account)              ₹50,000
    Credit: CGST Payable (from ledger_cgst_id)      ₹1,250
    Credit: SGST Payable (from ledger_sgst_id)      ₹1,250

Narration: Sales Invoice INV-001
```

### GL Account Mapping

In tax_code_master:

- `ledger_cgst_id` - GL account for CGST taxes
- `ledger_sgst_id` - GL account for SGST taxes
- `ledger_igst_id` - GL account for IGST taxes (inter-state)

### Accounting Reports

Available reports:

- **Trial Balance** - All GL accounts with balances
- **Ledger Report** - Detailed transactions by account
- **Tax Report** - Tax collection and payment tracking
- **Profit & Loss** - Revenue and expense analysis
- **Balance Sheet** - Assets, liabilities, equity

---

## Testing & Verification

### Database Verification

```bash
# Check tax codes exist
psql -U automatly -d seafood-erp -c "
  SELECT COUNT(*) as total_records,
         COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_records
  FROM tax_code_master;
"

# Check GST master records
psql -U automatly -d seafood-erp -c "
  SELECT gst_rate_id, gst_name, cgst_rate, sgst_rate
  FROM consolidated_gst_master
  WHERE is_active = true
  LIMIT 10;
"

# Verify product GST mappings
psql -U automatly -d seafood-erp -c "
  SELECT p.product_code, g.gst_name, m.is_active
  FROM product_gst_mapping m
  JOIN product_master p ON m.product_id = p.product_id
  JOIN consolidated_gst_master g ON m.gst_master_id = g.id
  LIMIT 10;
"
```

### API Testing

```bash
# Test tax code endpoint
curl -X GET \
  "http://127.0.0.1:3000/api/master/tax-code?draw=1&start=0&length=10" \
  -H "Cookie: sessionId=your_session_id" \
  -H "Content-Type: application/json"

# Expected Response (200 OK):
{
  "success": true,
  "message": "Tax codes retrieved successfully",
  "recordsTotal": 44,
  "recordsFiltered": 44,
  "data": [...]
}
```

### Postman Collection

Sample requests are available in `postman_collection_sales_workflow.json`

Import into Postman:

1. Open Postman
2. Click "Import"
3. Select the JSON file
4. All test endpoints are pre-configured

---

## Troubleshooting Guide

### Issue: 404 Not Found on /api/master/tax-code-master

**Solution:**

- Route is registered as `/api/master/tax-code`
- Both URLs now work (with alias):
  - ✅ `/api/master/tax-code`
  - ✅ `/api/master/tax-code-master` (backward compatibility)
- Verify server is running and restarted after route changes

### Issue: No Data Returned from Tax Code Endpoint

**Cause:** Handler was looking for `result.rows` instead of `result.data`

**Solution:** Already fixed in version 1.0.1

- File: `/src/routes/tax_code_master/handlers/get_all.js`
- Line 10: Changed `data: result.rows` → `data: result.data`
- Restart server: `npm start`

### Issue: Database Connection Error

**Solution:**

```bash
# Verify database credentials
cat .env | grep DB_

# Test connection
psql -U automatly -d seafood-erp -c "SELECT 1;"

# If connection fails:
1. Check PostgreSQL is running
2. Verify credentials in .env
3. Ensure database exists
```

### Issue: Migration Failed - Constraint Already Exists

**Solution:**

- This is expected if migrations were run before
- The new idempotent migration (20260320000001) handles this
- It checks if constraints/tables exist before creating
- Run: `npx sequelize db:migrate`

### Issue: Server Port Already in Use (EADDRINUSE :3000)

**Solution:**

```bash
# Kill existing Node processes
killall -9 node

# Or specify different port
PORT=3001 npm start

# Or check what's using port 3000
lsof -i :3000
```

### Issue: Tax Code Records Show in DB but Not in API

**Solution:**

1. Verify `is_active = true` for records:

   ```bash
   SELECT COUNT(*) FROM tax_code_master WHERE is_active = true;
   ```

2. Check API response format:
   - Response should have `data` array (not `rows`)
   - If empty, check session/authentication

3. Verify route is registered:
   ```bash
   curl http://127.0.0.1:3000/api/master/tax-code
   ```

### Common Error Messages

| Error                     | Cause               | Solution                                    |
| ------------------------- | ------------------- | ------------------------------------------- |
| 401 Unauthorized          | No valid session    | Login first, check cookie                   |
| 404 Not Found             | Route doesn't exist | Check route registration in routes/index.js |
| 500 Internal Server Error | Server error        | Check server logs, database connection      |
| 422 Unprocessable Entity  | Validation failed   | Check request body, required fields         |
| Connection refused        | Database down       | Start PostgreSQL                            |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Migrations tested on staging
- [ ] Environment variables configured
- [ ] Database backups taken
- [ ] SSL certificates updated
- [ ] API documentation updated

### Deployment Steps

```bash
# 1. Pull latest code
git pull origin add-accounts

# 2. Install dependencies
npm install

# 3. Run migrations
npx sequelize db:migrate

# 4. Start application
pm2 start npm --name "bse-mgmt" -- start

# 5. Verify application
curl http://localhost:3000/api/master/tax-code

# 6. Check logs
pm2 logs bse-mgmt
```

### Post-Deployment

- [ ] Smoke tests passed
- [ ] API endpoints responding
- [ ] Database connectivity confirmed
- [ ] All migrations executed
- [ ] No errors in application logs
- [ ] Session storage working
- [ ] Authentication verified

### Rollback Plan

```bash
# If deployment fails:

# 1. Undo migrations (if needed)
npx sequelize db:migrate:undo

# 2. Revert to previous code
git checkout previous_branch

# 3. Restart application
pm2 restart bse-mgmt

# 4. Verify rollback
curl http://localhost:3000/api/master/tax-code
```

---

## Key Files Reference

### Routes

- `/src/routes/index.js` - Route registration
- `/src/routes/tax_code_master/` - Tax code routes
- `/src/routes/sales/` - Sales invoice routes

### Controllers

- `/src/controllers/tax_code_master.js` - Tax code business logic
- `/src/controllers/consolidated_gst_master.js` - GST logic
- `/src/controllers/sales_allocation.js` - Invoice logic

### Models

- `/models/tax_code_master.js` - Tax code model
- `/models/consolidated_gst_master.js` - GST model
- `/models/product_gst_mapping.js` - Product GST model

### Migrations

- `/migrations/20260320000001-fix-gst-consolidation-idempotent.js` - GST tables

### Configuration

- `/config/config.js` - Database config
- `.env` - Environment variables
- `/babel.config.js` - Babel configuration
- `/nodemon.json` - Development hot reload

---

## Quick Reference Commands

```bash
# Development
npm install          # Install dependencies
npm start           # Start server
npm run dev         # Start with hot reload (nodemon)

# Database
npx sequelize db:migrate              # Run migrations
npx sequelize db:migrate:undo         # Undo last migration
npx sequelize db:seed:all             # Run seeders
npx sequelize db:seed:undo:all        # Undo seeders

# Database Access
psql -U automatly -d seafood-erp      # Connect to DB

# Testing
curl http://127.0.0.1:3000/health     # Health check
curl http://127.0.0.1:3000/api/master/tax-code  # Test API

# Process Management
ps aux | grep node                     # List node processes
killall -9 node                        # Kill all node processes
pm2 start npm --name "app" -- start   # Start with PM2
```

---

## Version History

### v1.0.2 (Current - March 12, 2026)

- ✅ Fixed tax code data not showing (result.rows → result.data)
- ✅ Added route alias for /tax-code-master
- ✅ Idempotent GST migrations
- ✅ All 44 tax codes displaying correctly

### v1.0.1

- ✅ Consolidated GST migrations (8 files → 1)
- ✅ Fixed database constraints conflicts
- ✅ Added comprehensive documentation

### v1.0.0

- ✅ Initial GST system implementation
- ✅ Tax code master created
- ✅ Product GST mapping

---

## Support & Contacts

**Developers:** ThiyagarajRKO  
**Repository:** https://github.com/ThiyagarajRKO/bse-mgmt-system  
**Branch:** add-accounts  
**Last Updated:** March 12, 2026

---

**End of Documentation**
