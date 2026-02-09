"use strict";

const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const {
  CheckInventory,
} = require("../src/routes/orders/handlers/check_inventory");

class SalesAllocationService {
  /**
   * Allocate order line items to production
   * @param {Object} allocationData - { order_id, order_product_id, allocated_quantity, allocated_by }
   * @returns {Promise<Object>} Created allocation record
   */
  async allocateOrderLine(allocationData) {
    const { order_id, order_product_id, allocated_quantity, allocated_by } =
      allocationData;

    // Validate input
    if (
      !order_id ||
      !order_product_id ||
      !allocated_quantity ||
      !allocated_by
    ) {
      throw new Error(
        "Missing required fields: order_id, order_product_id, allocated_quantity, allocated_by",
      );
    }

    if (allocated_quantity <= 0) {
      throw new Error("Allocated quantity must be greater than 0");
    }

    // Verify order and order_product exist
    const order = await db.Orders.findByPk(order_id);
    if (!order) {
      throw new Error(`Order not found: ${order_id}`);
    }

    const orderProduct = await db.OrderProducts.findByPk(order_product_id);
    if (!orderProduct) {
      throw new Error(`OrderProduct not found: ${order_product_id}`);
    }

    if (orderProduct.order_id !== order_id) {
      throw new Error("OrderProduct does not belong to the specified Order");
    }

    // Validate allocated quantity doesn't exceed order line quantity
    if (allocated_quantity > orderProduct.quantity) {
      throw new Error(
        `Allocated quantity (${allocated_quantity}) exceeds order line quantity (${orderProduct.quantity})`,
      );
    }

    // Check if allocation already exists for this line
    const existingAllocation = await db.SalesAllocation.findOne({
      where: {
        order_id,
        order_product_id,
        allocation_status: ["PENDING", "ALLOCATED", "PRODUCTION_IN_PROGRESS"],
      },
    });

    if (existingAllocation) {
      throw new Error(
        `Active allocation already exists for this order line. Current status: ${existingAllocation.allocation_status}`,
      );
    }

    // Check inventory availability to determine allocation status
    console.log(
      `🔍 Checking inventory for allocation: order_product_id=${order_product_id}, quantity=${allocated_quantity}`,
    );
    const inventoryCheck = await CheckInventory(
      {
        order_product_id,
        required_quantity: allocated_quantity,
      },
      null, // session
      null, // fastify
    );

    console.log(`📊 Inventory check result:`, {
      available_quantity: inventoryCheck.available_quantity,
      effective_available_quantity: inventoryCheck.effective_available_quantity,
      required_quantity: allocated_quantity,
      allocationStatus: inventoryCheck.allocationStatus,
    });

    // Determine allocation status based on inventory check
    let allocationStatus = "PENDING"; // Default
    if (inventoryCheck.allocationStatus === "ALLOCATED") {
      allocationStatus = "ALLOCATED";
      console.log(
        `✅ Setting allocation status to ALLOCATED - sufficient inventory`,
      );
    } else if (inventoryCheck.allocationStatus === "PENDING_PURCHASE") {
      allocationStatus = "PENDING_PURCHASE";
      console.log(
        `⏳ Setting allocation status to PENDING_PURCHASE - insufficient inventory, purchase needed`,
      );
    }

    // Create allocation record
    const allocation = await db.SalesAllocation.create({
      id: uuidv4(),
      order_id,
      order_product_id,
      allocated_quantity,
      ordered_quantity: orderProduct.quantity, // Add ordered_quantity from order product
      fulfilled_quantity: 0,
      allocation_status: allocationStatus,
      allocation_date: new Date(),
      allocated_by,
    });

    return allocation;
  }

