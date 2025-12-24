const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const models = require("../models/index.js");

const {
  ProfitabilityFact,
  ProfitabilityCostBreakup,
  ProfitabilityAlert,
  sequelize,
} = models;

class ProfitabilityEngineService {
  constructor() {
    this.marginThresholds = {
      MINIMUM_MARGIN_PCT: 10.0, // Minimum acceptable margin
      MARGIN_DROP_THRESHOLD_PCT: 5.0, // Week-over-week drop threshold
      YIELD_LOSS_TOLERANCE_PCT: 5.0, // Yield loss tolerance
    };
  }

  /**
   * Calculate profitability for a posted invoice
   * @param {Object} invoiceData - Invoice data with line items
   * @returns {Object} - Profitability calculation result
   */
  async calculateInvoiceProfitability(invoiceData) {
    const startTime = Date.now();

    try {
      // Validate input data
      this.validateInvoiceData(invoiceData);

      const profitabilityRecords = [];
      const alerts = [];

      // Process each line item
      for (const lineItem of invoiceData.lineItems) {
        const profitabilityRecord = await this.calculateLineItemProfitability(
          invoiceData,
          lineItem
        );

        profitabilityRecords.push(profitabilityRecord);

        // Check for alerts
        const lineAlerts = await this.checkProfitabilityAlerts(
          profitabilityRecord,
          invoiceData
        );

        alerts.push(...lineAlerts);
      }

      // Bulk insert profitability facts
      const insertedRecords = await ProfitabilityFact.bulkCreate(
        profitabilityRecords,
        {
          returning: true,
        }
      );

      // Create cost breakups for each record
      for (const record of insertedRecords) {
        await this.createCostBreakup(record.id, record);
      }

      // Create alerts if any
      if (alerts.length > 0) {
        await ProfitabilityAlert.bulkCreate(alerts);
      }

      return {
        success: true,
        recordsProcessed: insertedRecords.length,
        alertsGenerated: alerts.length,
        processingTimeMs: Date.now() - startTime,
        records: insertedRecords,
        alerts: alerts,
      };
    } catch (error) {
      console.error("Error calculating invoice profitability:", error);
      throw error;
    }
  }

  /**
   * Calculate profitability for a single line item
   * @param {Object} invoiceData - Invoice header data
   * @param {Object} lineItem - Line item data
   * @returns {Object} - Profitability record
   */
  async calculateLineItemProfitability(invoiceData, lineItem) {
    // Get cost components from various sources
    const costComponents = await this.getCostComponents(invoiceData, lineItem);

    // Calculate gross margin (GST excluded)
    const grossMargin = this.calculateGrossMargin(
      lineItem.netAmount,
      costComponents
    );

    const grossMarginPct =
      lineItem.netAmount > 0 ? (grossMargin / lineItem.netAmount) * 100 : 0;

    return {
      id: uuidv4(),
      invoice_id: invoiceData.invoiceId,
      product_id: lineItem.productId,
      species_id: lineItem.speciesId,
      customer_id: invoiceData.customerId,
      batch_id: lineItem.batchId || null,
      sku_code: lineItem.skuCode,
      market: invoiceData.market,
      quantity_kg: lineItem.quantityKg,
      net_revenue: lineItem.netAmount,
      cogs: costComponents.cogs,
      packaging_cost: costComponents.packaging,
      logistics_cost: costComponents.logistics,
      yield_loss_cost: costComponents.yieldLoss,
      discount_amount: costComponents.discount,
      gross_margin: grossMargin,
      gross_margin_pct: grossMarginPct,
      posting_date: invoiceData.postingDate,
    };
  }

