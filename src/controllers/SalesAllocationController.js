"use strict";

const SalesAllocationService = require("../../services/SalesAllocationService");
const ProductionDemandService = require("../../services/ProductionDemandService");

class SalesAllocationController {
  /**
   * POST /sales/allocations
   * Allocate an order line to production
   */
  async allocateOrderLine(request, reply) {
    try {
      const { order_id, order_product_id, allocated_quantity, remarks } =
        request.body;
      const allocated_by = request.user?.username || "system";

      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id,
        order_product_id,
        allocated_quantity,
        allocated_by,
        remarks,
      });

      return reply.code(201).send({
        success: true,
        message: "Allocation created successfully",
        data: allocation,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/allocations
   * List allocations with filters
   */
  async listAllocations(request, reply) {
    try {
      const {
        order_id,
        allocation_status,
        allocated_by,
        limit = 20,
        offset = 0,
      } = request.query;

      const filters = {};
      if (order_id) filters.order_id = order_id;
      if (allocation_status) filters.allocation_status = allocation_status;
      if (allocated_by) filters.allocated_by = allocated_by;

      const allocations = await SalesAllocationService.listAllocations(
        filters,
        parseInt(limit),
        parseInt(offset)
      );

      return reply.send({
        success: true,
        data: allocations,
        pagination: { limit, offset },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/allocations/:id
   * Get allocation details
   */
  async getAllocationDetails(request, reply) {
    try {
      const { id } = request.params;

      const allocation = await SalesAllocationService.getAllocationDetails(id);

      return reply.send({
        success: true,
        data: allocation,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/allocations/:id/confirm
   * Confirm allocation (PENDING -> ALLOCATED)
   */
  async confirmAllocation(request, reply) {
    try {
      const { id } = request.params;
      const confirmed_by = request.user?.username || "system";

      const allocation = await SalesAllocationService.confirmAllocation(
        id,
        confirmed_by
      );

      return reply.send({
        success: true,
        message: "Allocation confirmed",
        data: allocation,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/allocations/:id/fulfill
   * Update fulfillment progress
   */
  async updateFulfillment(request, reply) {
    try {
      const { id } = request.params;
      const { fulfilled_quantity } = request.body;
      const updated_by = request.user?.username || "system";

      const allocation = await SalesAllocationService.updateFulfillment(
        id,
        fulfilled_quantity,
        updated_by
      );

      return reply.send({
        success: true,
        message: "Fulfillment updated",
        data: allocation,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/allocations/:id/complete
   * Complete an allocation
   */
  async completeAllocation(request, reply) {
    try {
      const { id } = request.params;
      const completed_by = request.user?.username || "system";

      const allocation = await SalesAllocationService.completeAllocation(
        id,
        completed_by
      );

      return reply.send({
        success: true,
        message: "Allocation completed",
        data: allocation,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/allocations/:id/cancel
   * Cancel an allocation
   */
  async cancelAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { reason } = request.body;
      const cancelled_by = request.user?.username || "system";

      const allocation = await SalesAllocationService.cancelAllocation(
        id,
        cancelled_by,
        reason
      );

      return reply.send({
        success: true,
        message: "Allocation cancelled",
        data: allocation,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/allocations/:id/create-demands
   * Create production demands from allocation
   */
  async createDemandsFromAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { product_master_id, demanded_quantity, priority, required_date } =
        request.body;

      // Get allocation details
      const allocation = await SalesAllocationService.getAllocationDetails(id);

      // Create demand
      const demand = await ProductionDemandService.createDemandFromAllocation({
        sales_allocation_id: id,
        product_master_id,
        demanded_quantity,
        priority,
        required_date,
      });

      return reply.code(201).send({
        success: true,
        message: "Production demand created from allocation",
        data: demand,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/orders/:orderId/allocation-summary
   * Get allocation summary for an order
   */
  async getOrderAllocationSummary(request, reply) {
    try {
      const { orderId } = request.params;

      const summary = await SalesAllocationService.getOrderAllocationSummary(
        orderId
      );

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new SalesAllocationController();
