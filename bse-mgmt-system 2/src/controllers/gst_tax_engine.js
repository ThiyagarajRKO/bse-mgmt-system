import models from "../../models";
import { Op } from "sequelize";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id) => typeof id === "string" && UUID_PATTERN.test(id);

/**
 * Get GST mapping for product and supply type
 * Returns tax code and rates for invoice line item
 */
export const GetProductTaxMapping = async (product_id, supply_type) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidUuid(product_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Product ID format",
        });
      }

      if (!["DOMESTIC", "EXPORT"].includes(supply_type)) {
        return reject({
          statusCode: 422,
          message: "Invalid supply_type. Must be DOMESTIC or EXPORT",
        });
      }

      // Get product tax mapping (Product -> Tax Code)
      const productTaxMapping = await models.ProductTaxMapping.findOne({
        where: {
          product_id,
          supply_type,
          is_active: true,
          effective_from: { [Op.lte]: new Date() },
          [Op.or]: [
            { effective_to: null },
            { effective_to: { [Op.gte]: new Date() } },
          ],
        },
        include: [
          {
            model: models.TaxMaster,
            as: "tax",
            attributes: [
              "tax_code",
              "tax_name",
              "hsn_code",
              "cgst_rate",
              "sgst_rate",
              "igst_rate",
              "cess_rate",
              "tax_type",
              "is_reverse_charge",
            ],
          },
        ],
      });

      if (!productTaxMapping) {
        // Default to zero-rated for export
        if (supply_type === "EXPORT") {
          return resolve({
            statusCode: 200,
            data: {
              tax_code: "EXPORT_ZERO",
              tax_type: "ZERO_RATED",
              cgst_rate: 0,
              sgst_rate: 0,
              igst_rate: 0,
              cess_rate: 0,
              is_reverse_charge: false,
            },
          });
        }

        return reject({
          statusCode: 404,
          message: "No tax mapping found for product",
        });
      }

      const tax = productTaxMapping.tax;

      resolve({
        statusCode: 200,
        data: {
          tax_code: tax.tax_code,
          tax_name: tax.tax_name,
          hsn_code: tax.hsn_code,
          tax_type: tax.tax_type,
          cgst_rate: parseFloat(tax.cgst_rate),
          sgst_rate: parseFloat(tax.sgst_rate),
          igst_rate: parseFloat(tax.igst_rate),
          cess_rate: parseFloat(tax.cess_rate),
          is_reverse_charge: tax.is_reverse_charge,
          supply_type,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Calculate line item tax
 * Returns taxable value, individual taxes, and total
 */
export const CalculateLineTax = async (line_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { product_id, qty_kg, rate_per_kg, supply_type } = line_data;

      // Get tax mapping
      const taxData = await GetProductTaxMapping(product_id, supply_type);
      const tax = taxData.data;

      // Calculate taxable value
      const taxableValue = qty_kg * rate_per_kg;

      // Calculate individual taxes based on supply type
      let cgstAmount = 0,
        sgstAmount = 0,
        igstAmount = 0,
        cessAmount = 0;

      if (supply_type === "DOMESTIC") {
        // Domestic: CGST + SGST
        cgstAmount = (taxableValue * tax.cgst_rate) / 100;
        sgstAmount = (taxableValue * tax.sgst_rate) / 100;
      } else if (supply_type === "EXPORT") {
        // Export: IGST only (usually 0)
        igstAmount =
          supply_type === "EXPORT" ? 0 : (taxableValue * tax.igst_rate) / 100;
      }

      // CESS applies to both
      cessAmount = (taxableValue * tax.cess_rate) / 100;

      const totalGst = cgstAmount + sgstAmount + igstAmount + cessAmount;
      const lineTotal = taxableValue + totalGst;

      resolve({
        statusCode: 200,
        data: {
          taxable_value: parseFloat(taxableValue.toFixed(2)),
          cgst_rate: tax.cgst_rate,
          cgst_amount: parseFloat(cgstAmount.toFixed(2)),
          sgst_rate: tax.sgst_rate,
          sgst_amount: parseFloat(sgstAmount.toFixed(2)),
          igst_rate: tax.igst_rate,
          igst_amount: parseFloat(igstAmount.toFixed(2)),
          cess_rate: tax.cess_rate,
          cess_amount: parseFloat(cessAmount.toFixed(2)),
          total_gst: parseFloat(totalGst.toFixed(2)),
          line_total: parseFloat(lineTotal.toFixed(2)),
          tax_code: tax.tax_code,
          hsn_code: tax.hsn_code,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Calculate full invoice tax
 * Aggregates line items and calculates total taxes
 */
export const CalculateInvoiceTax = async (invoice_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { line_items, supply_type } = invoice_data;

      if (!Array.isArray(line_items) || line_items.length === 0) {
        return reject({
          statusCode: 422,
          message: "Invalid line_items array",
        });
      }

      let totalTaxableValue = 0;
      let totalCgst = 0,
        totalSgst = 0,
        totalIgst = 0,
        totalCess = 0;
      const processedLineItems = [];

      // Process each line item
      for (const item of line_items) {
        const lineData = await CalculateLineTax({
          product_id: item.product_id,
          qty_kg: item.qty_kg,
          rate_per_kg: item.rate_per_kg,
          supply_type,
        });

        const line = lineData.data;
        totalTaxableValue += line.taxable_value;
        totalCgst += line.cgst_amount;
        totalSgst += line.sgst_amount;
        totalIgst += line.igst_amount;
        totalCess += line.cess_amount;

        processedLineItems.push({
          ...item,
          ...line,
        });
      }

      const totalGst = totalCgst + totalSgst + totalIgst + totalCess;
      const invoiceValue = totalTaxableValue + totalGst;

      resolve({
        statusCode: 200,
        data: {
          line_items: processedLineItems,
          total_taxable_value: parseFloat(totalTaxableValue.toFixed(2)),
          total_cgst: parseFloat(totalCgst.toFixed(2)),
          total_sgst: parseFloat(totalSgst.toFixed(2)),
          total_igst: parseFloat(totalIgst.toFixed(2)),
          total_cess: parseFloat(totalCess.toFixed(2)),
          total_gst: parseFloat(totalGst.toFixed(2)),
          invoice_value: parseFloat(invoiceValue.toFixed(2)),
          supply_type,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  GetProductTaxMapping,
  CalculateLineTax,
  CalculateInvoiceTax,
};
