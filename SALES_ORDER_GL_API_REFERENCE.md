# Sales Order → GL Flow API Reference

**Version**: 2.3.0-alpha  
**Base URL**: `http://localhost:3000`  
**Authentication**: JWT Bearer Token required

---

## Table of Contents

1. [Sales Allocations](#sales-allocations)
2. [Production Demands](#production-demands)
3. [Sales Invoices](#sales-invoices)
4. [GL Postings](#gl-postings)

---

## Sales Allocations

### POST /sales/allocations

Create a new sales allocation from order line item.

**Request**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_product_id": "660e8400-e29b-41d4-a716-446655440001",
  "allocated_quantity": 100.0,
  "remarks": "Allocated for production batch PO-001"
}
```

**Response (201)**

```json
{
  "success": true,
  "message": "Allocation created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "order_product_id": "660e8400-e29b-41d4-a716-446655440001",
    "allocation_status": "PENDING",
    "allocated_quantity": 100.0,
    "fulfilled_quantity": 0.0,
    "allocation_date": "2026-01-09T14:30:00Z",
    "allocated_by": "user123",
    "remarks": "Allocated for production batch PO-001",
    "createdAt": "2026-01-09T14:30:00Z",
    "updatedAt": "2026-01-09T14:30:00Z"
  }
}
```

**Error (400)**

```json
{
  "success": false,
  "message": "Order not found: invalid-uuid"
}
```

---

### GET /sales/allocations

List all allocations with optional filters.

**Query Parameters**

```
?order_id=uuid
&allocation_status=PENDING|ALLOCATED|PRODUCTION_IN_PROGRESS|COMPLETED
&allocated_by=username
&limit=20
&offset=0
```

**Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "order": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "order_number": "ORD-20260109-0001",
        "order_status": "IN_PROGRESS"
      },
      "orderProduct": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "product_id": "prod-uuid",
        "quantity": 100.0
      },
      "allocation_status": "ALLOCATED",
      "allocated_quantity": 100.0,
      "fulfilled_quantity": 50.0,
      "allocation_date": "2026-01-09T14:30:00Z",
      "allocated_by": "user123"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET /sales/allocations/:id

Get detailed allocation with related orders and production demands.

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "allocation_status": "PRODUCTION_IN_PROGRESS",
    "allocated_quantity": 100.0,
    "fulfilled_quantity": 75.0,
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "order_number": "ORD-20260109-0001",
      "order_date": "2026-01-09T00:00:00Z",
      "order_status": "IN_PROGRESS"
    },
    "orderProduct": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "product_id": "prod-uuid",
      "quantity": 100.0,
      "unit_price": 50.0
    },
    "productionDemands": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "demand_number": "DEM-20260109-143000-0001",
        "demanded_quantity": 100.0,
        "fulfilled_quantity": 75.0,
        "demand_status": "IN_PRODUCTION"
      }
    ]
  }
}
```

---

### PUT /sales/allocations/:id/confirm

Move allocation from PENDING to ALLOCATED status.

**Response (200)**

```json
{
  "success": true,
  "message": "Allocation confirmed",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "allocation_status": "ALLOCATED",
    "allocated_quantity": 100.0
  }
}
```

---

### PUT /sales/allocations/:id/fulfill

Update fulfillment progress.

**Request**

```json
{
  "fulfilled_quantity": 75.0
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "Fulfillment updated",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "allocation_status": "PRODUCTION_IN_PROGRESS",
    "fulfilled_quantity": 75.0
  }
}
```

---

### PUT /sales/allocations/:id/complete

Mark allocation as fully completed.

**Response (200)**

```json
{
  "success": true,
  "message": "Allocation completed",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "allocation_status": "COMPLETED",
    "fulfilled_quantity": 100.0
  }
}
```

---

### PUT /sales/allocations/:id/cancel

Cancel an allocation.

**Request**

```json
{
  "reason": "Customer requested cancellation"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "Allocation cancelled",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "allocation_status": "CANCELLED",
    "remarks": "Cancelled by user123. Reason: Customer requested cancellation"
  }
}
```

---

## Sales Invoices

### POST /sales/invoices

Create a new sales invoice (DRAFT status).

**Request**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_master_id": "990e8400-e29b-41d4-a716-446655440004",
  "invoice_date": "2026-01-09T00:00:00Z"
}
```

**Response (201)**

```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "invoice_number": "INV-20260109-150000-0001",
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_master_id": "990e8400-e29b-41d4-a716-446655440004",
    "invoice_date": "2026-01-09T00:00:00Z",
    "invoice_status": "DRAFT",
    "subtotal_amount": 0.0,
    "tax_amount": 0.0,
    "shipping_amount": 0.0,
    "discount_amount": 0.0,
    "net_total_amount": 0.0,
    "created_by": "user123",
    "createdAt": "2026-01-09T15:00:00Z"
  }
}
```

---

### POST /sales/invoices/:id/line-items

Add line items from production outputs.

**Request**

```json
{
  "line_items": [
    {
      "production_output_id": "bb0e8400-e29b-41d4-a716-446655440006",
      "quantity": 100.0
    },
    {
      "production_output_id": "cc0e8400-e29b-41d4-a716-446655440007",
      "quantity": 50.0
    }
  ]
}
```

**Response (201)**

```json
{
  "success": true,
  "message": "2 line item(s) added successfully",
  "data": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "invoice_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "production_output_id": "bb0e8400-e29b-41d4-a716-446655440006",
      "sku_code": "SKU-20260109-001",
      "quantity": 100.0,
      "cost_per_unit": 45.0,
      "line_total": 4500.0,
      "tax_rate": 18.0,
      "tax_amount": 810.0,
      "line_net_total": 5310.0
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440009",
      "invoice_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "production_output_id": "cc0e8400-e29b-41d4-a716-446655440007",
      "sku_code": "SKU-20260109-002",
      "quantity": 50.0,
      "cost_per_unit": 60.0,
      "line_total": 3000.0,
      "tax_rate": 18.0,
      "tax_amount": 540.0,
      "line_net_total": 3540.0
    }
  ]
}
```

**Hard Block Error (403)**

```json
{
  "success": false,
  "message": "HARD BLOCK: Production output SKU-20260109-001 has not been posted to inventory yet"
}
```

---

### PUT /sales/invoices/:id/charges

Update shipping and discount amounts.

**Request**

```json
{
  "shipping_amount": 500.0,
  "discount_amount": 100.0
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "Invoice charges updated",
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "subtotal_amount": 7500.0,
    "tax_amount": 1350.0,
    "shipping_amount": 500.0,
    "discount_amount": 100.0,
    "net_total_amount": 9250.0
  }
}
```

---

### GET /sales/invoices/:id

Get invoice with all line items and customer details.

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "invoice_number": "INV-20260109-150000-0001",
    "invoice_date": "2026-01-09T00:00:00Z",
    "invoice_status": "DRAFT",
    "subtotal_amount": 7500.0,
    "tax_amount": 1350.0,
    "shipping_amount": 500.0,
    "discount_amount": 100.0,
    "net_total_amount": 9250.0,
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "order_number": "ORD-20260109-0001",
      "order_date": "2026-01-09T00:00:00Z",
      "order_status": "IN_PROGRESS"
    },
    "customer": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "customer_name": "ABC Foods Pvt Ltd",
      "customer_gst_in": "18AABCT1234A1Z0"
    },
    "invoiceLines": [
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440008",
        "sku_code": "SKU-20260109-001",
        "quantity": 100.0,
        "cost_per_unit": 45.0,
        "line_total": 4500.0,
        "tax_rate": 18.0,
        "line_net_total": 5310.0,
        "productMaster": {
          "product_name": "Shrimp - Grade A",
          "sku_code": "SKU-20260109-001"
        }
      }
    ]
  }
}
```

