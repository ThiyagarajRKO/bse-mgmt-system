/**
 * Order Workflow Management Script
 * Handles all interactions and API calls for the order workflow interface
 */

class OrderWorkflowManager {
  constructor() {
    this.apiBaseUrl = "/api/v1";
    this.orders = [];
    this.allocations = [];
    this.productions = [];
    this.qaRecords = [];
    this.traceability = [];
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupEventListeners();
    this.loadAllData();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Create Order Modal
    document.getElementById("appendProducts")?.addEventListener("click", () => {
      this.addProductRow();
    });

    document.getElementById("submitOrder")?.addEventListener("click", () => {
      this.handleCreateOrder();
    });

    // Create Allocation Modal
    document
      .querySelector(
        "#createAllocationModal .modal-footer .btn-primary-workflow"
      )
      ?.addEventListener("click", () => {
        this.handleCreateAllocation();
      });

    // Create Production Modal
    document
      .querySelector(
        "#createProductionModal .modal-footer .btn-primary-workflow"
      )
      ?.addEventListener("click", () => {
        this.handleCreateProduction();
      });

    // Create QA Modal
    document
      .querySelector("#createQAModal .modal-footer .btn-primary-workflow")
      ?.addEventListener("click", () => {
        this.handleCreateQA();
      });

    // Create Traceability Modal
    document
      .querySelector(
        "#createTraceabilityModal .modal-footer .btn-primary-workflow"
      )
      ?.addEventListener("click", () => {
        this.handleCreateTraceability();
      });
  }