  /**
   * Get all cost components for a line item
   * @param {Object} invoiceData - Invoice data
   * @param {Object} lineItem - Line item data
   * @returns {Object} - Cost components
   */
  async getCostComponents(invoiceData, lineItem) {
    const costs = {
      cogs: 0,
      packaging: 0,
      logistics: 0,
      yieldLoss: 0,
      discount: lineItem.discountAmount || 0,
    };

    // 1. Get COGS from yield-adjusted procurement costs
    costs.cogs = await this.getCOGS(lineItem);

    // 2. Get packaging costs from packaging master + BOM
    costs.packaging = await this.getPackagingCost(lineItem);

    // 3. Get logistics costs from freight allocation
    costs.logistics = await this.getLogisticsCost(invoiceData, lineItem);

    // 4. Get yield loss costs (excess beyond standard)
    costs.yieldLoss = await this.getYieldLossCost(lineItem);

    return costs;
  }

  /**
   * Get Cost of Goods Sold (yield-adjusted)
   * @param {Object} lineItem - Line item data
   * @returns {number} - COGS amount
   */
  async getCOGS(lineItem) {
    try {
      // Get from procurement lots with yield adjustment
      // This would integrate with the yield tracking system
      const procurementQuery = `
        SELECT
          (pl.total_cost / pl.quantity_kg) * ya.actual_yield_pct / 100 * $quantity AS cogs_per_kg
        FROM procurement_lots pl
        LEFT JOIN yield_actual ya ON ya.batch_id = pl.id
        WHERE pl.id = $batchId
        LIMIT 1
      `;

      const [result] = await sequelize.query(procurementQuery, {
        bind: {
          batchId: lineItem.batchId,
          quantity: lineItem.quantityKg,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      return result?.cogs_per_kg || 0;
    } catch (error) {
      console.error("Error getting COGS:", error);
      return 0;
    }
  }

  /**
   * Get packaging costs from packaging master
   * @param {Object} lineItem - Line item data
   * @returns {number} - Packaging cost
   */
  async getPackagingCost(lineItem) {
    try {
      // Get packaging costs based on product and packaging rules
      const packagingQuery = `
        SELECT
          COALESCE(pm.cost_per_kg, 0) * $quantity AS packaging_cost
        FROM product_packaging_rules ppr
        JOIN packaging_master pm ON pm.id = ppr.packaging_id
        WHERE ppr.product_id = $productId
          AND ppr.grade_id = $gradeId
          AND ppr.size_id = $sizeId
        LIMIT 1
      `;

      const [result] = await sequelize.query(packagingQuery, {
        bind: {
          productId: lineItem.productId,
          gradeId: lineItem.gradeId,
          sizeId: lineItem.sizeId,
          quantity: lineItem.quantityKg,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      return result?.packaging_cost || 0;
    } catch (error) {
      console.error("Error getting packaging cost:", error);
      return 0;
    }
  }

  /**
   * Get logistics/freight costs
   * @param {Object} invoiceData - Invoice data
   * @param {Object} lineItem - Line item data
   * @returns {number} - Logistics cost
   */
  async getLogisticsCost(invoiceData, lineItem) {
    try {
      // Allocate freight costs proportionally by weight/value
      const freightQuery = `
        SELECT
          CASE
            WHEN SUM(il.quantity_kg) > 0 THEN
              (i.freight_cost * ($lineWeight / SUM(il.quantity_kg)))
            ELSE 0
          END AS allocated_freight
        FROM invoice i
        JOIN invoice_line_items il ON il.invoice_id = i.id
        WHERE i.id = $invoiceId
        GROUP BY i.id, i.freight_cost, $lineWeight
      `;

      const [result] = await sequelize.query(freightQuery, {
        bind: {
          invoiceId: invoiceData.invoiceId,
          lineWeight: lineItem.quantityKg,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      return result?.allocated_freight || 0;
    } catch (error) {
      console.error("Error getting logistics cost:", error);
      return 0;
    }
  }

  /**
   * Get excess yield loss costs
   * @param {Object} lineItem - Line item data
   * @returns {number} - Yield loss cost
   */
  async getYieldLossCost(lineItem) {
    try {
      // Calculate excess yield loss beyond standard
      const yieldLossQuery = `
        SELECT
          GREATEST(0,
            ((ys.standard_yield_pct - ya.actual_yield_pct) / 100) *
            (pl.total_cost / pl.quantity_kg) * $quantity
          ) AS excess_yield_loss
        FROM procurement_lots pl
        LEFT JOIN yield_actual ya ON ya.batch_id = pl.id
        LEFT JOIN yield_standard_master ys ON ys.species_id = pl.species_id
        WHERE pl.id = $batchId
        LIMIT 1
      `;

      const [result] = await sequelize.query(yieldLossQuery, {
        bind: {
          batchId: lineItem.batchId,
          quantity: lineItem.quantityKg,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      return result?.excess_yield_loss || 0;
    } catch (error) {
      console.error("Error getting yield loss cost:", error);
      return 0;
    }
  }

  /**
   * Calculate gross margin
   * Formula: Net Revenue - COGS - Packaging - Logistics - Yield Loss - Discounts
   * @param {number} netRevenue - Net revenue
   * @param {Object} costs - Cost components
   * @returns {number} - Gross margin
   */
  calculateGrossMargin(netRevenue, costs) {
    return (
      netRevenue -
      costs.cogs -
      costs.packaging -
      costs.logistics -
      costs.yieldLoss -
      costs.discount
    );
  }

  /**
   * Create cost breakup records for drilldown analysis
   * @param {string} profitabilityId - Profitability fact ID
   * @param {Object} record - Profitability record
   */
  async createCostBreakup(profitabilityId, record) {
    const breakups = [
      {
        profitability_id: profitabilityId,
        cost_type: "COGS",
        amount: record.cogs,
        description: "Cost of Goods Sold (yield-adjusted)",
      },
      {
        profitability_id: profitabilityId,
        cost_type: "PACKAGING",
        amount: record.packaging_cost,
        description: "Packaging and material costs",
      },
      {
        profitability_id: profitabilityId,
        cost_type: "LOGISTICS",
        amount: record.logistics_cost,
        description: "Freight and logistics costs",
      },
      {
        profitability_id: profitabilityId,
        cost_type: "YIELD_LOSS",
        amount: record.yield_loss_cost,
        description: "Excess yield loss costs",
      },
      {
        profitability_id: profitabilityId,
        cost_type: "DISCOUNT",
        amount: record.discount_amount,
        description: "Discounts applied",
      },
    ];

    await ProfitabilityCostBreakup.bulkCreate(breakups);
  }

  /**
   * Check for profitability alerts
   * @param {Object} record - Profitability record
   * @param {Object} invoiceData - Invoice data
   * @returns {Array} - Array of alerts
   */
  async checkProfitabilityAlerts(record, invoiceData) {
    const alerts = [];

    // 1. Check minimum margin
    if (record.gross_margin_pct < this.marginThresholds.MINIMUM_MARGIN_PCT) {
      alerts.push({
        profitability_id: record.id,
        alert_type: "MARGIN_BELOW_MINIMUM",
        severity: record.gross_margin < 0 ? "CRITICAL" : "HIGH",
        message: `Margin ${record.gross_margin_pct.toFixed(2)}% below minimum ${
          this.marginThresholds.MINIMUM_MARGIN_PCT
        }%`,
        threshold_value: this.marginThresholds.MINIMUM_MARGIN_PCT,
        actual_value: record.gross_margin_pct,
      });
    }

    // 2. Check for negative margin
    if (record.gross_margin < 0) {
      alerts.push({
        profitability_id: record.id,
        alert_type: "NEGATIVE_MARGIN",
        severity: "CRITICAL",
        message: `Negative margin: ₹${record.gross_margin.toFixed(2)}`,
        actual_value: record.gross_margin,
      });
    }

    // 3. Check yield loss tolerance
    const yieldLossPct =
      record.yield_loss_cost > 0
        ? (record.yield_loss_cost / record.net_revenue) * 100
        : 0;

    if (yieldLossPct > this.marginThresholds.YIELD_LOSS_TOLERANCE_PCT) {
      alerts.push({
        profitability_id: record.id,
        alert_type: "YIELD_LOSS_EXCESSIVE",
        severity: "MEDIUM",
        message: `Yield loss ${yieldLossPct.toFixed(2)}% exceeds tolerance ${
          this.marginThresholds.YIELD_LOSS_TOLERANCE_PCT
        }%`,
        threshold_value: this.marginThresholds.YIELD_LOSS_TOLERANCE_PCT,
        actual_value: yieldLossPct,
      });
    }

    // 4. Check discount vs margin
    if (record.discount_amount > record.gross_margin) {
      alerts.push({
        profitability_id: record.id,
        alert_type: "DISCOUNT_EXCEEDS_MARGIN",
        severity: "HIGH",
        message: `Discount ₹${record.discount_amount} exceeds margin ₹${record.gross_margin}`,
        actual_value: record.discount_amount - record.gross_margin,
      });
    }

    // 5. Check week-over-week margin drop (would need historical data)
    // This would be implemented when we have historical profitability data

    return alerts;
  }

  /**
   * Validate invoice data for profitability calculation
   * @param {Object} invoiceData - Invoice data to validate
   */
  validateInvoiceData(invoiceData) {
    const required = [
      "invoiceId",
      "customerId",
      "market",
      "postingDate",
      "lineItems",
    ];

    for (const field of required) {
      if (!invoiceData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (
      !Array.isArray(invoiceData.lineItems) ||
      invoiceData.lineItems.length === 0
    ) {
      throw new Error("Invoice must have at least one line item");
    }

    // Validate line items
    for (const item of invoiceData.lineItems) {
      const requiredItemFields = [
        "productId",
        "speciesId",
        "skuCode",
        "quantityKg",
        "netAmount",
      ];

      for (const field of requiredItemFields) {
        if (!item[field]) {
          throw new Error(`Missing required line item field: ${field}`);
        }
      }
    }
  }

  /**
   * Get species profitability analysis
   * @param {Object} filters - Filter options
   * @returns {Array} - Species profitability data
   */
  async getSpeciesProfitability(filters = {}) {
    const whereClause = {};
    if (filters.startDate && filters.endDate) {
      whereClause.posting_date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    }

    const speciesData = await ProfitabilityFact.findAll({
      where: whereClause,
      attributes: [
        "species_id",
        [sequelize.fn("SUM", sequelize.col("net_revenue")), "total_revenue"],
        [sequelize.fn("SUM", sequelize.col("gross_margin")), "total_margin"],
        [
          sequelize.fn("AVG", sequelize.col("gross_margin_pct")),
          "avg_margin_pct",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
      ],
      include: [
        {
          model: models.SpeciesMaster,
          as: "species",
          attributes: ["species_name"],
        },
      ],
      group: ["species_id", "species.species_name"],
      order: [[sequelize.fn("SUM", sequelize.col("gross_margin")), "DESC"]],
      raw: true,
    });

    return speciesData;
  }

  /**
   * Get customer margin ranking
   * @param {Object} filters - Filter options
   * @returns {Array} - Customer profitability ranking
   */
  async getCustomerMarginRanking(filters = {}) {
    const whereClause = {};
    if (filters.startDate && filters.endDate) {
      whereClause.posting_date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    }

    const customerData = await ProfitabilityFact.findAll({
      where: whereClause,
      attributes: [
        "customer_id",
        [sequelize.fn("SUM", sequelize.col("net_revenue")), "total_revenue"],
        [sequelize.fn("SUM", sequelize.col("gross_margin")), "total_margin"],
        [
          sequelize.fn("AVG", sequelize.col("gross_margin_pct")),
          "avg_margin_pct",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
      ],
      include: [
        {
          model: models.CustomerMaster,
          as: "customer",
          attributes: ["customer_name"],
        },
      ],
      group: ["customer_id", "customer.customer_name"],
      order: [[sequelize.fn("SUM", sequelize.col("net_revenue")), "DESC"]],
      raw: true,
    });

    return customerData;
  }

  /**
   * Get SKU profitability analysis (identifies killers)
   * @param {Object} filters - Filter options
   * @returns {Array} - SKU profitability data
   */
  async getSKUProfitability(filters = {}) {
    const whereClause = {};
    if (filters.startDate && filters.endDate) {
      whereClause.posting_date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    }

    const skuData = await ProfitabilityFact.findAll({
      where: whereClause,
      attributes: [
        "sku_code",
        "product_id",
        "species_id",
        [sequelize.fn("SUM", sequelize.col("quantity_kg")), "total_quantity"],
        [sequelize.fn("SUM", sequelize.col("net_revenue")), "total_revenue"],
        [sequelize.fn("SUM", sequelize.col("gross_margin")), "total_margin"],
        [
          sequelize.fn("SUM", sequelize.col("yield_loss_cost")),
          "total_yield_loss",
        ],
        [
          sequelize.fn("SUM", sequelize.col("packaging_cost")),
          "total_packaging_cost",
        ],
        [
          sequelize.fn("AVG", sequelize.col("gross_margin_pct")),
          "avg_margin_pct",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
      ],
      include: [
        {
          model: models.ProductMaster,
          as: "product",
          attributes: ["product_name"],
        },
        {
          model: models.SpeciesMaster,
          as: "species",
          attributes: ["species_name"],
        },
      ],
      group: [
        "sku_code",
        "product_id",
        "species_id",
        "product.product_name",
        "species.species_name",
      ],
      having: sequelize.where(
        sequelize.fn("SUM", sequelize.col("gross_margin")),
        {
          [Op.lt]: 0,
        }
      ),
      order: [[sequelize.fn("SUM", sequelize.col("gross_margin")), "ASC"]],
      raw: true,
    });

    return skuData;
  }

  /**
   * Get active alerts
   * @param {Object} filters - Filter options
   * @returns {Array} - Active alerts
   */
  async getActiveAlerts(filters = {}) {
    const whereClause = {
      is_acknowledged: false,
    };

    if (filters.severity) {
      whereClause.severity = filters.severity;
    }

    if (filters.alertType) {
      whereClause.alert_type = filters.alertType;
    }

    const alerts = await ProfitabilityAlert.findAll({
      where: whereClause,
      include: [
        {
          model: ProfitabilityFact,
          as: "profitabilityFact",
          include: [
            {
              model: models.SpeciesMaster,
              as: "species",
              attributes: ["species_name"],
            },
            {
              model: models.CustomerMaster,
              as: "customer",
              attributes: ["customer_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: filters.limit || 100,
    });

    return alerts;
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID acknowledging the alert
   * @returns {Object} - Acknowledged alert
   */
  async acknowledgeAlert(alertId, userId) {
    const alert = await ProfitabilityAlert.findByPk(alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    alert.is_acknowledged = true;
    alert.acknowledged_by = userId;
    alert.acknowledged_at = new Date();

    await alert.save();
    return alert;
  }

  /**
   * Get profitability drilldown for specific record
   * @param {string} profitabilityId - Profitability fact ID
   * @returns {Object} - Detailed profitability data
   */
  async getProfitabilityDrilldown(profitabilityId) {
    const record = await ProfitabilityFact.findByPk(profitabilityId, {
      include: [
        {
          model: ProfitabilityCostBreakup,
          as: "costBreakups",
        },
        {
          model: ProfitabilityAlert,
          as: "alerts",
        },
        {
          model: models.SpeciesMaster,
          as: "species",
          attributes: ["species_name"],
        },
        {
          model: models.CustomerMaster,
          as: "customer",
          attributes: ["customer_name"],
        },
        {
          model: models.ProductMaster,
          as: "product",
          attributes: ["product_name"],
        },
      ],
    });

    return record;
  }
}

module.exports = ProfitabilityEngineService;