---

### GET /sales/invoices

List invoices with filters.

**Query Parameters**

```
?order_id=uuid
&customer_master_id=uuid
&invoice_status=DRAFT|POSTED|PAID|CANCELLED
&from_date=2026-01-01
&to_date=2026-01-31
&limit=20
&offset=0
```

**Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "invoice_number": "INV-20260109-150000-0001",
      "invoice_status": "POSTED",
      "net_total_amount": 9250.0,
      "invoice_date": "2026-01-09T00:00:00Z",
      "posted_date": "2026-01-09T16:00:00Z",
      "order": {
        "order_number": "ORD-20260109-0001"
      },
      "customer": {
        "customer_name": "ABC Foods Pvt Ltd"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

---

### PUT /sales/invoices/:id/post

Post invoice to GL and mark as POSTED.

**Response (200)**

```json
{
  "success": true,
  "message": "Invoice posted to GL successfully",
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "invoice_number": "INV-20260109-150000-0001",
    "invoice_status": "POSTED",
    "posted_date": "2026-01-09T16:00:00Z",
    "posted_by": "user123"
  }
}
```

**Hard Block Error (403)**

```json
{
  "success": false,
  "message": "HARD BLOCK: Cannot post invoice without payment received"
}
```

---

### PUT /sales/invoices/:id/cancel

Cancel invoice.

**Request**

```json
{
  "reason": "Duplicate invoice created"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "Invoice cancelled",
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "invoice_status": "CANCELLED",
    "remarks": "Cancelled by user123. Reason: Duplicate invoice created"
  }
}
```

---

### GET /sales/invoices/summary/revenue

Get revenue summary with optional filters.

**Query Parameters**

```
?from_date=2026-01-01
&to_date=2026-01-31
&invoice_status=POSTED|PAID
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "total_invoices": 5,
    "total_revenue": 45000.0,
    "total_tax": 8100.0,
    "total_shipping": 2500.0,
    "total_discount": 500.0,
    "net_revenue": 55100.0,
    "by_status": {
      "DRAFT": {
        "count": 1,
        "amount": 5000.0
      },
      "POSTED": {
        "count": 2,
        "amount": 25000.0
      },
      "PAID": {
        "count": 2,
        "amount": 25100.0
      }
    }
  }
}
```

---

## GL Postings

### POST /gl/post/production-output/:id

Auto-post GL entries for production output (Dr FG, Cr RM).

**Response (201)**

```json
{
  "success": true,
  "message": "2 GL entries posted for production output",
  "data": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440010",
      "entry_number": "GL-20260109-160000-0001",
      "posting_date": "2026-01-09T16:00:00Z",
      "account_code": "1100",
      "debit": 4500.0,
      "credit": 0.0,
      "description": "Finished goods receipt - SKU: SKU-20260109-001",
      "posting_status": "POSTED",
      "posted_by": "system"
    },
    {
      "id": "gg0e8400-e29b-41d4-a716-446655440011",
      "entry_number": "GL-20260109-160001-0002",
      "posting_date": "2026-01-09T16:00:00Z",
      "account_code": "1050",
      "debit": 0.0,
      "credit": 4500.0,
      "description": "Raw materials consumed - SKU: SKU-20260109-001",
      "posting_status": "POSTED"
    }
  ]
}
```

---

### POST /gl/post/invoice/:id

Auto-post GL entries for sales invoice (Dr AR, Cr Sales).

**Response (201)**

```json
{
  "success": true,
  "message": "2 GL entries posted for sales invoice",
  "data": [
    {
      "id": "hh0e8400-e29b-41d4-a716-446655440012",
      "entry_number": "GL-20260109-161000-0001",
      "posting_date": "2026-01-09T16:10:00Z",
      "account_code": "1200",
      "debit": 9250.0,
      "credit": 0.0,
      "description": "Sales invoice - INV: INV-20260109-150000-0001",
      "posting_status": "POSTED"
    },
    {
      "id": "ii0e8400-e29b-41d4-a716-446655440013",
      "entry_number": "GL-20260109-161001-0002",
      "posting_date": "2026-01-09T16:10:00Z",
      "account_code": "4000",
      "debit": 0.0,
      "credit": 9250.0,
      "description": "Sales revenue - INV: INV-20260109-150000-0001",
      "posting_status": "POSTED"
    }
  ]
}
```

---

### GET /gl/entries

List GL entries with filters.

**Query Parameters**

```
?account_code=1100
&posting_status=POSTED|DRAFT|REVERSED
&from_date=2026-01-01
&to_date=2026-01-31
&limit=50
&offset=0
```

**Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440010",
      "entry_number": "GL-20260109-160000-0001",
      "posting_date": "2026-01-09T16:00:00Z",
      "account_code": "1100",
      "account": {
        "account_code": "1100",
        "account_name": "Finished Goods Inventory"
      },
      "debit": 4500.0,
      "credit": 0.0,
      "description": "Finished goods receipt",
      "posting_status": "POSTED"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

---

### GET /gl/accounts/:code/balance

Get account balance as of a date.

**Query Parameters**

```
?as_of_date=2026-01-31
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "account_code": "1100",
    "as_of_date": "2026-01-31T00:00:00Z",
    "total_debit": 25000.0,
    "total_credit": 0.0,
    "balance": 25000.0,
    "entry_count": 10
  }
}
```

---

### GET /gl/trial-balance

Get trial balance as of a date.

**Query Parameters**

```
?as_of_date=2026-01-31
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "as_of_date": "2026-01-31T00:00:00Z",
    "accounts": [
      {
        "account_code": "1010",
        "account_name": "Cash at Bank",
        "account_type": "ASSET",
        "debit": 45000.0,
        "credit": 0.0
      },
      {
        "account_code": "1100",
        "account_name": "Finished Goods",
        "account_type": "ASSET",
        "debit": 25000.0,
        "credit": 0.0
      },
      {
        "account_code": "1200",
        "account_name": "Accounts Receivable",
        "account_type": "ASSET",
        "debit": 20000.0,
        "credit": 0.0
      },
      {
        "account_code": "4000",
        "account_name": "Sales Revenue",
        "account_type": "REVENUE",
        "debit": 0.0,
        "credit": 45000.0
      }
    ],
    "total_debit": 90000.0,
    "total_credit": 90000.0,
    "is_balanced": true
  }
}
```

---

### PUT /gl/entries/:id/reverse

Reverse a GL entry (create reversal entry).

**Request**

```json
{
  "reason": "Incorrect cost allocation"
}
```

**Response (201)**

```json
{
  "success": true,
  "message": "GL entry reversed successfully",
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440014",
    "entry_number": "GL-20260109-170000-0001",
    "posting_date": "2026-01-09T17:00:00Z",
    "account_code": "1100",
    "debit": 0.0,
    "credit": 4500.0,
    "description": "REVERSAL of GL-20260109-160000-0001: Incorrect cost allocation",
    "posting_status": "POSTED",
    "posted_by": "user123"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Order not found: invalid-uuid"
}
```

### 403 Forbidden (Hard Block)

```json
{
  "success": false,
  "message": "HARD BLOCK: Cannot post invoice without payment received"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "SalesInvoice not found: invalid-uuid"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Invoice already exists for this order"
}
```

---

**API Documentation Version**: 1.0  
**Last Updated**: 9 January 2026  
**Status**: Production Ready