  /**
   * Mark allocation as allocated (ready for production)
   * @param {string} allocationId - Allocation ID
   * @param {string} allocated_by - User performing the action
   * @returns {Promise<Object>} Updated allocation
   */
  async confirmAllocation(allocationId, allocated_by) {
    const allocation = await db.SalesAllocation.findByPk(allocationId);

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    if (allocation.allocation_status !== "PENDING") {
      throw new Error(
        `Cannot confirm allocation in ${allocation.allocation_status} status`,
      );
    }

    // Check inventory before confirming allocation
    console.log(
      `🔍 Checking inventory before confirming allocation: ${allocationId}, quantity=${allocation.allocated_quantity}`,
    );
    const inventoryCheck = await CheckInventory(
      {
        order_product_id: allocation.order_product_id,
        required_quantity: allocation.allocated_quantity,
      },
      null, // session
      null, // fastify
    );

    console.log(`📊 Inventory check result for confirmation:`, {
      available_quantity: inventoryCheck.available_quantity,
      effective_available_quantity: inventoryCheck.effective_available_quantity,
      required_quantity: allocation.allocated_quantity,
      allocationStatus: inventoryCheck.allocationStatus,
    });

    if (inventoryCheck.allocationStatus !== "ALLOCATED") {
      throw new Error(
        `Cannot confirm allocation: insufficient inventory. Required: ${allocation.allocated_quantity}, Effective available: ${inventoryCheck.effective_available_quantity}`,
      );
    }

    allocation.allocation_status = "ALLOCATED";
    allocation.allocated_by = allocated_by;
    await allocation.save();

    // Check if all allocations for this order are now ALLOCATED
    const allAllocations = await db.SalesAllocation.findAll({
      where: { order_id: allocation.order_id },
    });

    const allAllocated = allAllocations.every(
      (alloc) => alloc.allocation_status === "ALLOCATED",
    );

    // Update order status to ALLOCATED only if all allocations are confirmed
    if (allAllocated) {
      const order = await db.Order.findByPk(allocation.order_id);
      if (order && order.order_status === "CONFIRMED") {
        await order.update({
          order_status: "ALLOCATED",
          updated_by: allocated_by,
        });
      }
    }

    return allocation;
  }

  /**
   * Update fulfillment progress on allocation
   * @param {string} allocationId - Allocation ID
   * @param {number} fulfilledQty - Quantity fulfilled
   * @param {string} updated_by - User performing the action
   * @returns {Promise<Object>} Updated allocation
   */
  async updateFulfillment(allocationId, fulfilledQty, updated_by) {
    const allocation = await db.SalesAllocation.findByPk(allocationId);

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    if (fulfilledQty < 0 || fulfilledQty > allocation.allocated_quantity) {
      throw new Error(
        `Fulfilled quantity (${fulfilledQty}) must be between 0 and allocated quantity (${allocation.allocated_quantity})`,
      );
    }

    allocation.fulfilled_quantity = fulfilledQty;

    // Auto-update status based on fulfillment
    if (fulfilledQty === 0) {
      allocation.allocation_status = "ALLOCATED";
      allocation.action_required = null;
    } else if (fulfilledQty < allocation.allocated_quantity) {
      allocation.allocation_status = "PRODUCTION_IN_PROGRESS";
      allocation.action_required = null;
    } else if (fulfilledQty === allocation.allocated_quantity) {
      allocation.allocation_status = "COMPLETED";
      allocation.action_required = "DISPATCH";
    }

    await allocation.save();
    return allocation;
  }

  /**
   * Complete an allocation
   * @param {string} allocationId - Allocation ID
   * @param {string} completed_by - User performing the action
   * @returns {Promise<Object>} Updated allocation
   */
  async completeAllocation(allocationId, completed_by) {
    const allocation = await db.SalesAllocation.findByPk(allocationId);

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    if (allocation.fulfilled_quantity !== allocation.allocated_quantity) {
      throw new Error(
        `Cannot complete allocation. Fulfilled (${allocation.fulfilled_quantity}) does not match allocated (${allocation.allocated_quantity})`,
      );
    }

    allocation.allocation_status = "COMPLETED";
    allocation.action_required = "DISPATCH";
    await allocation.save();

    return allocation;
  }