  /**
   * Load all workflow data from API
   */
  async loadAllData() {
    try {
      await Promise.all([
        this.loadOrders(),
        this.loadAllocations(),
        this.loadProductions(),
        this.loadQARecords(),
        this.loadTraceability(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      this.showAlert("Error loading data", "error");
    }
  }

  /**
   * Load sales orders from API
   */
  async loadOrders() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sales-orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.orders = data.data || [];
        this.renderOrders();
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  }

  /**
   * Load allocations from API
   */
  async loadAllocations() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/allocation`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.allocations = data.data || [];
        this.renderAllocations();
      }
    } catch (error) {
      console.error("Error loading allocations:", error);
    }
  }

  /**
   * Load production batches from API
   */
  async loadProductions() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/production`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.productions = data.data || [];
        this.renderProductions();
      }
    } catch (error) {
      console.error("Error loading productions:", error);
    }
  }

  /**
   * Load QA records from API
   */
  async loadQARecords() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/qa`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.qaRecords = data.data || [];
        this.renderQARecords();
      }
    } catch (error) {
      console.error("Error loading QA records:", error);
    }
  }

  /**
   * Load traceability records from API
   */
  async loadTraceability() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/traceability`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.traceability = data.data || [];
        this.renderTraceability();
      }
    } catch (error) {
      console.error("Error loading traceability:", error);
    }
  }

  /**
   * Create new order
   */
  async handleCreateOrder() {
    try {
      const customerId = document.getElementById("customerSelect")?.value;
      const shippingAddress = document.querySelector(
        "#createOrderModal textarea[placeholder='Enter shipping address']"
      )?.value;
      const remarks = document.querySelector(
        "#createOrderModal textarea[placeholder='Any special instructions or remarks']"
      )?.value;

      const products = this.getProductsFromForm();

      if (!customerId || !shippingAddress || products.length === 0) {
        this.showAlert("Please fill all required fields", "error");
        return;
      }

      const orderData = {
        customer_id: customerId,
        shipping_address: shippingAddress,
        remarks: remarks,
        order_items: products,
      };

      const response = await fetch(`${this.apiBaseUrl}/sales-orders/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        this.showAlert("Order created successfully!", "success");
        this.resetOrderForm();
        bootstrap.Modal.getInstance(
          document.getElementById("createOrderModal")
        ).hide();
        this.loadOrders();
      } else {
        const error = await response.json();
        this.showAlert(error.message || "Error creating order", "error");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      this.showAlert("Error creating order", "error");
    }
  }

  /**
   * Create new allocation
   */
  async handleCreateAllocation() {
    try {
      const orderId = document.getElementById("orderSelect")?.value;
      const quantity = document.querySelector(
        "#createAllocationModal input[placeholder='Enter quantity']"
      )?.value;

      if (!orderId || !quantity) {
        this.showAlert("Please fill all required fields", "error");
        return;
      }

      const allocationData = {
        order_id: orderId,
        quantity: parseInt(quantity),
      };

      const response = await fetch(`${this.apiBaseUrl}/allocation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(allocationData),
      });

      if (response.ok) {
        this.showAlert("Allocation created successfully!", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("createAllocationModal")
        ).hide();
        this.loadAllocations();
      } else {
        const error = await response.json();
        this.showAlert(error.message || "Error creating allocation", "error");
      }
    } catch (error) {
      console.error("Error creating allocation:", error);
      this.showAlert("Error creating allocation", "error");
    }
  }

  /**
   * Create new production batch
   */
  async handleCreateProduction() {
    try {
      const allocationId = document.getElementById("allocationSelect")?.value;
      const expectedYield = document.querySelector(
        "#createProductionModal input[placeholder='Expected yield']"
      )?.value;

      if (!allocationId || !expectedYield) {
        this.showAlert("Please fill all required fields", "error");
        return;
      }

      const productionData = {
        allocation_id: allocationId,
        expected_yield_qty: parseInt(expectedYield),
      };

      const response = await fetch(`${this.apiBaseUrl}/production`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productionData),
      });

      if (response.ok) {
        this.showAlert("Production batch started successfully!", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("createProductionModal")
        ).hide();
        this.loadProductions();
      } else {
        const error = await response.json();
        this.showAlert(error.message || "Error starting batch", "error");
      }
    } catch (error) {
      console.error("Error creating production:", error);
      this.showAlert("Error starting batch", "error");
    }
  }

  /**
   * Create new QA record
   */
  async handleCreateQA() {
    try {
      const batchId = document.getElementById("batchSelect")?.value;
      const testResult = document.getElementById("testResult")?.value;
      const remarks = document.querySelector(
        "#createQAModal textarea[placeholder='Enter test remarks']"
      )?.value;

      if (!batchId || !testResult) {
        this.showAlert("Please fill all required fields", "error");
        return;
      }

      const qaData = {
        batch_id: batchId,
        test_result: testResult.toUpperCase(),
        remarks: remarks,
      };

      const response = await fetch(`${this.apiBaseUrl}/qa`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qaData),
      });

      if (response.ok) {
        this.showAlert("QA record created successfully!", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("createQAModal")
        ).hide();
        this.loadQARecords();
      } else {
        const error = await response.json();
        this.showAlert(error.message || "Error creating QA record", "error");
      }
    } catch (error) {
      console.error("Error creating QA record:", error);
      this.showAlert("Error creating QA record", "error");
    }
  }

  /**
   * Create new traceability record
   */
  async handleCreateTraceability() {
    try {
      const batchId = document.getElementById("traceabilityBatchSelect")?.value;
      const weight = document.querySelector(
        "#createTraceabilityModal input[placeholder='Enter weight in kg']"
      )?.value;
      const remarks = document.querySelector(
        "#createTraceabilityModal textarea[placeholder='Any special remarks or notes']"
      )?.value;

      if (!batchId || !weight) {
        this.showAlert("Please fill all required fields", "error");
        return;
      }

      const traceabilityData = {
        batch_id: batchId,
        weight: parseFloat(weight),
        remarks: remarks,
      };

      const response = await fetch(`${this.apiBaseUrl}/traceability`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(traceabilityData),
      });

      if (response.ok) {
        this.showAlert("Carton created successfully!", "success");
        bootstrap.Modal.getInstance(
          document.getElementById("createTraceabilityModal")
        ).hide();
        this.loadTraceability();
      } else {
        const error = await response.json();
        this.showAlert(error.message || "Error creating carton", "error");
      }
    } catch (error) {
      console.error("Error creating traceability:", error);
      this.showAlert("Error creating carton", "error");
    }
  }

  /**
   * Render orders table
   */
  renderOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.orders
      .map(
        (order) => `
      <tr>
        <td>${order.order_id || "-"}</td>
        <td>${order.customer?.name || "Unknown"}</td>
        <td>₹ ${(order.total_amount || 0).toLocaleString()}</td>
        <td><span class="badge-status badge-${
          order.status?.toLowerCase().replace(/_/g, "-") || "draft"
        }">${order.status || "DRAFT"}</span></td>
        <td>${this.formatDate(order.createdAt)}</td>
        <td>
          <button class="btn-secondary-workflow btn-sm" title="View Details" onclick="workflowManager.viewOrder('${
            order.id
          }')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-secondary-workflow btn-sm" title="Edit" onclick="workflowManager.editOrder('${
            order.id
          }')">
            <i class="fas fa-edit"></i>
          </button>
          ${
            order.status === "DRAFT"
              ? `
            <button class="btn-primary-workflow btn-sm" title="Confirm" onclick="workflowManager.confirmOrder('${order.id}')">
              <i class="fas fa-check"></i>
            </button>
          `
              : ""
          }
        </td>
      </tr>
    `
      )
      .join("");

    if (this.orders.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No orders found</td></tr>';
    }
  }

  /**
   * Render allocations table
   */
  renderAllocations() {
    const tbody = document.getElementById("allocationsTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.allocations
      .map(
        (allocation) => `
      <tr>
        <td>${allocation.allocation_id || "-"}</td>
        <td>${allocation.order?.order_id || "-"}</td>
        <td>${allocation.product?.name || "N/A"}</td>
        <td>${allocation.quantity || 0} units</td>
        <td><span class="badge-status badge-allocated">${
          allocation.status || "ALLOCATED"
        }</span></td>
        <td>
          <button class="btn-secondary-workflow btn-sm" title="View" onclick="workflowManager.viewAllocation('${
            allocation.id
          }')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    if (this.allocations.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No allocations found</td></tr>';
    }
  }

  /**
   * Render productions table
   */
  renderProductions() {
    const tbody = document.getElementById("productionTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.productions
      .map(
        (batch) => `
      <tr>
        <td>${batch.batch_id || "-"}</td>
        <td>${batch.order?.order_id || "-"}</td>
        <td><span class="badge-status badge-in-production">${
          batch.batch_status || "IN_PRODUCTION"
        }</span></td>
        <td>${batch.actual_yield_qty || 0} units</td>
        <td>${this.formatDate(batch.start_date)}</td>
        <td>
          <button class="btn-secondary-workflow btn-sm" title="View" onclick="workflowManager.viewProduction('${
            batch.id
          }')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-primary-workflow btn-sm" title="Update" onclick="workflowManager.editProduction('${
            batch.id
          }')">
            <i class="fas fa-sync"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    if (this.productions.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No production batches found</td></tr>';
    }
  }

  /**
   * Render QA records table
   */
  renderQARecords() {
    const tbody = document.getElementById("qaTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.qaRecords
      .map(
        (qa) => `
      <tr>
        <td>${qa.qa_id || "-"}</td>
        <td>${qa.batch?.batch_id || "-"}</td>
        <td>${qa.test_result || "-"}</td>
        <td><span class="badge-status badge-${
          qa.test_result?.toLowerCase() === "passed" ? "shipped" : "qa"
        }">${qa.test_result || "PENDING"}</span></td>
        <td>${this.formatDate(qa.createdAt)}</td>
        <td>
          <button class="btn-secondary-workflow btn-sm" title="View" onclick="workflowManager.viewQA('${
            qa.id
          }')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    if (this.qaRecords.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No QA records found</td></tr>';
    }
  }

  /**
   * Render traceability records table
   */
  renderTraceability() {
    const tbody = document.getElementById("traceabilityTableBody");
    if (!tbody) return;

    tbody.innerHTML = this.traceability
      .map(
        (carton) => `
      <tr>
        <td>${carton.carton_id || "-"}</td>
        <td>${carton.batch?.batch_id || "-"}</td>
        <td>${carton.weight || 0} Kg</td>
        <td><span class="badge-status badge-${
          carton.seal_status?.toLowerCase() === "sealed" ? "shipped" : "qa"
        }">${carton.seal_status || "OPEN"}</span></td>
        <td>${this.formatDate(carton.createdAt)}</td>
        <td>
          <button class="btn-secondary-workflow btn-sm" title="View" onclick="workflowManager.viewTraceability('${
            carton.id
          }')">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    if (this.traceability.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No cartons found</td></tr>';
    }
  }

  /**
   * Get products from form
   */
  getProductsFromForm() {
    const products = [];
    const container = document.getElementById("productsContainer");
    const selects = container.querySelectorAll(".product-select");

    selects.forEach((select, index) => {
      const qtyInput = container.querySelectorAll(".product-qty")[index];
      if (select.value && qtyInput?.value) {
        products.push({
          product_id: select.value,
          quantity: parseInt(qtyInput.value),
        });
      }
    });

    return products;
  }

  /**
   * Add product row to form
   */
  addProductRow() {
    const container = document.getElementById("productsContainer");
    const rowIndex = container.children.length;

    const rowHTML = `
      <div style="margin-bottom: 15px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 30px; gap: 10px; align-items: end;">
          <div>
            <label class="form-label-workflow">Product *</label>
            <select class="form-control-workflow product-select">
              <option value="">Select Product</option>
              <option value="prod-1">Product A</option>
              <option value="prod-2">Product B</option>
              <option value="prod-3">Product C</option>
            </select>
          </div>
          <div>
            <label class="form-label-workflow">Quantity *</label>
            <input
              type="number"
              class="form-control-workflow product-qty"
              placeholder="Qty"
              min="1"
            />
          </div>
          <button type="button" class="btn-danger-workflow" onclick="this.parentElement.parentElement.remove();" style="padding: 8px 12px;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", rowHTML);
  }

  /**
   * Reset order form
   */
  resetOrderForm() {
    document.getElementById("customerSelect").value = "";
    document.querySelector(
      "#createOrderModal textarea[placeholder='Enter shipping address']"
    ).value = "";
    document.querySelector(
      "#createOrderModal textarea[placeholder='Any special instructions or remarks']"
    ).value = "";
    document.getElementById("productsContainer").innerHTML = "";
  }

  /**
   * View order details
   */
  viewOrder(orderId) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;

    alert(`Order Details:\n\nID: ${order.id}\nStatus: ${order.status}`);
  }

  /**
   * Edit order
   */
  editOrder(orderId) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order || order.status !== "DRAFT") {
      this.showAlert("Only draft orders can be edited", "error");
      return;
    }

    alert("Edit functionality would open a form");
  }

  /**
   * Confirm order
   */
  async confirmOrder(orderId) {
    if (!confirm("Are you sure you want to confirm this order?")) return;

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/sales-orders/${orderId}/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        this.showAlert("Order confirmed successfully!", "success");
        this.loadOrders();
      } else {
        const error = await response.json();
        this.showAlert(error.message || "Error confirming order", "error");
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      this.showAlert("Error confirming order", "error");
    }
  }

  /**
   * View allocation details
   */
  viewAllocation(allocationId) {
    const allocation = this.allocations.find((a) => a.id === allocationId);
    if (!allocation) return;

    alert(
      `Allocation Details:\n\nID: ${allocation.id}\nQuantity: ${allocation.quantity}`
    );
  }

  /**
   * View production details
   */
  viewProduction(batchId) {
    const batch = this.productions.find((b) => b.id === batchId);
    if (!batch) return;

    alert(
      `Production Details:\n\nID: ${batch.id}\nStatus: ${batch.batch_status}`
    );
  }

  /**
   * Edit production batch
   */
  editProduction(batchId) {
    alert("Edit production batch functionality");
  }

  /**
   * View QA record details
   */
  viewQA(qaId) {
    const qa = this.qaRecords.find((q) => q.id === qaId);
    if (!qa) return;

    alert(`QA Record Details:\n\nID: ${qa.id}\nResult: ${qa.test_result}`);
  }

  /**
   * View traceability details
   */
  viewTraceability(traceabilityId) {
    const trace = this.traceability.find((t) => t.id === traceabilityId);
    if (!trace) return;

    alert(`Carton Details:\n\nID: ${trace.id}\nWeight: ${trace.weight} Kg`);
  }

  /**
   * Show alert message
   */
  showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alertContainer");
    const alertId = `alert-${Date.now()}`;

    const alertHTML = `
      <div id="${alertId}" class="alert-workflow alert-${type}-workflow show" style="margin-bottom: 15px;">
        <strong>${
          type.charAt(0).toUpperCase() + type.slice(1)
        }:</strong> ${message}
      </div>
    `;

    alertContainer.insertAdjacentHTML("beforeend", alertHTML);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        alertElement.classList.remove("show");
        setTimeout(() => alertElement.remove(), 300);
      }
    }, 5000);

    // Also use toastr if available
    if (typeof toastr !== "undefined") {
      toastr[type](message);
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    // Get token from sessionStorage or localStorage
    return (
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("authToken") ||
      ""
    );
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

// Initialize the workflow manager when DOM is loaded
let workflowManager;
document.addEventListener("DOMContentLoaded", () => {
  workflowManager = new OrderWorkflowManager();

  // Refresh data periodically (every 30 seconds)
  setInterval(() => {
    workflowManager.loadAllData();
  }, 30000);
});
