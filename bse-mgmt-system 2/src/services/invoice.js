import models from "../../models";
import TaxResolutionService from "./tax_resolution.js";
import MarginVarianceService from "./margin_variance.js";

const {
  Invoice,
  InvoiceLineItem,
  PackingList,
  Order,
  OrderProduct,
  SalesRegister,
} = models;

/**
 * Invoice Service
 * Handles invoice generation from packing lists with tax calculations
 */
export class InvoiceService {
  /**
   * Generate invoice from locked packing list
   * @param {Object} params - { packing_list_id, profile_id }
   * @returns {Object} - Generated invoice
   */
  static async generateInvoice({ packing_list_id, profile_id }) {
    try {
      // Get packing list details
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

      if (!packingList.salesOrder || !packingList.salesOrder.orderProducts) {
        throw new Error("Sales order or products not found");
      }

      // Generate invoice number
      const invoice_no = await this.generateInvoiceNumber();

      // Calculate invoice line items with taxes
      const lineItems = [];
      let totalAmount = 0;
      let totalTaxAmount = 0;
      let totalGrossAmount = 0;

      for (const orderProduct of packingList.salesOrder.orderProducts) {
        // Get tax resolution for this product
        const taxResolution = await TaxResolutionService.resolveTax({
          product_id: orderProduct.species_id,
          supply_type: packingList.market === "EXPORT" ? "EXPORT" : "DOMESTIC",
          hsn_code: orderProduct.hsn_code,
        });

        // Calculate line item amounts
        const quantity = orderProduct.quantity;
        const rate = orderProduct.rate || 0;
        const amount = quantity * rate;

        // Calculate tax amounts
        const taxAmount = (amount * taxResolution.effective_rate) / 100;
        const grossAmount = amount + taxAmount;

        // Create line item
        const lineItem = {
          product_id: orderProduct.species_id,
          product_name: orderProduct.product_name,
          hsn_code: orderProduct.hsn_code,
          quantity,
          unit: orderProduct.unit,
          rate,
          amount,
          tax_code: taxResolution.tax_code,
          tax_rate: taxResolution.effective_rate,
          tax_amount: taxAmount,
          gross_amount: grossAmount,
          cgst_rate: taxResolution.cgst_rate || 0,
          cgst_amount: taxResolution.cgst_amount || 0,
          sgst_rate: taxResolution.sgst_rate || 0,
          sgst_amount: taxResolution.sgst_amount || 0,
          igst_rate: taxResolution.igst_rate || 0,
          igst_amount: taxResolution.igst_amount || 0,
        };

        lineItems.push(lineItem);

        totalAmount += amount;
        totalTaxAmount += taxAmount;
        totalGrossAmount += grossAmount;
      }

      // Create invoice record
      const invoice = await Invoice.create({
        invoice_no,
        packing_list_id,
        sales_order_id: packingList.sales_order_id,
        customer_id: packingList.salesOrder.customer_id,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        market: packingList.market,
        total_amount: totalAmount,
        total_tax_amount: totalTaxAmount,
        total_gross_amount: totalGrossAmount,
        status: "DRAFT",
        created_by: profile_id,
        updated_by: profile_id,
      });

      // Create invoice line items
      for (const lineItem of lineItems) {
        await InvoiceLineItem.create({
          invoice_id: invoice.id,
          ...lineItem,
        });
      }

      return {
        invoice_id: invoice.id,
        invoice_no: invoice.invoice_no,
        packing_list_no: packingList.packing_list_no,
        customer_id: invoice.customer_id,
        total_amount: invoice.total_amount,
        total_tax_amount: invoice.total_tax_amount,
        total_gross_amount: invoice.total_gross_amount,
        status: invoice.status,
        line_items_count: lineItems.length,
        created_at: invoice.created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   * @returns {string} - Invoice number
   */
  static async generateInvoiceNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

      // Get the last invoice number for this month
      const lastInvoice = await Invoice.findOne({
        where: {
          invoice_no: {
            [models.Sequelize.Op.like]: `INV/${currentYear}%`,
          },
          is_active: true,
        },
        order: [["invoice_no", "DESC"]],
      });

      let sequenceNumber = 1;
      if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoice_no.split("/").pop());
        sequenceNumber = lastSequence + 1;
      }

      return `INV/${currentYear}/${String(sequenceNumber).padStart(5, "0")}`;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finalize invoice (makes it immutable and triggers sales register posting)
   * @param {Object} params - { invoice_id, profile_id }
   * @returns {Object} - Finalized invoice
   */
  static async finalizeInvoice({ invoice_id, profile_id }) {
    try {
      const invoice = await Invoice.findOne({
        where: {
          id: invoice_id,
          status: "DRAFT",
          is_active: true,
        },
        include: [
          {
            model: InvoiceLineItem,
            as: "lineItems",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found or not in DRAFT status");
      }

      // Update status to FINAL
      await invoice.update({
        status: "FINAL",
        finalized_at: new Date(),
        finalized_by: profile_id,
        updated_by: profile_id,
      });

      // Auto-post to sales register
      await this.postToSalesRegister(invoice, profile_id);

      // Auto-calculate margin variance
      try {
        const marginVarianceResult =
          await MarginVarianceService.processMarginVariance({
            invoice_id,
            profile_id,
          });
        console.log(
          `Margin variance calculated for invoice ${invoice.invoice_no}:`,
          marginVarianceResult
        );
      } catch (marginError) {
        console.error("Error calculating margin variance:", marginError);
        // Don't fail finalization if margin calculation fails
      }

      return {
        invoice_id: invoice.id,
        invoice_no: invoice.invoice_no,
        status: invoice.status,
        finalized_at: invoice.finalized_at,
        finalized_by: invoice.finalized_by,
        sales_register_posted: true,
        margin_variance_calculated: true,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Post invoice to sales register
   * @param {Object} invoice - Invoice object with line items
   * @param {string} profile_id - User profile ID
   */
  static async postToSalesRegister(invoice, profile_id) {
    try {
      // Create sales register entries for each line item
      for (const lineItem of invoice.lineItems) {
        await SalesRegister.create({
          invoice_id: invoice.id,
          invoice_no: invoice.invoice_no,
          invoice_date: invoice.invoice_date,
          customer_id: invoice.customer_id,
          product_id: lineItem.product_id,
          hsn_code: lineItem.hsn_code,
          quantity: lineItem.quantity,
          rate: lineItem.rate,
          amount: lineItem.amount,
          tax_code: lineItem.tax_code,
          tax_rate: lineItem.tax_rate,
          tax_amount: lineItem.tax_amount,
          cgst_rate: lineItem.cgst_rate,
          cgst_amount: lineItem.cgst_amount,
          sgst_rate: lineItem.sgst_rate,
          sgst_amount: lineItem.sgst_amount,
          igst_rate: lineItem.igst_rate,
          igst_amount: lineItem.igst_amount,
          gross_amount: lineItem.gross_amount,
          market: invoice.market,
          created_by: profile_id,
          updated_by: profile_id,
        });
      }
    } catch (error) {
      console.error("Error posting to sales register:", error);
      throw new Error("Failed to post to sales register");
    }
  }

  /**
   * Get invoice details
   * @param {string} invoice_id - Invoice ID
   * @returns {Object} - Invoice details with line items
   */
  static async getInvoice(invoice_id) {
    try {
      const invoice = await Invoice.findOne({
        where: {
          id: invoice_id,
          is_active: true,
        },
        include: [
          {
            model: InvoiceLineItem,
            as: "lineItems",
            where: { is_active: true },
            required: false,
          },
          {
            model: PackingList,
            as: "packingList",
            attributes: ["id", "packing_list_no"],
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return {
        id: invoice.id,
        invoice_no: invoice.invoice_no,
        packing_list: invoice.packingList,
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        market: invoice.market,
        total_amount: invoice.total_amount,
        total_tax_amount: invoice.total_tax_amount,
        total_gross_amount: invoice.total_gross_amount,
        status: invoice.status,
        finalized_at: invoice.finalized_at,
        finalized_by: invoice.finalized_by,
        line_items: invoice.lineItems.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
          tax_code: item.tax_code,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          cgst_rate: item.cgst_rate,
          cgst_amount: item.cgst_amount,
          sgst_rate: item.sgst_rate,
          sgst_amount: item.sgst_amount,
          igst_rate: item.igst_rate,
          igst_amount: item.igst_amount,
          gross_amount: item.gross_amount,
        })),
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Preview invoice (calculate taxes without creating records)
   * @param {Object} params - { packing_list_id }
   * @returns {Object} - Invoice preview
   */
  static async previewInvoice({ packing_list_id }) {
    try {
      // Similar logic to generateInvoice but without creating records
      // This would return the calculated amounts for preview
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

      // Calculate preview data (similar to generateInvoice)
      const previewData = await this.calculateInvoicePreview(packingList);

      return {
        packing_list_id,
        packing_list_no: packingList.packing_list_no,
        ...previewData,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate invoice preview data
   * @param {Object} packingList - Packing list with sales order and products
   * @returns {Object} - Preview calculation data
   */
  static async calculateInvoicePreview(packingList) {
    try {
      const lineItems = [];
      let totalAmount = 0;
      let totalTaxAmount = 0;
      let totalGrossAmount = 0;

      for (const orderProduct of packingList.salesOrder.orderProducts) {
        const taxResolution = await TaxResolutionService.resolveTax({
          product_id: orderProduct.species_id,
          supply_type: packingList.market === "EXPORT" ? "EXPORT" : "DOMESTIC",
          hsn_code: orderProduct.hsn_code,
        });

        const quantity = orderProduct.quantity;
        const rate = orderProduct.rate || 0;
        const amount = quantity * rate;
        const taxAmount = (amount * taxResolution.effective_rate) / 100;
        const grossAmount = amount + taxAmount;

        lineItems.push({
          product_name: orderProduct.product_name,
          hsn_code: orderProduct.hsn_code,
          quantity,
          rate,
          amount,
          tax_code: taxResolution.tax_code,
          tax_rate: taxResolution.effective_rate,
          tax_amount: taxAmount,
          gross_amount: grossAmount,
        });

        totalAmount += amount;
        totalTaxAmount += taxAmount;
        totalGrossAmount += grossAmount;
      }

      return {
        line_items: lineItems,
        total_amount: totalAmount,
        total_tax_amount: totalTaxAmount,
        total_gross_amount: totalGrossAmount,
        line_items_count: lineItems.length,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default InvoiceService;
