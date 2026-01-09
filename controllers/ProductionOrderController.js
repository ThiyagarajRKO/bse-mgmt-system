"use strict";

/**
 * ProductionOrderController
 *
 * Handles HTTP endpoints for 11-step production order flow:
 * 1. POST /production/orders - Create production order
 * 2. POST /production/orders/{id}/issue-raw - Issue raw material
 * 3. POST /production/orders/{id}/derive - Allocate derivatives
 * 4. POST /production/orders/{id}/produce - Record production output
 * 5. POST /production/orders/{id}/close - Close order
 * 6. GET /production/orders/{id} - View order status
 * 7. GET /production/orders - List orders with filters
 * 8. GET /production/orders/{id}/expected-yield - Get theoretical yields
 * 9. GET /production/orders/{id}/cost-allocation - View cost breakdown
 * 10. GET /production/orders/{id}/audit - View validation log
 * 11. GET /production/orders/{id}/summary - Get production summary
 */

class ProductionOrderController {
  constructor(
    productionOrderService,
    rawMaterialIssueService,
    derivativeAllocationService,
    productionExecutionService,
    skuGenerationService
  ) {
    this.productionOrderService = productionOrderService;
    this.rawMaterialIssueService = rawMaterialIssueService;
    this.derivativeAllocationService = derivativeAllocationService;
    this.productionExecutionService = productionExecutionService;
    this.skuGenerationService = skuGenerationService;
  }

