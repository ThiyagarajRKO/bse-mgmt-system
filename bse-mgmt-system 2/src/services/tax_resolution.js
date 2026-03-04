import models from "../../models";

const { ProductTaxMapping, TaxMaster, SpeciesMaster } = models;

/**
 * Tax Resolution Service
 * Handles automatic tax code resolution and GST calculation
 */
export class TaxResolutionService {
  /**
   * Resolve tax information for a product and supply type
   * @param {Object} params - { product_id, supply_type, effective_date }
   * @returns {Object} - Tax resolution result
   */
  static async resolveProductTax({
    product_id,
    supply_type,
    effective_date = new Date(),
  }) {
    try {
      // Step 1: Find active tax mapping for the product and supply type
      const taxMapping = await ProductTaxMapping.findOne({
        where: {
          product_id,
          supply_type,
          effective_from: { [models.Sequelize.Op.lte]: effective_date },
          [models.Sequelize.Op.or]: [
            { effective_to: null },
            { effective_to: { [models.Sequelize.Op.gte]: effective_date } },
          ],
          is_active: true,
        },
        include: [
          {
            model: TaxMaster,
            as: "taxMaster",
            where: { is_active: true },
            required: true,
          },
        ],
        order: [["effective_from", "DESC"]],
      });

      if (!taxMapping) {
        throw new Error(
          `No active tax mapping found for product ${product_id} and supply type ${supply_type}`
        );
      }

      const taxMaster = taxMapping.taxMaster;

      // Step 2: Handle export zero-rating
      if (supply_type === "EXPORT") {
        return {
          product_id,
          supply_type,
          tax_code: taxMaster.tax_code,
          hsn_code: taxMaster.hsn_code,
          tax_type: "ZERO_RATED",
          cgst_rate: 0,
          sgst_rate: 0,
          igst_rate: 0,
          cess_rate: 0,
          total_gst_rate: 0,
          is_reverse_charge: false,
          resolution_path: "EXPORT_ZERO_RATED",
        };
      }

      // Step 3: Return GST rates for domestic supply
      return {
        product_id,
        supply_type,
        tax_code: taxMaster.tax_code,
        hsn_code: taxMaster.hsn_code,
        tax_type: taxMaster.tax_type,
        cgst_rate: parseFloat(taxMaster.cgst_rate),
        sgst_rate: parseFloat(taxMaster.sgst_rate),
        igst_rate: parseFloat(taxMaster.igst_rate),
        cess_rate: parseFloat(taxMaster.cess_rate),
        total_gst_rate:
          parseFloat(taxMaster.cgst_rate) +
          parseFloat(taxMaster.sgst_rate) +
          parseFloat(taxMaster.igst_rate) +
          parseFloat(taxMaster.cess_rate),
        is_reverse_charge: taxMaster.is_reverse_charge,
        resolution_path: "PRODUCT_TAX_MAPPING",
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate GST amounts for a taxable value
   * @param {Object} params - { taxable_value, tax_resolution }
   * @returns {Object} - GST calculation breakdown
   */
  static calculateGST({ taxable_value, tax_resolution }) {
    try {
      const amount = parseFloat(taxable_value);

      if (
        tax_resolution.supply_type === "EXPORT" ||
        tax_resolution.tax_type === "ZERO_RATED"
      ) {
        return {
          taxable_value: amount,
          cgst_rate: 0,
          cgst_amount: 0,
          sgst_rate: 0,
          sgst_amount: 0,
          igst_rate: 0,
          igst_amount: 0,
          cess_rate: 0,
          cess_amount: 0,
          total_gst: 0,
          total_amount: amount,
        };
      }

      const cgst_amount = (amount * tax_resolution.cgst_rate) / 100;
      const sgst_amount = (amount * tax_resolution.sgst_rate) / 100;
      const igst_amount = (amount * tax_resolution.igst_rate) / 100;
      const cess_amount = (amount * tax_resolution.cess_rate) / 100;
      const total_gst = cgst_amount + sgst_amount + igst_amount + cess_amount;

      return {
        taxable_value: amount,
        cgst_rate: tax_resolution.cgst_rate,
        cgst_amount: Math.round(cgst_amount * 100) / 100,
        sgst_rate: tax_resolution.sgst_rate,
        sgst_amount: Math.round(sgst_amount * 100) / 100,
        igst_rate: tax_resolution.igst_rate,
        igst_amount: Math.round(igst_amount * 100) / 100,
        cess_rate: tax_resolution.cess_rate,
        cess_amount: Math.round(cess_amount * 100) / 100,
        total_gst: Math.round(total_gst * 100) / 100,
        total_amount: Math.round((amount + total_gst) * 100) / 100,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate tax resolution against master data
   * @param {Object} tax_resolution - Tax resolution object
   * @returns {boolean} - Validation result
   */
  static validateTaxResolution(tax_resolution) {
    try {
      // Check for export GST mismatch
      if (
        tax_resolution.supply_type === "EXPORT" &&
        (tax_resolution.cgst_rate > 0 ||
          tax_resolution.sgst_rate > 0 ||
          tax_resolution.igst_rate > 0)
      ) {
        throw new Error("Export invoices cannot have GST rates > 0");
      }

      // Check for domestic GST structure
      if (tax_resolution.supply_type === "DOMESTIC") {
        const hasCGST_SGST =
          tax_resolution.cgst_rate > 0 && tax_resolution.sgst_rate > 0;
        const hasIGST = tax_resolution.igst_rate > 0;

        if (!hasCGST_SGST && !hasIGST) {
          throw new Error(
            "Domestic supply must have either CGST+SGST or IGST rates"
          );
        }

        if (hasCGST_SGST && hasIGST) {
          throw new Error(
            "Domestic supply cannot have both CGST+SGST and IGST rates"
          );
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get tax summary for multiple line items
   * @param {Array} line_items - Array of line items with tax calculations
   * @returns {Object} - Tax summary
   */
  static getTaxSummary(line_items) {
    try {
      const summary = {
        total_taxable_value: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_igst: 0,
        total_cess: 0,
        total_gst: 0,
        total_invoice_value: 0,
      };

      line_items.forEach((item) => {
        summary.total_taxable_value += item.taxable_value;
        summary.total_cgst += item.cgst_amount;
        summary.total_sgst += item.sgst_amount;
        summary.total_igst += item.igst_amount;
        summary.total_cess += item.cess_amount;
        summary.total_gst += item.total_gst;
        summary.total_invoice_value += item.line_total;
      });

      // Round to 2 decimal places
      Object.keys(summary).forEach((key) => {
        summary[key] = Math.round(summary[key] * 100) / 100;
      });

      return summary;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resolve tax for invoice line items
   * @param {Array} line_items - Array of line items
   * @param {Object} invoice_context - { supply_type, place_of_supply }
   * @returns {Array} - Line items with tax resolution
   */
  static async resolveInvoiceLineItemTaxes(line_items, invoice_context) {
    try {
      const resolved_items = [];

      for (const item of line_items) {
        // Resolve tax for this product
        const tax_resolution = await this.resolveProductTax({
          product_id: item.product_id,
          supply_type: invoice_context.supply_type,
          effective_date: new Date(),
        });

        // Validate tax resolution
        this.validateTaxResolution(tax_resolution);

        // Calculate GST amounts
        const gst_calculation = this.calculateGST({
          taxable_value: item.taxable_value,
          tax_resolution,
        });

        resolved_items.push({
          ...item,
          tax_code: tax_resolution.tax_code,
          hsn_code: tax_resolution.hsn_code,
          ...gst_calculation,
        });
      }

      return resolved_items;
    } catch (error) {
      throw error;
    }
  }
}

export default TaxResolutionService;
