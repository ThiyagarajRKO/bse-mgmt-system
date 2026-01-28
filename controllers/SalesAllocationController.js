"use strict";

const SalesAllocationService = require("../../services/SalesAllocationService");

class SalesAllocationController {
  /**
   * Allocate order line items to production
   */
  async allocateOrderLine(request, reply) {
    try {
      const { order_id, order_product_id, allocated_quantity, allocated_by } =
        request.body;

      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id,
        order_product_id,
        allocated_quantity,
        allocated_by,
      });

      return reply.code(201).send({
        success: true,
        message: "Allocation created successfully",
        data: allocation,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * List allocations with filters
   */
  async listAllocations(request, reply) {
    try {
      const { order_id, allocation_status, allocated_by, limit, offset } =
        request.query;

      const allocations = await SalesAllocationService.listAllocations(
        { order_id, allocation_status, allocated_by },
        parseInt(limit) || 20,
        parseInt(offset) || 0,
      );

      return reply.send({
        success: true,
        data: allocations,
      });
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
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
      return reply.code(404).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Confirm allocation
   */
  async confirmAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { allocated_by } = request.body;

      const allocation = await SalesAllocationService.confirmAllocation(
        id,
        allocated_by,
      );

      return reply.send({
        success: true,
        message: "Allocation confirmed successfully",
        data: allocation,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update fulfillment progress
   */
  async updateFulfillment(request, reply) {
    try {
      const { id } = request.params;
      const { fulfilled_quantity, updated_by } = request.body;

      const allocation = await SalesAllocationService.updateFulfillment(
        id,
        fulfilled_quantity,
        updated_by,
      );

      return reply.send({
        success: true,
        message: "Fulfillment updated successfully",
        data: allocation,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Complete allocation
   */
  async completeAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { completed_by } = request.body;

      const allocation = await SalesAllocationService.completeAllocation(
        id,
        completed_by,
      );

      return reply.send({
        success: true,
        message: "Allocation completed successfully",
        data: allocation,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Cancel allocation
   */
  async cancelAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { cancelled_by, reason } = request.body;

      const allocation = await SalesAllocationService.cancelAllocation(
        id,
        cancelled_by,
        reason,
      );

      return reply.send({
        success: true,
        message: "Allocation cancelled successfully",
        data: allocation,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Create demands from allocation
   */
  async createDemandsFromAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { created_by } = request.body;

      const result = await SalesAllocationService.createDemandsFromAllocation(
        id,
        created_by,
      );

      return reply.send({
        success: true,
        message: "Production demands created successfully",
        data: result,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get order allocation summary
   */
  async getOrderAllocationSummary(request, reply) {
    try {
      const { orderId } = request.params;

      const summary =
        await SalesAllocationService.getOrderAllocationSummary(orderId);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      return reply.code(404).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Dispatch allocation
   */
  async dispatchAllocation(request, reply) {
    try {
      const { id } = request.params;
      const { dispatched_by, remarks } = request.body;

      const allocation = await SalesAllocationService.dispatchAllocation(
        id,
        dispatched_by,
        remarks,
      );

      return reply.send({
        success: true,
        message: "Allocation dispatched successfully",
        data: allocation,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Begin production for allocation
   */
  async beginProduction(request, reply) {
    try {
      const { id } = request.params;
      const { started_by, production_data } = request.body;

      const result = await SalesAllocationService.beginProduction(
        id,
        started_by,
        production_data,
      );

      return reply.send({
        success: true,
        message: "Production started successfully",
        data: result,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Raise purchase request for allocation
   */
  async raisePurchaseRequest(request, reply) {
    try {
      const { id } = request.params;
      const { requested_by, remarks } = request.body;

      const result = await SalesAllocationService.raisePurchaseRequest(
        id,
        requested_by,
        remarks,
      );

      return reply.send({
        success: true,
        message: "Purchase request raised successfully",
        data: result,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new SalesAllocationController();
