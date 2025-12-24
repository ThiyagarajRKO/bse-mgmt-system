import models from "../../models";
import TaxResolutionService from "./tax_resolution.js";

const {
  YieldStandardMaster,
  YieldActual,
  YieldReasonMaster,
  PackingList,
  Order,
  OrderProduct,
} = models;

/**
 * Yield Calculation Service
 * Handles yield tracking, variance calculations, and margin impact analysis
 */
export class YieldCalculationService {
  /**
   * Capture yield after packing list finalization
   * @param {Object} params - { packing_list_id, profile_id }
   * @returns {Object} - Yield capture result
   */
  static async captureYield({ packing_list_id, profile_id }) {
    try {
      // Get packing list with order details
      const packingList = await PackingList.findOne({
        where: {
          id: packing_list_id,
          status: "LOCKED",
          is_active: true,
        },
        include: [
          {
            model: Order,
            as: "salesOrder",
            include: [
              {
                model: OrderProduct,
                as: "orderProducts",
                where: { is_active: true },
                required: false,
              },
            ],
          },
        ],
      });

      if (!packingList) {
        throw new Error("Packing list not found or not in LOCKED status");
      }

      // For each order product, calculate yield
      const yieldResults = [];

      for (const orderProduct of packingList.salesOrder.orderProducts) {
        // Get yield standards for this product
        const yieldStandard = await this.getYieldStandard({
          species_id: orderProduct.species_id,
          product_form: packingList.market === "EXPORT" ? "FROZEN" : "FROZEN", // Default to frozen
          processing_type: this.determineProcessingType(orderProduct),
        });

        if (!yieldStandard) {
          console.warn(
            `No yield standard found for species ${orderProduct.species_id}`
          );
          continue;
        }

        // Calculate actual yield from procurement data
        // This would typically come from procurement lot tracking
        const actualYieldData = await this.calculateActualYield({
          order_product: orderProduct,
          packing_list: packingList,
          yield_standard: yieldStandard,
        });

        // Create yield actual record
        const yieldActual = await YieldActual.create({
          batch_id: packingList.sales_order_id, // Using order ID as batch ID for now
          packing_list_id,
          species_id: orderProduct.species_id,
          product_form: yieldStandard.product_form,
          processing_type: yieldStandard.processing_type,
          raw_input_kg: actualYieldData.raw_input_kg,
          raw_cost_per_kg: actualYieldData.raw_cost_per_kg,
          saleable_output_kg: actualYieldData.saleable_output_kg,
          actual_yield_pct: actualYieldData.actual_yield_pct,
          expected_yield_pct: yieldStandard.expected_yield_pct,
          variance_pct: actualYieldData.variance_pct,
          loss_kg: actualYieldData.loss_kg,
          loss_value: actualYieldData.loss_value,
          status: actualYieldData.status,
          reason_codes: actualYieldData.reason_codes,
          created_by: profile_id,
          updated_by: profile_id,
        });

        yieldResults.push({
          yield_actual_id: yieldActual.id,
          species_name: orderProduct.product_name,
          actual_yield_pct: actualYieldData.actual_yield_pct,
          expected_yield_pct: yieldStandard.expected_yield_pct,
          variance_pct: actualYieldData.variance_pct,
          status: actualYieldData.status,
          loss_value: actualYieldData.loss_value,
        });
      }

      return {
        packing_list_id,
        packing_list_no: packingList.packing_list_no,
        yield_results: yieldResults,
        overall_status: this.determineOverallStatus(yieldResults),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get yield standard for a product configuration
   * @param {Object} params - { species_id, product_form, processing_type }
   * @returns {Object} - Yield standard
   */
  static async getYieldStandard({ species_id, product_form, processing_type }) {
    try {
      const yieldStandard = await YieldStandardMaster.findOne({
        where: {
          species_id,
          product_form,
          processing_type,
          is_active: true,
        },
      });

      return yieldStandard;
    } catch (error) {
      console.error("Error getting yield standard:", error);
      return null;
    }
  }

  /**
   * Determine processing type from order product
   * @param {Object} orderProduct - Order product object
   * @returns {string} - Processing type
   */
  static determineProcessingType(orderProduct) {
    // This is a simplified logic - in real implementation,
    // this would be determined from product master data
    const productName = orderProduct.product_name?.toLowerCase() || "";

    if (productName.includes("hoso")) return "HOSO";
    if (productName.includes("hlso")) return "HLSO";
    if (productName.includes("pud")) return "PUD";
    if (productName.includes("cleaned")) return "CLEANED";
    if (productName.includes("cooked")) return "COOKED";

    return "STANDARD"; // Default
  }

  /**
   * Calculate actual yield from procurement and packing data
   * @param {Object} params - { order_product, packing_list, yield_standard }
   * @returns {Object} - Actual yield calculations
   */
  static async calculateActualYield({
    order_product,
    packing_list,
    yield_standard,
  }) {
    try {
      // In a real implementation, this would pull from procurement lots
      // For now, using simplified calculations based on order quantity

      const quantity = order_product.quantity || 0;
      const rawCostPerKg = order_product.rate || 0;

      // Assume raw input is 110% of ordered quantity (accounting for losses)
      const rawInputKg = quantity * 1.1;

      // Saleable output is the ordered quantity
      const saleableOutputKg = quantity;

      // Calculate actual yield
      const actualYieldPct = (saleableOutputKg / rawInputKg) * 100;

      // Calculate variance
      const expectedYieldPct = yield_standard.expected_yield_pct;
      const variancePct = actualYieldPct - expectedYieldPct;

      // Calculate losses
      const lossKg = rawInputKg - saleableOutputKg;
      const lossValue = lossKg * rawCostPerKg;

      // Determine status
      const allowedVariance = yield_standard.allowed_variance_pct;
      let status = "OK";
      let reasonCodes = [];

      if (Math.abs(variancePct) > allowedVariance * 2) {
        status = "BREACH";
        reasonCodes.push("LOW_YIELD");
      } else if (Math.abs(variancePct) > allowedVariance) {
        status = "WARNING";
        reasonCodes.push("YIELD_VARIANCE");
      }

      return {
        raw_input_kg: rawInputKg,
        raw_cost_per_kg: rawCostPerKg,
        saleable_output_kg: saleableOutputKg,
        actual_yield_pct: actualYieldPct,
        variance_pct: variancePct,
        loss_kg: lossKg,
        loss_value: lossValue,
        status,
        reason_codes: reasonCodes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Determine overall status from multiple yield results
   * @param {Array} yieldResults - Array of yield result objects
   * @returns {string} - Overall status
   */
  static determineOverallStatus(yieldResults) {
    if (yieldResults.some((result) => result.status === "BREACH")) {
      return "BREACH";
    }
    if (yieldResults.some((result) => result.status === "WARNING")) {
      return "WARNING";
    }
    return "OK";
  }

  /**
   * Calculate margin variance for invoice
   * @param {Object} params - { invoice_id, profile_id }
   * @returns {Object} - Margin variance result
   */
  static async calculateMarginVariance({ invoice_id, profile_id }) {
    try {
      // Get invoice with line items
      const invoice = await models.Invoice.findOne({
        where: {
          id: invoice_id,
          is_active: true,
        },
        include: [
          {
            model: models.InvoiceLineItem,
            as: "lineItems",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Get yield actual for this invoice's packing list
      const yieldActuals = await YieldActual.findAll({
        where: {
          packing_list_id: invoice.packing_list_id,
          is_active: true,
        },
      });

      if (!yieldActuals || yieldActuals.length === 0) {
        throw new Error("No yield data found for this invoice");
      }

      const marginVariances = [];

      for (const lineItem of invoice.lineItems) {
        // Find corresponding yield actual
        const yieldActual = yieldActuals.find(
          (ya) => ya.species_id === lineItem.product_id
        );

        if (!yieldActual) continue;

        // Calculate margin variance
        const saleQuantityKg = lineItem.quantity;
        const standardCostPerKg =
          yieldActual.raw_cost_per_kg / (yieldActual.expected_yield_pct / 100);
        const actualCostPerKg =
          yieldActual.raw_cost_per_kg / (yieldActual.actual_yield_pct / 100);
        const marginVarianceValue =
          (standardCostPerKg - actualCostPerKg) * saleQuantityKg;

        // Determine accounting treatment
        let accountingTreatment = "NORMAL_LOSS";
        if (yieldActual.status === "BREACH") {
          accountingTreatment = "EXCESS_LOSS_EXPENSE";
        }

        // Create margin variance record
        const marginVariance = await models.MarginVariance.create({
          invoice_id,
          yield_actual_id: yieldActual.id,
          sale_quantity_kg: saleQuantityKg,
          standard_cost_per_kg: standardCostPerKg,
          actual_cost_per_kg: actualCostPerKg,
          margin_variance_value: marginVarianceValue,
          reason_codes: yieldActual.reason_codes,
          accounting_treatment: accountingTreatment,
          created_by: profile_id,
          updated_by: profile_id,
        });

        marginVariances.push({
          margin_variance_id: marginVariance.id,
          product_name: lineItem.product_name,
          sale_quantity_kg: saleQuantityKg,
          standard_cost_per_kg: standardCostPerKg,
          actual_cost_per_kg: actualCostPerKg,
          margin_variance_value: marginVarianceValue,
          accounting_treatment: accountingTreatment,
        });
      }

      const totalMarginVariance = marginVariances.reduce(
        (sum, mv) => sum + parseFloat(mv.margin_variance_value),
        0
      );

      return {
        invoice_id,
        invoice_no: invoice.invoice_no,
        margin_variances: marginVariances,
        total_margin_variance: totalMarginVariance,
        requires_supervisor_approval: yieldActuals.some(
          (ya) => ya.status === "BREACH"
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get yield dashboard data
   * @param {Object} params - { start_date, end_date, species_id }
   * @returns {Object} - Dashboard data
   */
  static async getYieldDashboard({ start_date, end_date, species_id }) {
    try {
      const whereClause = {
        is_active: true,
        created_at: {
          [models.Sequelize.Op.between]: [start_date, end_date],
        },
      };

      if (species_id) {
        whereClause.species_id = species_id;
      }

      const yieldData = await YieldActual.findAll({
        where: whereClause,
        include: [
          {
            model: models.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Calculate dashboard metrics
      const totalRecords = yieldData.length;
      const okCount = yieldData.filter((y) => y.status === "OK").length;
      const warningCount = yieldData.filter(
        (y) => y.status === "WARNING"
      ).length;
      const breachCount = yieldData.filter((y) => y.status === "BREACH").length;

      const avgYieldPct =
        yieldData.reduce((sum, y) => sum + parseFloat(y.actual_yield_pct), 0) /
        totalRecords;
      const totalLossValue = yieldData.reduce(
        (sum, y) => sum + parseFloat(y.loss_value),
        0
      );

      // Group by species
      const bySpecies = {};
      yieldData.forEach((y) => {
        const speciesName = y.species?.species_name || "Unknown";
        if (!bySpecies[speciesName]) {
          bySpecies[speciesName] = {
            count: 0,
            total_loss_value: 0,
            avg_yield_pct: 0,
          };
        }
        bySpecies[speciesName].count++;
        bySpecies[speciesName].total_loss_value += parseFloat(y.loss_value);
        bySpecies[speciesName].avg_yield_pct += parseFloat(y.actual_yield_pct);
      });

      Object.keys(bySpecies).forEach((species) => {
        bySpecies[species].avg_yield_pct /= bySpecies[species].count;
      });

      return {
        summary: {
          total_records: totalRecords,
          ok_count: okCount,
          warning_count: warningCount,
          breach_count: breachCount,
          avg_yield_pct: avgYieldPct.toFixed(2),
          total_loss_value: totalLossValue.toFixed(2),
        },
        by_species: bySpecies,
        recent_yields: yieldData.slice(0, 10).map((y) => ({
          id: y.id,
          species_name: y.species?.species_name,
          actual_yield_pct: y.actual_yield_pct,
          variance_pct: y.variance_pct,
          status: y.status,
          loss_value: y.loss_value,
          created_at: y.created_at,
        })),
      };
    } catch (error) {
      throw error;
    }
  }
}

export default YieldCalculationService;
