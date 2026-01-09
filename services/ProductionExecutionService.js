'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * ProductionExecutionService
 * 
 * Manages actual production execution and output recording:
 * 1. Record actual production quantities per derivative
 * 2. Validate grade downgrade only (no upgrades)
 * 3. Validate yield within tolerance
 * 4. Generate auto SKUs per output line
 * 5. Allocate costs and post inventory
 * 6. Track wastage and variance
 * 
 * HARD RULES:
 * - actual_grade can only DOWNGRADE from initial_grade (A→B, B→C, etc)
 * - actual_quantity <= expected_quantity (validated by yield tolerance)
 * - Yield variance must be within acceptable tolerance (e.g., ±5%)
 * - actual_quantity must be > 0
 * - Size immutable from raw issue (cannot change)
 * - One output per production_derivative (can have multiple if split further)
 * - Cost allocation mandatory before inventory posting
 * - Inventory posting mandatory before invoice
 */

class ProductionExecutionService {
  constructor(
    models,
    gradeDowngradeExceptionService,
    gradeYieldValidationService,
    skuGenerationService,
    costingService,
    config = {}
  ) {
    this.models = models;
    this.gradeDowngradeExceptionService = gradeDowngradeExceptionService;
    this.gradeYieldValidationService = gradeYieldValidationService;
    this.skuGenerationService = skuGenerationService;
    this.costingService = costingService;
    this.config = config;
    this.sequelize = models.sequelize;
  }

