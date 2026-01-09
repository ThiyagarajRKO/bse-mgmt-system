"use strict";

const { v4: uuidv4 } = require("uuid");
const db = require("../models");

class ProductionDemandService {
  /**
   * Generate unique demand number in format DEM-YYYYMMDD-HHMMSS-XXXX
   * @returns {string} Unique demand number
   */
  generateDemandNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(
      4,
      "0"
    );

    return `DEM-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
  }

  /**
   * Create a production demand from a sales allocation
   * @param {Object} demandData - { sales_allocation_id, product_master_id, demanded_quantity, priority, required_date }
   * @returns {Promise<Object>} Created production demand
   */
  async createDemandFromAllocation(demandData) {
    const {
      sales_allocation_id,
      product_master_id,
      demanded_quantity,
      priority,
      required_date,
    } = demandData;

    // Validate input
    if (
      !sales_allocation_id ||
      !product_master_id ||
      !demanded_quantity ||
      !required_date
    ) {
      throw new Error(
        "Missing required fields: sales_allocation_id, product_master_id, demanded_quantity, required_date"
      );
    }

    if (demanded_quantity <= 0) {
      throw new Error("Demanded quantity must be greater than 0");
    }

    // Verify sales allocation exists
    const allocation = await db.SalesAllocation.findByPk(sales_allocation_id);
    if (!allocation) {
      throw new Error(`SalesAllocation not found: ${sales_allocation_id}`);
    }

    // Verify product master exists
    const product = await db.ProductMaster.findByPk(product_master_id);
    if (!product) {
      throw new Error(`ProductMaster not found: ${product_master_id}`);
    }

    // Check if demand quantity matches or is less than allocated quantity
    if (demanded_quantity > allocation.allocated_quantity) {
      throw new Error(
        `Demanded quantity (${demanded_quantity}) exceeds allocated quantity (${allocation.allocated_quantity})`
      );
    }

    // Create demand record
    const demand = await db.ProductionDemand.create({
      id: uuidv4(),
      demand_number: this.generateDemandNumber(),
      sales_allocation_id,
      production_order_id: null, // Will be linked when production order is created
      product_master_id,
      demanded_quantity,
      fulfilled_quantity: 0,
      demand_status: "CREATED",
      priority: priority || "MEDIUM",
      required_date: new Date(required_date),
    });

    // Update allocation status to ALLOCATED if it's still PENDING
    if (allocation.allocation_status === "PENDING") {
      allocation.allocation_status = "ALLOCATED";
      await allocation.save();
    }

    return demand;
  }

  /**
   * Link a demand to a production order (when production order is created)
   * @param {string} demandId - Production Demand ID
   * @param {string} productionOrderId - Production Order ID
   * @param {string} linked_by - User performing the action
   * @returns {Promise<Object>} Updated demand
   */
  async linkToProductionOrder(demandId, productionOrderId, linked_by) {
    const demand = await db.ProductionDemand.findByPk(demandId);

    if (!demand) {
      throw new Error(`ProductionDemand not found: ${demandId}`);
    }

    // Verify production order exists
    const productionOrder = await db.ProductionOrder.findByPk(
      productionOrderId
    );
    if (!productionOrder) {
      throw new Error(`ProductionOrder not found: ${productionOrderId}`);
    }

    // Verify product matches
    if (productionOrder.product_master_id !== demand.product_master_id) {
      throw new Error("ProductionOrder product does not match demand product");
    }

    demand.production_order_id = productionOrderId;
    demand.demand_status = "WAITING_FOR_PRODUCTION";
    await demand.save();

    return demand;
  }

  /**
   * Update demand status and fulfillment
   * @param {string} demandId - Demand ID
   * @param {string} newStatus - New demand status
   * @param {number} fulfilledQty - Fulfilled quantity (optional)
   * @param {string} updated_by - User performing the action
   * @returns {Promise<Object>} Updated demand
   */
  async updateDemandStatus(demandId, newStatus, fulfilledQty, updated_by) {
    const demand = await db.ProductionDemand.findByPk(demandId);

    if (!demand) {
      throw new Error(`ProductionDemand not found: ${demandId}`);
    }

    // Validate status transition
    const validStatuses = [
      "CREATED",
      "WAITING_FOR_PRODUCTION",
      "IN_PRODUCTION",
      "PRODUCTION_COMPLETE",
      "DISPATCHED",
      "FULFILLED",
    ];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid demand status: ${newStatus}`);
    }

    // Update fulfilled quantity if provided
    if (fulfilledQty !== undefined && fulfilledQty !== null) {
      if (fulfilledQty < 0 || fulfilledQty > demand.demanded_quantity) {
        throw new Error(
          `Fulfilled quantity (${fulfilledQty}) must be between 0 and demanded quantity (${demand.demanded_quantity})`
        );
      }
      demand.fulfilled_quantity = fulfilledQty;
    }

    demand.demand_status = newStatus;
    await demand.save();

    return demand;
  }

  /**
   * Mark demand as in production
   * @param {string} demandId - Demand ID
   * @param {string} updated_by - User performing the action
   * @returns {Promise<Object>} Updated demand
   */
  async startProduction(demandId, updated_by) {
    const demand = await db.ProductionDemand.findByPk(demandId);

    if (!demand) {
      throw new Error(`ProductionDemand not found: ${demandId}`);
    }

    if (!demand.production_order_id) {
      throw new Error("Cannot start production: no linked production order");
    }

    demand.demand_status = "IN_PRODUCTION";
    await demand.save();

    return demand;
  }

  /**
   * Mark demand as production complete
   * @param {string} demandId - Demand ID
   * @param {number} completedQty - Quantity completed
   * @param {string} completed_by - User performing the action
   * @returns {Promise<Object>} Updated demand
   */
  async completeProduction(demandId, completedQty, completed_by) {
    const demand = await db.ProductionDemand.findByPk(demandId);

    if (!demand) {
      throw new Error(`ProductionDemand not found: ${demandId}`);
    }

    if (completedQty < 0 || completedQty > demand.demanded_quantity) {
      throw new Error(
        `Completed quantity (${completedQty}) must be between 0 and demanded quantity (${demand.demanded_quantity})`
      );
    }

    demand.fulfilled_quantity = completedQty;
    demand.demand_status = "PRODUCTION_COMPLETE";
    await demand.save();

    return demand;
  }

  /**
   * Mark demand as fulfilled (after dispatch)
   * @param {string} demandId - Demand ID
   * @param {string} fulfilled_by - User performing the action
   * @returns {Promise<Object>} Updated demand
   */
  async fulfillDemand(demandId, fulfilled_by) {
    const demand = await db.ProductionDemand.findByPk(demandId);

    if (!demand) {
      throw new Error(`ProductionDemand not found: ${demandId}`);
    }

    if (demand.fulfilled_quantity !== demand.demanded_quantity) {
      throw new Error(
        `Cannot fulfill demand. Fulfilled (${demand.fulfilled_quantity}) does not match demanded (${demand.demanded_quantity})`
      );
    }

    demand.demand_status = "FULFILLED";
    await demand.save();

    return demand;
  }

  /**
   * Get demand details with related data
   * @param {string} demandId - Demand ID
   * @returns {Promise<Object>} Demand with related data
   */
  async getDemandDetails(demandId) {
    const demand = await db.ProductionDemand.findByPk(demandId, {
      include: [
        {
          model: db.SalesAllocation,
          as: "salesAllocation",
          attributes: ["id", "allocated_quantity", "fulfilled_quantity"],
          include: [
            {
              model: db.Order,
              as: "order",
              attributes: ["id", "order_number", "order_date"],
            },
          ],
        },
        {
          model: db.ProductionOrder,
          as: "productionOrder",
          attributes: [
            "id",
            "production_order_number",
            "order_status",
            "created_at",
          ],
        },
        {
          model: db.ProductMaster,
          as: "productMaster",
          attributes: ["id", "product_name", "sku_code"],
        },
      ],
    });

    if (!demand) {
      throw new Error(`ProductionDemand not found: ${demandId}`);
    }

    return demand;
  }

  /**
   * List demands with filters
   * @param {Object} filters - { sales_allocation_id, demand_status, priority, product_master_id }
   * @param {number} limit - Results per page (default 20)
   * @param {number} offset - Pagination offset (default 0)
   * @returns {Promise<Array>} List of demands
   */
  async listDemands(filters = {}, limit = 20, offset = 0) {
    const where = {};

    if (filters.sales_allocation_id)
      where.sales_allocation_id = filters.sales_allocation_id;
    if (filters.demand_status) where.demand_status = filters.demand_status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.product_master_id)
      where.product_master_id = filters.product_master_id;

    const demands = await db.ProductionDemand.findAll({
      where,
      include: [
        {
          model: db.SalesAllocation,
          as: "salesAllocation",
          attributes: ["id", "allocated_quantity"],
          include: [
            {
              model: db.Order,
              as: "order",
              attributes: ["id", "order_number"],
            },
          ],
        },
        {
          model: db.ProductionOrder,
          as: "productionOrder",
          attributes: ["id", "production_order_number"],
        },
        {
          model: db.ProductMaster,
          as: "productMaster",
          attributes: ["id", "product_name"],
        },
      ],
      limit,
      offset,
      order: [["required_date", "ASC"]],
    });

    return demands;
  }

  /**
   * Get pending demands (demands waiting for production)
   * @param {number} limit - Results per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} List of pending demands
   */
  async getPendingDemands(limit = 20, offset = 0) {
    return this.listDemands(
      {
        demand_status: ["CREATED", "WAITING_FOR_PRODUCTION", "IN_PRODUCTION"],
      },
      limit,
      offset
    );
  }

  /**
   * Get demand fulfillment summary
   * @param {string} salesAllocationId - Sales Allocation ID
   * @returns {Promise<Object>} Fulfillment summary
   */
  async getDemandFulfillmentSummary(salesAllocationId) {
    const allocation = await db.SalesAllocation.findByPk(salesAllocationId, {
      include: [
        {
          model: db.ProductionDemand,
          as: "productionDemands",
        },
      ],
    });

    if (!allocation) {
      throw new Error(`SalesAllocation not found: ${salesAllocationId}`);
    }

    const summary = {
      allocation_id: salesAllocationId,
      allocated_quantity: allocation.allocated_quantity,
      total_demanded_quantity: 0,
      total_fulfilled_quantity: 0,
      demands: {
        CREATED: 0,
        WAITING_FOR_PRODUCTION: 0,
        IN_PRODUCTION: 0,
        PRODUCTION_COMPLETE: 0,
        DISPATCHED: 0,
        FULFILLED: 0,
      },
      fulfillment_percentage: 0,
    };

    allocation.productionDemands.forEach((demand) => {
      summary.demands[demand.demand_status]++;
      summary.total_demanded_quantity += parseFloat(
        demand.demanded_quantity || 0
      );
      summary.total_fulfilled_quantity += parseFloat(
        demand.fulfilled_quantity || 0
      );
    });

    if (summary.total_demanded_quantity > 0) {
      summary.fulfillment_percentage = (
        (summary.total_fulfilled_quantity / summary.total_demanded_quantity) *
        100
      ).toFixed(2);
    }

    return summary;
  }
}

module.exports = new ProductionDemandService();