  /**
   * POST /production/orders
   * Create new production order (Step 1 of 11)
   *
   * Body:
   * {
   *   input_species_id: UUID,
   *   order_type: "PRIMARY" | "SECONDARY" | "VALUE_ADDED" | "REWORK",
   *   planned_quantity_kg: 100.50,
   *   planned_start_date: "2025-02-15T09:00:00Z",
   *   plant_id: "PLANT-001",
   *   remarks: "Optional notes"
   * }
   */
  async createOrder(request, reply) {
    try {
      const { userId } = request.user || {};

      const order = await this.productionOrderService.createOrder({
        input_species_id: request.body.input_species_id,
        order_type: request.body.order_type || "PRIMARY",
        planned_quantity_kg: parseFloat(request.body.planned_quantity_kg),
        planned_start_date: new Date(request.body.planned_start_date),
        plant_id: request.body.plant_id,
        created_by: userId,
        remarks: request.body.remarks,
      });

      return reply.status(201).send({
        success: true,
        message: "Production order created",
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          species: order.input_species,
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * POST /production/orders/{id}/issue-raw
   * Issue raw material to order (Step 2 of 11)
   *
   * Params:
   * - id: Production order ID
   *
   * Body:
   * {
   *   inventory_lot_id: UUID,
   *   issued_quantity_kg: 95.25,
   *   measured_avg_size_kg: 0.800,
   *   size_code: "800GM",
   *   initial_grade: "A" | "B" | "C" | "D",
   *   remarks: "Optional"
   * }
   */
  async issueRawMaterial(request, reply) {
    try {
      const { userId } = request.user || {};
      const { id: orderId } = request.params;

      const rawIssue = await this.rawMaterialIssueService.issueRawMaterial({
        production_order_id: orderId,
        inventory_lot_id: request.body.inventory_lot_id,
        issued_quantity_kg: parseFloat(request.body.issued_quantity_kg),
        measured_avg_size_kg: parseFloat(request.body.measured_avg_size_kg),
        size_code: request.body.size_code,
        initial_grade: request.body.initial_grade,
        issued_by: userId,
        remarks: request.body.remarks,
      });

      return reply.status(200).send({
        success: true,
        message: "Raw material issued and locked",
        data: {
          issue_id: rawIssue.id,
          issued_quantity_kg: rawIssue.issued_quantity_kg,
          grade: rawIssue.initial_grade,
          size_locked: rawIssue.size_locked,
          grade_locked: rawIssue.grade_locked,
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * POST /production/orders/{id}/derive
   * Allocate derivatives and calculate yield (Step 4 of 11)
   *
   * Params:
   * - id: Production order ID
   *
   * Body:
   * {
   *   derivatives: [
   *     {
   *       derivative_id: UUID,
   *       planned_percentage: 75.5
   *     },
   *     {
   *       derivative_id: UUID,
   *       planned_percentage: 24.5
   *     }
   *   ]
   * }
   *
   * Note: Percentages must sum to 100% (or 0 for auto-enabled)
   */
  async allocateDerivatives(request, reply) {
    try {
      const { userId } = request.user || {};
      const { id: orderId } = request.params;

      const derivatives =
        await this.derivativeAllocationService.allocateDerivatives({
          production_order_id: orderId,
          derivatives: request.body.derivatives || [],
          user_id: userId,
        });

      // Get expected yields (Step 5 result)
      const expectedYields = derivatives.map((d) => ({
        derivative_id: d.derivative_id,
        derivative_name: d.derivative?.derivative_name,
        planned_percentage: d.planned_percentage,
        theoretical_yield_percent: d.theoretical_yield_percent,
        expected_quantity_kg: d.expected_quantity_kg,
      }));

      return reply.status(200).send({
        success: true,
        message: "Derivatives allocated. Yield calculated from YieldMaster.",
        data: {
          order_id: orderId,
          derivatives: expectedYields,
          total_expected_kg: expectedYields.reduce(
            (sum, d) => sum + d.expected_quantity_kg,
            0
          ),
          note: "Theoretical yield is system-driven from YieldMaster. User cannot edit yield percentages.",
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * POST /production/orders/{id}/produce
   * Record actual production output (Step 6 of 11)
   * Triggers: SKU generation (Step 7), cost allocation (Step 8)
   *
   * Params:
   * - id: Production order ID
   *
   * Body:
   * {
   *   production_derivative_id: UUID,
   *   actual_quantity_kg: 71.50,
   *   actual_grade: "B",
   *   size_code: "800GM",
   *   remarks: "Slight downgrade due to scale wear"
   * }
   *
   * HARD BLOCKS:
   * - actual_grade can only DOWNGRADE (A→B, B→C, etc). Cannot upgrade.
   * - actual_quantity must be <= expected_quantity (yield validation)
   * - size_code must match raw issue (immutable)
   * - grade must be A/B/C/D
   */
  async recordProduction(request, reply) {
    try {
      const { userId } = request.user || {};
      const { id: orderId } = request.params;

      const output = await this.productionExecutionService.recordProduction({
        production_order_id: orderId,
        production_derivative_id: request.body.production_derivative_id,
        actual_quantity_kg: parseFloat(request.body.actual_quantity_kg),
        actual_grade: request.body.actual_grade,
        size_code: request.body.size_code,
        recorded_by: userId,
        remarks: request.body.remarks,
      });

      return reply.status(201).send({
        success: true,
        message: "Production recorded. SKU auto-generated.",
        data: {
          output_id: output.id,
          sku_code: output.sku_code,
          actual_quantity_kg: output.actual_quantity_kg,
          actual_grade: output.actual_grade,
          actual_yield_percent: output.actual_yield_percent.toFixed(2) + "%",
          derivative: output.derivative?.derivative_name,
          next_step: "Cost allocation required before inventory posting",
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * POST /production/orders/{id}/allocate-cost
   * Allocate costs to production output (Step 8 of 11)
   *
   * Params:
   * - id: Production order ID
   *
   * Body:
   * {
   *   production_output_id: UUID,
   *   raw_cost_share: 1000.00,
   *   processing_cost_share: 250.00,
   *   packaging_cost_share: 50.00
   * }
   */
  async allocateCost(request, reply) {
    try {
      const { userId } = request.user || {};

      const output = await this.productionExecutionService.allocateCosts({
        production_output_id: request.body.production_output_id,
        raw_cost_share: parseFloat(request.body.raw_cost_share || 0),
        processing_cost_share: parseFloat(
          request.body.processing_cost_share || 0
        ),
        packaging_cost_share: parseFloat(
          request.body.packaging_cost_share || 0
        ),
        allocated_by: userId,
      });

      return reply.status(200).send({
        success: true,
        message: "Costs allocated. Ready for inventory posting.",
        data: {
          output_id: output.id,
          total_cost_allocated: output.cost_allocated,
          sku_code: output.sku_code,
          next_step: "POST /production/orders/{id}/post-inventory",
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * POST /production/orders/{id}/post-inventory
   * Post finished goods inventory (Step 9 of 11)
   *
   * HARD BLOCK: inventory_posted must be true before invoice generation
   *
   * Params:
   * - id: Production order ID
   *
   * Body:
   * {
   *   production_output_id: UUID,
   *   location_code: "FG-COLD-001"
   * }
   */
  async postInventory(request, reply) {
    try {
      const { userId } = request.user || {};
      const { id: orderId } = request.params;

      const output = await this.productionExecutionService.postInventory({
        production_output_id: request.body.production_output_id,
        location_code: request.body.location_code,
        posted_by: userId,
      });

      return reply.status(200).send({
        success: true,
        message: "Inventory posted. FG created, RM consumed, GL posted.",
        data: {
          output_id: output.id,
          sku_code: output.sku_code,
          inventory_posted: output.inventory_posted,
          gl_posted: output.gl_posted,
          next_step: "Order can now be closed or invoiced",
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * POST /production/orders/{id}/close
   * Close production order (Step 11 of 11 - Final)
   *
   * HARD BLOCKS:
   * - All raw material must be consumed (no remainder in WIP)
   * - All outputs must be posted (inventory_posted = true)
   * - WIP quantity must be 0
   * - Order becomes CLOSED (irreversible)
   *
   * Params:
   * - id: Production order ID
   *
   * Body:
   * {
   *   remarks: "Order completed successfully"
   * }
   */
  async closeOrder(request, reply) {
    try {
      const { userId } = request.user || {};
      const { id: orderId } = request.params;

      const order = await this.productionOrderService.updateOrderStatus(
        orderId,
        "CLOSED",
        userId
      );

      return reply.status(200).send({
        success: true,
        message: "Production order closed. No further changes allowed.",
        data: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          closed_at: order.closed_at,
          total_produced_kg: order.produced_quantity_kg,
          total_wastage_kg: order.wastage_quantity_kg,
          yield_variance_percent: order.yield_variance_percent.toFixed(2) + "%",
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * GET /production/orders/{id}
   * Get order with full status and all steps
   */
  async getOrder(request, reply) {
    try {
      const { id: orderId } = request.params;

      const order = await this.productionOrderService.getOrderById(orderId);

      return reply.status(200).send({
        success: true,
        data: {
          ...order.toJSON(),
          workflow_status: this._getWorkflowStatus(order),
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * GET /production/orders
   * List production orders with filtering
   *
   * Query Params:
   * - status: PLANNED, RAW_ISSUED, IN_PRODUCTION, COMPLETED, CLOSED
   * - plant_id: Plant code
   * - species_id: Filter by species
   * - limit: Page size (default 50)
   * - offset: Pagination offset (default 0)
   */
  async listOrders(request, reply) {
    try {
      const { status, plant_id, species_id, limit, offset } = request.query;

      const orders = await this.productionOrderService.getOrders({
        status,
        plant_id,
        input_species_id: species_id,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
      });

      return reply.status(200).send({
        success: true,
        data: orders.rows.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          species: o.input_species?.species_name,
          status: o.status,
          planned_quantity_kg: o.planned_quantity_kg,
          issued_quantity_kg: o.issued_quantity_kg,
          produced_quantity_kg: o.produced_quantity_kg,
          created_at: o.created_at,
        })),
        pagination: {
          total: orders.total,
          limit: orders.limit,
          offset: orders.offset,
          pages: orders.pages,
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * GET /production/orders/{id}/expected-yield
   * Get theoretical yields from YieldMaster (Step 5 preview)
   */
  async getExpectedYield(request, reply) {
    try {
      const { id: orderId } = request.params;

      const derivatives =
        await this.derivativeAllocationService.getDerivativesByOrderId(orderId);

      const yields = derivatives.map((d) => ({
        derivative_id: d.derivative_id,
        derivative_name: d.derivative?.derivative_name,
        theoretical_yield_percent: d.theoretical_yield_percent,
        expected_quantity_kg: d.expected_quantity_kg,
      }));

      return reply.status(200).send({
        success: true,
        message: "Theoretical yields from YieldMaster (read-only)",
        data: {
          order_id: orderId,
          yields,
          note: "These yields are system-driven and cannot be overridden by users.",
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * GET /production/orders/{id}/cost-allocation
   * View cost breakdown for all outputs (Step 8 review)
   */
  async getCostAllocation(request, reply) {
    try {
      const { id: orderId } = request.params;

      const outputs = await this.productionExecutionService.getOutputsByOrderId(
        orderId
      );

      const costBreakdown = outputs.map((o) => ({
        output_id: o.id,
        sku_code: o.sku_code,
        derivative: o.derivative?.derivative_name,
        quantity_kg: o.actual_quantity_kg,
        cost_allocated: o.cost_allocated,
        cost_per_kg: o.cost_allocated / o.actual_quantity_kg,
      }));

      const totalCost = costBreakdown.reduce(
        (sum, c) => sum + (c.cost_allocated || 0),
        0
      );

      return reply.status(200).send({
        success: true,
        data: {
          order_id: orderId,
          costs: costBreakdown,
          summary: {
            total_cost_allocated: totalCost,
            output_count: costBreakdown.length,
            average_cost_per_kg:
              totalCost /
              outputs.reduce((sum, o) => sum + o.actual_quantity_kg, 0),
          },
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * GET /production/orders/{id}/audit
   * Get immutable grade-size validation log (Step 3 audit trail)
   */
  async getAuditLog(request, reply) {
    try {
      const { id: orderId } = request.params;
      const models = this.productionOrderService.models;

      const logs = await models.grade_size_validation_logs.findAll({
        where: { production_order_id: orderId },
        attributes: [
          "id",
          "measured_size_kg",
          "mapped_size_code",
          "declared_grade",
          "validation_status",
          "validation_reason",
          "size_locked_at",
          "grade_locked_at",
          "created_at",
        ],
        order: [["created_at", "ASC"]],
      });

      return reply.status(200).send({
        success: true,
        message: "Immutable grade-size validation log",
        data: {
          order_id: orderId,
          logs: logs.map((log) => ({
            ...log.toJSON(),
            immutable: true,
            note: "Size and grade locked at issuance time. Cannot be changed.",
          })),
        },
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * GET /production/orders/{id}/summary
   * Get production summary metrics
   */
  async getProductionSummary(request, reply) {
    try {
      const { id: orderId } = request.params;

      const summary =
        await this.productionExecutionService.getOrderProductionSummary(
          orderId
        );

      return reply.status(200).send({
        success: true,
        data: summary,
      });
    } catch (error) {
      return this._handleError(reply, error);
    }
  }

  /**
   * Helper: Determine workflow status
   * @private
   */
  _getWorkflowStatus(order) {
    const steps = {
      1: "Order Created (PLANNED)",
      2: "Raw Material Issued (RAW_ISSUED)",
      3: "Size & Grade Validated & Locked",
      4: "Derivatives Allocated",
      5: "Yield Calculated (YieldMaster)",
      6: "Production Recorded",
      7: "SKU Auto-Generated",
      8: "Costs Allocated",
      9: "Inventory Posted",
      10: "GST Tagged",
      11: "Order Closed",
    };

    const currentStep =
      {
        PLANNED: 1,
        RAW_ISSUED: 2,
        IN_PRODUCTION: 6,
        COMPLETED: 10,
        CLOSED: 11,
      }[order.status] || 0;

    return {
      current_step: currentStep,
      current_step_description: steps[currentStep],
      status: order.status,
      completed_percentage: Math.round((currentStep / 11) * 100),
    };
  }

  /**
   * Helper: Handle errors with appropriate HTTP status
   * @private
   */
  _handleError(reply, error) {
    console.error("Production Order Error:", error.message);

    // Hard block errors
    if (
      error.message.includes("HARD BLOCK") ||
      error.message.includes("Cannot upgrade") ||
      error.message.includes("Cannot issue expired") ||
      error.message.includes("Cannot issue QC-failed")
    ) {
      return reply.status(403).send({
        success: false,
        error: "HARD_BLOCK_VIOLATION",
        message: error.message,
        code: "HARD_BLOCK_003",
      });
    }

    // Validation errors
    if (
      error.message.includes("not found") ||
      error.message.includes("Invalid") ||
      error.message.includes("must be")
    ) {
      return reply.status(400).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    // State errors
    if (
      error.message.includes("must be in") ||
      error.message.includes("status")
    ) {
      return reply.status(409).send({
        success: false,
        error: "INVALID_STATE",
        message: error.message,
      });
    }

    // Generic error
    return reply.status(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
}

module.exports = ProductionOrderController;