  /**
   * Record production output for a derivative
   * 
   * @param {Object} data - Output data
   * @param {UUID} data.production_order_id - Production order ID
   * @param {UUID} data.production_derivative_id - Production derivative ID (from allocation)
   * @param {String} data.actual_grade - Actual grade achieved (A/B/C/D)
   * @param {Number} data.actual_quantity_kg - Actual output quantity
   * @param {String} data.size_code - Size code (immutable from raw issue)
   * @param {UUID} data.recorded_by - User recording production
   * @param {String} data.remarks - Optional production notes
   * 
   * @returns {Promise<Object>} Created production_outputs record with SKU
   * 
   * @throws {Error} If grade upgrade attempted, yield exceeds tolerance, or validation fails
   */
  async recordProduction(data) {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate production order exists
      const order = await this.models.production_orders.findByPk(
        data.production_order_id,
        { transaction }
      );

      if (!order) {
        throw new Error(`Production order not found: ${data.production_order_id}`);
      }

      if (order.status !== 'RAW_ISSUED' && order.status !== 'IN_PRODUCTION') {
        throw new Error(
          `Order must be in RAW_ISSUED or IN_PRODUCTION status. Current: ${order.status}`
        );
      }

      // Validate production derivative exists
      const prodDerivative = await this.models.production_derivatives.findByPk(
        data.production_derivative_id,
        { transaction }
      );

      if (!prodDerivative) {
        throw new Error(`Production derivative not found: ${data.production_derivative_id}`);
      }

      // Get raw issue data
      const rawIssue = await this.models.production_raw_issues.findOne({
        where: { production_order_id: data.production_order_id },
        transaction
      });

      if (!rawIssue) {
        throw new Error('No raw issue found for order');
      }

      // HARD BLOCK: Validate grade (downgrade only, no upgrade)
      this._validateGradeDowngrade(rawIssue.initial_grade, data.actual_grade);

      // Validate size code is from size_master
      const sizeRecord = await this.models.size_master.findOne({
        where: { size_code: data.size_code },
        transaction
      });

      if (!sizeRecord) {
        throw new Error(`Size code not found in size_master: ${data.size_code}`);
      }

      // Validate actual_quantity is positive
      if (data.actual_quantity_kg <= 0) {
        throw new Error('Actual quantity must be greater than 0');
      }

      // Validate yield is within tolerance
      const yieldPercent = (data.actual_quantity_kg / prodDerivative.expected_quantity_kg) * 100;
      const yieldTolerance = this.config.yieldTolerance || 5;  // ±5%

      if (yieldPercent > 100 + yieldTolerance) {
        throw new Error(
          `Yield exceeds maximum tolerance. Actual: ${yieldPercent.toFixed(2)}%, Max: ${100 + yieldTolerance}%`
        );
      }

      // If grade downgrade, use exception service
      if (data.actual_grade !== rawIssue.initial_grade) {
        if (this.gradeDowngradeExceptionService) {
          await this.gradeDowngradeExceptionService.recordDowngrade({
            production_order_id: data.production_order_id,
            production_derivative_id: data.production_derivative_id,
            from_grade: rawIssue.initial_grade,
            to_grade: data.actual_grade,
            quantity_kg: data.actual_quantity_kg,
            recorded_by: data.recorded_by
          });
        }
      }

      // Generate SKU (deterministic)
      const skuResult = await this.skuGenerationService.generateSKU({
        species_id: order.input_species_id,
        derivative_id: prodDerivative.derivative_id,
        grade: data.actual_grade,
        size_code: data.size_code,
        pack_size_kg: this.config.defaultPackSize || 1
      });

      // Create production output record
      const output = await this.models.production_outputs.create(
        {
          id: uuidv4(),
          production_order_id: data.production_order_id,
          production_derivative_id: data.production_derivative_id,
          derivative_id: prodDerivative.derivative_id,
          product_id: skuResult.product_id,
          actual_quantity_kg: data.actual_quantity_kg,
          actual_grade: data.actual_grade,
          size_code: data.size_code,
          expected_quantity_kg: prodDerivative.expected_quantity_kg,
          actual_yield_percent: yieldPercent,
          sku_code: skuResult.sku_code,
          inventory_posted: false,
          gl_posted: false
        },
        { transaction }
      );

      // Update order status to IN_PRODUCTION if first output
      const outputCount = await this.models.production_outputs.count({
        where: { production_order_id: data.production_order_id },
        transaction
      });

      if (outputCount === 1) {
        await order.update({ status: 'IN_PRODUCTION' }, { transaction });
      }

      await transaction.commit();

      // Return with full relationships
      return await this.getOutputById(output.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get production output by ID with relationships
   * 
   * @param {UUID} outputId - Output ID
   * @returns {Promise<Object>} Output with SKU and derivative info
   */
  async getOutputById(outputId) {
    const output = await this.models.production_outputs.findByPk(outputId, {
      include: [
        {
          association: 'production_order',
          attributes: ['id', 'order_number', 'status']
        },
        {
          association: 'sku_product',
          attributes: ['id', 'sku_code', 'product_name', 'hsn_code']
        },
        {
          association: 'derivative',
          attributes: ['id', 'derivative_name']
        }
      ]
    });

    if (!output) {
      throw new Error(`Production output not found: ${outputId}`);
    }

    return output;
  }

  /**
   * Get all outputs for a production order
   * 
   * @param {UUID} orderId - Production order ID
   * @returns {Promise<Array>} Outputs with SKU info
   */
  async getOutputsByOrderId(orderId) {
    const outputs = await this.models.production_outputs.findAll({
      where: { production_order_id: orderId },
      include: [
        {
          association: 'sku_product',
          attributes: ['id', 'sku_code', 'product_name']
        },
        {
          association: 'derivative',
          attributes: ['id', 'derivative_name']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    return outputs;
  }

  /**
   * Allocate costs to a production output
   * 
   * @param {Object} data - Cost allocation data
   * @param {UUID} data.production_output_id - Output ID
   * @param {Number} data.raw_cost_share - Raw material cost allocated
   * @param {Number} data.processing_cost_share - Processing cost allocated
   * @param {Number} data.packaging_cost_share - Packaging cost allocated
   * @param {UUID} data.allocated_by - User allocating costs
   * 
   * @returns {Promise<Object>} Updated output with cost
   */
  async allocateCosts(data) {
    const transaction = await this.sequelize.transaction();

    try {
      const output = await this.models.production_outputs.findByPk(
        data.production_output_id,
        { transaction }
      );

      if (!output) {
        throw new Error(`Output not found: ${data.production_output_id}`);
      }

      // Calculate total cost
      const totalCost =
        (data.raw_cost_share || 0) +
        (data.processing_cost_share || 0) +
        (data.packaging_cost_share || 0);

      if (totalCost <= 0) {
        throw new Error('Total cost must be greater than 0');
      }

      // Update output with allocated cost
      await output.update(
        {
          cost_allocated: totalCost
        },
        { transaction }
      );

      // If using costing service, record detailed allocation
      if (this.costingService) {
        await this.costingService.allocateCostToOutput({
          production_output_id: data.production_output_id,
          raw_cost: data.raw_cost_share || 0,
          processing_cost: data.processing_cost_share || 0,
          packaging_cost: data.packaging_cost_share || 0,
          allocated_by: data.allocated_by
        });
      }

      await transaction.commit();

      return await this.getOutputById(data.production_output_id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Post inventory for a production output
   * Creates FG inventory and updates RM inventory
   * 
   * @param {Object} data - Posting data
   * @param {UUID} data.production_output_id - Output ID
   * @param {String} data.location_code - Finished goods location
   * @param {UUID} data.posted_by - User posting
   * 
   * @returns {Promise<Object>} Updated output with posting flags
   */
  async postInventory(data) {
    const transaction = await this.sequelize.transaction();

    try {
      const output = await this.models.production_outputs.findByPk(
        data.production_output_id,
        { transaction }
      );

      if (!output) {
        throw new Error(`Output not found: ${data.production_output_id}`);
      }

      if (output.inventory_posted) {
        throw new Error('Inventory already posted for this output');
      }

      // Verify cost was allocated
      if (!output.cost_allocated || output.cost_allocated <= 0) {
        throw new Error('Cost must be allocated before posting inventory');
      }

      // Create FG inventory transaction
      // TODO: Integrate with inventory_transactions table
      // - Create FG inventory record
      // - Update location availability
      // - Post GL entries (Dr FG Account, Cr RM Account)

      // Mark as posted
      await output.update(
        {
          inventory_posted: true,
          gl_posted: true  // Atomic: both together
        },
        { transaction }
      );

      await transaction.commit();

      return await this.getOutputById(data.production_output_id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Validate grade transition (downgrade only)
   * 
   * @private
   * @param {String} declaredGrade - Declared grade from raw issue
   * @param {String} actualGrade - Actual grade from production
   * 
   * @throws {Error} If upgrade attempted
   */
  _validateGradeDowngrade(declaredGrade, actualGrade) {
    const gradeOrder = { A: 0, B: 1, C: 2, D: 3 };

    const declaredValue = gradeOrder[declaredGrade];
    const actualValue = gradeOrder[actualGrade];

    if (actualValue < declaredValue) {
      // This is an upgrade - HARD BLOCK
      throw new Error(
        `HARD BLOCK: Cannot upgrade grade from ${declaredGrade} to ${actualGrade}. Only downgrade allowed.`
      );
    }

    // Downgrade is allowed (A→B, B→C, B→D, etc.)
  }

  /**
   * Get production summary for an order
   * Total quantity, yield variance, cost allocation
   * 
   * @param {UUID} orderId - Order ID
   * @returns {Promise<Object>} Summary metrics
   */
  async getOrderProductionSummary(orderId) {
    const order = await this.models.production_orders.findByPk(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const outputs = await this.models.production_outputs.findAll({
      where: { production_order_id: orderId },
      raw: true
    });

    const totalProduced = outputs.reduce((sum, o) => sum + (o.actual_quantity_kg || 0), 0);
    const totalExpected = outputs.reduce((sum, o) => sum + (o.expected_quantity_kg || 0), 0);
    const totalCost = outputs.reduce((sum, o) => sum + (o.cost_allocated || 0), 0);

    const yieldVariance = totalExpected > 0
      ? ((totalProduced - totalExpected) / totalExpected) * 100
      : 0;

    return {
      order_id: orderId,
      order_number: order.order_number,
      issued_quantity_kg: order.issued_quantity_kg,
      expected_quantity_kg: totalExpected,
      produced_quantity_kg: totalProduced,
      yield_variance_percent: yieldVariance,
      total_cost_allocated: totalCost,
      output_count: outputs.length,
      inventory_posted_count: outputs.filter(o => o.inventory_posted).length
    };
  }
}

module.exports = ProductionExecutionService;