  /**
   * Get allocation with details (includes order, order_product, production_demands)
   * @param {string} allocationId - Allocation ID
   * @returns {Promise<Object>} Allocation with related data
   */
  async getAllocationDetails(allocationId) {
    const allocation = await db.SalesAllocation.findByPk(allocationId, {
      include: [
        {
          model: db.Order,
          as: "order",
          attributes: ["id", "order_no", "order_date", "order_status"],
        },
        {
          model: db.OrderProduct,
          as: "orderProduct",
          attributes: ["id", "product_id", "quantity", "unit_price"],
        },
        {
          model: db.ProductionDemand,
          as: "productionDemands",
          attributes: [
            "id",
            "demand_number",
            "demanded_quantity",
            "fulfilled_quantity",
            "demand_status",
          ],
        },
      ],
    });

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    return allocation;
  }

  /**
   * List allocations with filters
   * @param {Object} filters - { order_id, allocation_status, allocated_by }
   * @param {number} limit - Results per page (default 20)
   * @param {number} offset - Pagination offset (default 0)
   * @returns {Promise<Array>} List of allocations
   */
  async listAllocations(filters = {}, limit = 20, offset = 0) {
    const where = {};

    if (filters.order_id) where.order_id = filters.order_id;
    if (filters.allocation_status)
      where.allocation_status = filters.allocation_status;
    if (filters.allocated_by) where.allocated_by = filters.allocated_by;

    const allocations = await db.SalesAllocation.findAll({
      where,
      include: [
        {
          model: db.Order,
          as: "order",
          attributes: ["id", "order_no", "order_status"],
        },
        {
          model: db.OrderProduct,
          as: "orderProduct",
          attributes: ["id", "product_id", "quantity"],
        },
      ],
      limit,
      offset,
      order: [["allocation_date", "DESC"]],
    });

    return allocations;
  }

