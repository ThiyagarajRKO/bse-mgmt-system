/**
 * Sales Order → GL Flow Frontend Service
 *
 * Extends existing allocation functionality with:
 * - Production demand creation
 * - Invoice generation
 * - GL posting & trial balance
 * - Workflow status tracking
 */

class SalesOrderGLFlowService {
  constructor() {
    this.baseURL = "/api";
    this.token = localStorage.getItem("authToken");
  }

  // ===== ALLOCATION EXTENDED FEATURES =====

  /**
   * Get complete order allocation summary with demands and invoices
   */
  async getOrderWorkflowSummary(orderId) {
    try {
      const response = await fetch(
        `${this.baseURL}/sales/orders/${orderId}/allocation-summary`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching order workflow summary:", error);
      throw error;
    }
  }

  /**
   * Create production demands from allocation
   */
  async createDemandsFromAllocation(allocationId, demandData) {
    try {
      const response = await fetch(
        `${this.baseURL}/sales/allocations/${allocationId}/create-demands`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(demandData),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error creating demands:", error);
      throw error;
    }
  }

  /**
   * Get production demands for an allocation
   */
  async getProductionDemands(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(
        `${this.baseURL}/production/demands?${params}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching demands:", error);
      throw error;
    }
  }

  // ===== INVOICE FEATURES =====

  /**
   * Create sales invoice
   */
  async createInvoice(invoiceData) {
    try {
      const response = await fetch(`${this.baseURL}/sales/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(invoiceData),
      });
      return await response.json();
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }

  /**
   * Add line items to invoice
   */
  async addInvoiceLineItems(invoiceId, lineItems) {
    try {
      const response = await fetch(
        `${this.baseURL}/sales/invoices/${invoiceId}/line-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ line_items: lineItems }),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error adding line items:", error);
      throw error;
    }
  }

  /**
   * Get invoice details with line items
   */
  async getInvoiceDetails(invoiceId) {
    try {
      const response = await fetch(
        `${this.baseURL}/sales/invoices/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }
  }

  /**
   * Update invoice charges (shipping, discount)
   */
  async updateInvoiceCharges(invoiceId, charges) {
    try {
      const response = await fetch(
        `${this.baseURL}/sales/invoices/${invoiceId}/charges`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(charges),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error updating charges:", error);
      throw error;
    }
  }

  /**
   * Post invoice to GL
   */
  async postInvoiceToGL(invoiceId, paymentData = {}) {
    try {
      const response = await fetch(
        `${this.baseURL}/sales/invoices/${invoiceId}/post`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error posting invoice to GL:", error);
      throw error;
    }
  }

  /**
   * List invoices with filters
   */
  async listInvoices(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${this.baseURL}/sales/invoices?${params}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error("Error listing invoices:", error);
      throw error;
    }
  }

  // ===== GL POSTING FEATURES =====

  /**
   * Get GL trial balance
   */
  async getTrialBalance() {
    try {
      const response = await fetch(`${this.baseURL}/gl/trial-balance`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching trial balance:", error);
      throw error;
    }
  }

  /**
   * Get GL entries with filters
   */
  async getGLEntries(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${this.baseURL}/gl/entries?${params}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching GL entries:", error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountCode) {
    try {
      const response = await fetch(
        `${this.baseURL}/gl/accounts/${accountCode}/balance`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching account balance:", error);
      throw error;
    }
  }

  /**
   * Reverse GL entry
   */
  async reverseGLEntry(entryId) {
    try {
      const response = await fetch(
        `${this.baseURL}/gl/entries/${entryId}/reverse`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({}),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error reversing GL entry:", error);
      throw error;
    }
  }

  // ===== WORKFLOW UTILITIES =====

  /**
   * Format currency for display
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Get status badge color
   */
  getStatusColor(status) {
    const colorMap = {
      DRAFT: "warning",
      PENDING: "info",
      ALLOCATED: "primary",
      POSTED: "success",
      PAID: "success",
      COMPLETED: "success",
      CANCELLED: "danger",
      REVERSED: "secondary",
    };
    return colorMap[status] || "secondary";
  }

  /**
   * Get workflow step status
   */
  getWorkflowStep(allocation, invoice, glPosting) {
    if (!allocation) return "Not Started";
    if (
      allocation.allocation_status === "COMPLETED" &&
      invoice &&
      invoice.invoice_status === "POSTED"
    ) {
      return glPosting ? "Complete" : "In GL Posting";
    }
    return allocation.allocation_status;
  }
}

// Export for global use
window.SalesOrderGLFlow = new SalesOrderGLFlowService();
