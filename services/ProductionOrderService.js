'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * ProductionOrderService
 * 
 * Manages production order lifecycle:
 * 1. Create production orders with species/derivative validation
 * 2. Validate production calendar availability
 * 3. Generate deterministic order numbers
 * 4. Track order status transitions
 * 
 * HARD RULES:
 * - Species must be valid and edible
 * - Derivatives must be allowed for species
 * - Production date must fall within plant calendar
 * - Order number must be unique
 */

class ProductionOrderService {
  constructor(models, config = {}) {
    this.models = models;
    this.config = config;
    this.sequelize = models.sequelize;
  }

  /**
   * Create a new production order
   * 
   * @param {Object} data - Order creation data
   * @param {UUID} data.input_species_id - Species being processed
   * @param {String} data.order_type - Type: PRIMARY, SECONDARY, VALUE_ADDED, REWORK
   * @param {Number} data.planned_quantity_kg - Total quantity in kg
   * @param {Date} data.planned_start_date - Scheduled start date
   * @param {String} data.plant_id - Plant/facility code
   * @param {UUID} data.created_by - User creating order
   * @param {String} data.remarks - Optional order remarks
   * 
   * @returns {Promise<Object>} Created production_orders record
   * 
   * @throws {Error} If species invalid, calendar conflict, or validation fails
   */
  async createOrder(data) {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate species exists and is edible
      const species = await this.models.species_master.findByPk(data.input_species_id, {
        transaction
      });

      if (!species) {
        throw new Error(`Species not found: ${data.input_species_id}`);
      }

      if (!species.is_edible) {
        throw new Error(`Species is not edible for processing: ${species.species_name}`);
      }

      // Check production calendar availability
      await this._validateProductionCalendar(
        data.plant_id,
        data.planned_start_date,
        transaction
      );

      // Generate order number: ORD-YYYYMMDD-HHMMSS-XXXX
      const orderNumber = await this._generateOrderNumber(transaction);

      // Create the order
      const order = await this.models.production_orders.create(
        {
          id: uuidv4(),
          order_number: orderNumber,
          order_type: data.order_type || 'PRIMARY',
          plant_id: data.plant_id,
          input_species_id: data.input_species_id,
          planned_quantity_kg: data.planned_quantity_kg,
          planned_start_date: data.planned_start_date,
          status: 'PLANNED',
          created_by: data.created_by,
          remarks: data.remarks || null
        },
        { transaction }
      );

      await transaction.commit();

      // Return with related species
      return await this.getOrderById(order.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get production order by ID with all relationships
   * 
   * @param {UUID} orderId - Production order ID
   * @returns {Promise<Object>} Order with associations
   */
  async getOrderById(orderId) {
    const order = await this.models.production_orders.findByPk(orderId, {
      include: [
        {
          association: 'input_species',
          attributes: ['id', 'species_name', 'is_edible']
        },
        {
          association: 'raw_issue',
          attributes: ['id', 'issued_quantity_kg', 'size_code', 'initial_grade', 'is_expired', 'is_qc_failed']
        },
        {
          association: 'derivatives',
          attributes: ['id', 'derivative_id', 'planned_percentage', 'theoretical_yield_percent', 'expected_quantity_kg'],
          include: [
            {
              association: 'derivative',
              attributes: ['id', 'derivative_name', 'hsn_code']
            }
          ]
        },
        {
          association: 'outputs',
          attributes: ['id', 'actual_quantity_kg', 'actual_grade', 'size_code', 'sku_code', 'inventory_posted'],
          include: [
            {
              association: 'sku_product',
              attributes: ['id', 'sku_code']
            }
          ]
        }
      ]
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    return order;
  }

  /**
   * Get orders with optional filtering
   * 
   * @param {Object} filter - Filter criteria
   * @param {String} filter.status - Order status (PLANNED, RAW_ISSUED, etc)
   * @param {String} filter.plant_id - Plant filter
   * @param {UUID} filter.input_species_id - Species filter
   * @param {Integer} filter.limit - Result limit (default 50)
   * @param {Integer} filter.offset - Result offset (default 0)
   * 
   * @returns {Promise<Object>} { rows, count, total }
   */
  async getOrders(filter = {}) {
    const where = {};
    
    if (filter.status) where.status = filter.status;
    if (filter.plant_id) where.plant_id = filter.plant_id;
    if (filter.input_species_id) where.input_species_id = filter.input_species_id;

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    const { rows, count } = await this.models.production_orders.findAndCountAll({
      where,
      include: [
        {
          association: 'input_species',
          attributes: ['id', 'species_name']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      rows,
      count,
      total: count,
      limit,
      offset,
      pages: Math.ceil(count / limit)
    };
  }

  /**
   * Update order status with validation
   * 
   * @param {UUID} orderId - Order ID
   * @param {String} newStatus - New status
   * @param {UUID} userId - User making change
   * 
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, newStatus, userId) {
    const validStatuses = ['PLANNED', 'RAW_ISSUED', 'IN_PRODUCTION', 'COMPLETED', 'CLOSED', 'CANCELLED'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const order = await this.getOrderById(orderId);
    
    // Validate status transition
    this._validateStatusTransition(order.status, newStatus);

    // Update based on new status
    const updateData = { status: newStatus };

    if (newStatus === 'CLOSED') {
      updateData.closed_by = userId;
      updateData.closed_at = new Date();
    } else if (newStatus === 'RAW_ISSUED') {
      updateData.approved_by = userId;
    }

    await order.update(updateData);
    return await this.getOrderById(orderId);
  }

  /**
   * Validate production calendar availability
   * 
   * @private
   * @param {String} plantId - Plant ID
   * @param {Date} startDate - Planned start date
   * @param {Object} transaction - Sequelize transaction
   * 
   * @throws {Error} If date unavailable or plant invalid
   */
  async _validateProductionCalendar(plantId, startDate, transaction) {
    // TODO: Implement plant calendar validation
    // For now, accept all valid future dates
    
    const now = new Date();
    if (startDate < now) {
      throw new Error('Planned start date must be in the future');
    }

    // Placeholder for plant calendar check
    // - Check plant operating hours
    // - Check public holidays
    // - Check maintenance windows
    // - Check capacity availability
  }

  /**
   * Generate unique order number
   * 
   * @private
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<String>} Unique order number
   */
  async _generateOrderNumber(transaction) {
    // Format: ORD-YYYYMMDD-HHMMSS-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    const orderNumber = `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;

    // Verify uniqueness
    const existing = await this.models.production_orders.findOne({
      where: { order_number: orderNumber },
      transaction
    });

    if (existing) {
      // Rare race condition - retry
      return await this._generateOrderNumber(transaction);
    }

    return orderNumber;
  }

  /**
   * Validate status transition rules
   * 
   * @private
   * @param {String} currentStatus - Current status
   * @param {String} newStatus - New status
   * 
   * @throws {Error} If transition invalid
   */
  _validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'PLANNED': ['RAW_ISSUED', 'CANCELLED'],
      'RAW_ISSUED': ['IN_PRODUCTION', 'CANCELLED'],
      'IN_PRODUCTION': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': ['CLOSED', 'CANCELLED'],
      'CLOSED': [],
      'CANCELLED': []
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  }
}

module.exports = ProductionOrderService;