  /**
   * Get allocation status summary for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Summary with counts by status
   */
  async getOrderAllocationSummary(orderId) {
    const order = await db.Order.findByPk(orderId, {
      include: [
        {
          model: db.OrderProduct,
          as: "orderProducts",
        },
      ],
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const allocations = await db.SalesAllocation.findAll({
      where: { order_id: orderId },
    });

    const summary = {
      order_id: orderId,
      order_no: order.order_no,
      total_order_lines: order.orderProducts.length,
      total_order_quantity: order.orderProducts.reduce(
        (sum, op) => sum + parseFloat(op.quantity || 0),
        0,
      ),
      allocations: {
        PENDING: 0,
        ALLOCATED: 0,
        PRODUCTION_IN_PROGRESS: 0,
        COMPLETED: 0,
      },
      total_allocated_quantity: 0,
      total_fulfilled_quantity: 0,
      allocation_percentage: 0,
      fulfillment_percentage: 0,
    };

    allocations.forEach((alloc) => {
      summary.allocations[alloc.allocation_status]++;
      summary.total_allocated_quantity += parseFloat(
        alloc.allocated_quantity || 0,
      );
      summary.total_fulfilled_quantity += parseFloat(
        alloc.fulfilled_quantity || 0,
      );
    });

    summary.allocation_percentage = (
      (summary.total_allocated_quantity / summary.total_order_quantity) *
      100
    ).toFixed(2);
    summary.fulfillment_percentage = (
      (summary.total_fulfilled_quantity / summary.total_allocated_quantity) *
      100
    ).toFixed(2);

    return summary;
  }

  /**
   * Cancel an allocation
   * @param {string} allocationId - Allocation ID
   * @param {string} cancelled_by - User performing the action
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated allocation
   */
  async cancelAllocation(allocationId, cancelled_by, reason) {
    const allocation = await db.SalesAllocation.findByPk(allocationId);

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    // Check if related production demands exist
    const relatedDemands = await db.ProductionDemand.findAll({
      where: {
        sales_allocation_id: allocationId,
        demand_status: ["CREATED", "WAITING_FOR_PRODUCTION", "IN_PRODUCTION"],
      },
    });

    if (relatedDemands.length > 0) {
      throw new Error(
        `Cannot cancel allocation with active production demands (${relatedDemands.length} found)`,
      );
    }

    allocation.allocation_status = "CANCELLED";
    allocation.remarks = `Cancelled by ${cancelled_by}. Reason: ${reason}`;
    await allocation.save();

    return allocation;
  }

  /**
   * Dispatch an allocation
   * @param {string} allocationId - Allocation ID
   * @param {string} dispatchedBy - User who dispatched
   * @param {string} remarks - Dispatch remarks
   * @returns {Promise<Object>} Updated allocation
   */
  async dispatchAllocation(allocationId, dispatchedBy, remarks = "") {
    const allocation = await db.SalesAllocation.findByPk(allocationId, {
      include: [{ model: db.OrderProducts, as: "orderProduct" }],
    });

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    if (allocation.action_required !== "DISPATCH") {
      throw new Error(`Allocation ${allocationId} is not ready for dispatch`);
    }

    // Get product master ID and quantity to dispatch
    const productMasterId = allocation.orderProduct?.product_master_id;
    const dispatchQuantity = allocation.allocated_quantity;

    if (!productMasterId) {
      throw new Error(
        `Product master ID not found for allocation ${allocationId}`,
      );
    }

    // Reduce sales inventory
    const InventoryCheckService = require("./InventoryCheckService");
    await InventoryCheckService.reduceSalesInventory(
      productMasterId,
      dispatchQuantity,
      allocation.order_id,
    );

    // Update order delivery status to dispatched
    await db.Orders.update(
      { delivery_status: "DISPATCHED" },
      { where: { id: allocation.order_id } },
    );

    allocation.allocation_status = "COMPLETED";
    allocation.remarks = `Dispatched by ${dispatchedBy}. ${remarks}`.trim();
    await allocation.save();

    return allocation;
  }

  /**
   * Begin production for an allocation
   * @param {string} allocationId - Allocation ID
   * @param {string} startedBy - User who started production
   * @param {Object} productionData - Production details
   * @returns {Promise<Object>} Updated allocation and production order
   */
  async beginProduction(allocationId, startedBy, productionData = {}) {
    const allocation = await db.SalesAllocation.findByPk(allocationId, {
      include: [
        { model: db.Order, as: "order" },
        { model: db.OrderProducts, as: "orderProduct" },
      ],
    });

    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    if (allocation.action_required !== "BEGIN_PRODUCTION") {
      throw new Error(`Allocation ${allocationId} is not ready for production`);
    }

    // Create production order
    const productionOrder = await db.ProductionOrders.create({
      order_id: allocation.order_id,
      sales_allocation_id: allocation.id,
      order_product_id: allocation.order_product_id,
      product_master_id: allocation.orderProduct?.product_master_id,
      planned_quantity: allocation.allocated_quantity,
      expected_yield_quantity:
        productionData.expected_yield || allocation.allocated_quantity,
      production_status: "IN_PRODUCTION",
      production_notes: productionData.production_notes || "",
      started_by: startedBy,
      started_at: new Date(),
    });

    allocation.allocation_status = "PRODUCTION_IN_PROGRESS";
    allocation.remarks =
      `Production started by ${startedBy}. ${productionData.production_notes || ""}`.trim();
    await allocation.save();

    return {
      allocation,
      productionOrder,
    };
  }

  /**
   * Raise purchase request for an allocation
   * @param {string} allocationId - Allocation ID
   * @param {string} requestedBy - User who requested purchase
   * @param {string} remarks - Purchase request remarks
   * @returns {Promise<Object>} Updated allocation and purchase requests
   */
  async raisePurchaseRequest(allocationId, requestedBy, remarks = "") {
    const allocation = await db.SalesAllocation.findByPk(allocationId);
    if (!allocation) {
      throw new Error(`Allocation not found: ${allocationId}`);
    }

    if (allocation.action_required !== "RAISE_PURCHASE_REQUEST") {
      throw new Error(
        `Allocation ${allocationId} does not require purchase request`,
      );
    }

    // Get purchase requests for this allocation/order
    const PurchaseRequestService = require("./PurchaseRequestService");
    const purchaseRequests =
      await PurchaseRequestService.getPurchaseRequestsForOrder(
        allocation.order_id,
      );

    allocation.allocation_status = "COMPLETED";
    allocation.remarks =
      `Purchase request raised by ${requestedBy}. ${remarks}`.trim();
    await allocation.save();

    return {
      allocation,
      purchaseRequests,
    };
  }
}

module.exports = new SalesAllocationService();
