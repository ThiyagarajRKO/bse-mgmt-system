"use strict";

const { v4: uuidv4 } = require("uuid");
const db = require("../models");

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
        "Missing required fields: order_id, order_product_id, allocated_quantity, allocated_by"
      );
    }

    if (allocated_quantity <= 0) {
      throw new Error("Allocated quantity must be greater than 0");
    }

    // Verify order and order_product exist
    const order = await db.Order.findByPk(order_id);
    if (!order) {
      throw new Error(`Order not found: ${order_id}`);
    }

    const orderProduct = await db.OrderProduct.findByPk(order_product_id);
    if (!orderProduct) {
      throw new Error(`OrderProduct not found: ${order_product_id}`);
    }

    if (orderProduct.order_id !== order_id) {
      throw new Error("OrderProduct does not belong to the specified Order");
    }

    // Validate allocated quantity doesn't exceed order line quantity
    if (allocated_quantity > orderProduct.quantity) {
      throw new Error(
        `Allocated quantity (${allocated_quantity}) exceeds order line quantity (${orderProduct.quantity})`
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
        `Active allocation already exists for this order line. Current status: ${existingAllocation.allocation_status}`
      );
    }

    // Create allocation record
    const allocation = await db.SalesAllocation.create({
      id: uuidv4(),
      order_id,
      order_product_id,
      allocated_quantity,
      fulfilled_quantity: 0,
      allocation_status: "PENDING",
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
        `Cannot confirm allocation in ${allocation.allocation_status} status`
      );
    }

    allocation.allocation_status = "ALLOCATED";
    allocation.allocated_by = allocated_by;
    await allocation.save();

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
        `Fulfilled quantity (${fulfilledQty}) must be between 0 and allocated quantity (${allocation.allocated_quantity})`
      );
    }

    allocation.fulfilled_quantity = fulfilledQty;

    // Auto-update status based on fulfillment
    if (fulfilledQty === 0) {
      allocation.allocation_status = "ALLOCATED";
    } else if (fulfilledQty < allocation.allocated_quantity) {
      allocation.allocation_status = "PRODUCTION_IN_PROGRESS";
    } else if (fulfilledQty === allocation.allocated_quantity) {
      allocation.allocation_status = "COMPLETED";
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
        `Cannot complete allocation. Fulfilled (${allocation.fulfilled_quantity}) does not match allocated (${allocation.allocated_quantity})`
      );
    }

    allocation.allocation_status = "COMPLETED";
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
          attributes: ["id", "order_number", "order_date", "order_status"],
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
          attributes: ["id", "order_number", "order_status"],
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
      order_number: order.order_number,
      total_order_lines: order.orderProducts.length,
      total_order_quantity: order.orderProducts.reduce(
        (sum, op) => sum + parseFloat(op.quantity || 0),
        0
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
        alloc.allocated_quantity || 0
      );
      summary.total_fulfilled_quantity += parseFloat(
        alloc.fulfilled_quantity || 0
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
        `Cannot cancel allocation with active production demands (${relatedDemands.length} found)`
      );
    }

    allocation.allocation_status = "CANCELLED";
    allocation.remarks = `Cancelled by ${cancelled_by}. Reason: ${reason}`;
    await allocation.save();

    return allocation;
  }
}

module.exports = new SalesAllocationService();
