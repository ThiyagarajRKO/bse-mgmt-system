"use strict";

const models = require("../../models");
const { Op } = require("sequelize");

class SalesInvoiceService {
  /**
   * Generate invoice number
   */
  static async generateInvoiceNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    // Get count of invoices created today
    const todayStart = new Date(year, today.getMonth(), today.getDate());
    const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1);

    const count = await models.SalesInvoice.count({
      where: {
        created_at: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `INV-${year}${month}${day}-${sequence}`;
  }

  /**
   * Create invoice from order with auto-generated line items
   */
  static async createInvoice(invoiceData) {
    const {
      order_id,
      customer_master_id,
      invoice_date,
      created_by,
      auto_generate_lines,
    } = invoiceData;

    try {
      // Fetch order with its products and production outputs
      const order = await models.Orders.findByPk(order_id, {
        include: [
          {
            model: models.OrderProducts,
            as: "order_products",
            include: [
              {
                model: models.ProductMaster,
                as: "product",
              },
              {
                model: models.ProductGstMapping,
                as: "gst_mapping",
              },
            ],
          },
          {
            model: models.production_orders,
            as: "production_orders",
            include: [
              {
                model: models.ProductionOutput,
                as: "outputs",
              },
            ],
          },
          {
            model: models.CustomerMaster,
          },
          {
            model: models.ShippingMaster,
          },
        ],
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Generate invoice number
      const invoice_number = await this.generateInvoiceNumber();

      // Create invoice
      const invoice = await models.SalesInvoice.create({
        invoice_number,
        invoice_date: invoice_date || new Date(),
        customer_id: customer_master_id || order.customer_master_id,
        order_id,
        order_reference: order.order_no,
        shipping_location_id: order.shipping_master_id,
        status: "draft",
        is_posted: false,
        created_by,
      });

      // Auto-generate line items if requested
      if (
        auto_generate_lines &&
        order.order_products &&
        order.order_products.length > 0
      ) {
        const lineItems = [];

        for (const orderProduct of order.order_products) {
          // Get GST rate
          const gstMapping = await models.ProductGstMapping.findOne({
            where: {
              product_id: orderProduct.product_id,
              is_active: true,
            },
            include: [
              {
                model: models.ConsolidatedGstMaster,
                as: "gst_master",
              },
            ],
          });

          const taxRate = gstMapping?.gst_master?.cgst_rate || 0;
          const quantity = orderProduct.quantity_ordered || 0;
          const rate = orderProduct.unit_price || 0;

          const lineAmount = quantity * rate;
          const taxAmount = (lineAmount * taxRate) / 100;
          const total = lineAmount + taxAmount;

          lineItems.push({
            sales_invoice_id: invoice.id,
            product_id: orderProduct.product_id,
            order_product_id: orderProduct.id,
            quantity: quantity,
            unit: orderProduct.unit_of_measure,
            rate: rate,
            discount_percent: orderProduct.discount_percent || 0,
            amount: lineAmount,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total: total,
            is_active: true,
            created_by,
          });
        }

        // Bulk create line items
        if (lineItems.length > 0) {
          await models.SalesInvoiceLineItem.bulkCreate(lineItems);
        }

        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const totalTax = lineItems.reduce(
          (sum, item) => sum + item.tax_amount,
          0,
        );
        const totalAmount = lineItems.reduce(
          (sum, item) => sum + item.total,
          0,
        );

        // Update invoice totals
        await invoice.update({
          subtotal,
          total_tax: totalTax,
          total_amount: totalAmount,
        });
      }

      return invoice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk generate invoices from multiple orders
   */
  static async bulkGenerateInvoices(orderIds, options = {}) {
    const { auto_generate_lines = true, created_by = "system" } = options;

    try {
      const generatedInvoices = [];

      for (const orderId of orderIds) {
        const invoice = await this.createInvoice({
          order_id: orderId,
          customer_master_id: null,
          invoice_date: new Date(),
          created_by,
          auto_generate_lines,
        });

        generatedInvoices.push(invoice);
      }

      return generatedInvoices;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate invoices for all unfulfilled orders
   */
  static async generateInvoicesForReadyOrders(options = {}) {
    const { auto_generate_lines = true, created_by = "system" } = options;

    try {
      // Find orders that are ready to be invoiced
      // (dispatched or partially dispatched but not yet invoiced)
      const readyOrders = await models.Orders.findAll({
        where: {
          order_status: {
            [Op.in]: ["dispatched", "partially_dispatched"],
          },
          is_active: true,
        },
        attributes: ["id"],
        raw: true,
      });

      if (readyOrders.length === 0) {
        return { generated: 0, invoices: [] };
      }

      const orderIds = readyOrders.map((o) => o.id);
      const invoices = await this.bulkGenerateInvoices(orderIds, {
        auto_generate_lines,
        created_by,
      });

      return {
        generated: invoices.length,
        invoices,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending orders ready for invoicing with pagination
   */
  static async getPendingOrdersForInvoicing(limit = 20, offset = 0) {
    try {
      const pendingOrders = await models.Orders.findAndCountAll({
        where: {
          order_status: {
            [Op.in]: ["dispatched", "partially_dispatched"],
          },
          is_active: true,
        },
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["id", "customer_name"],
            as: "customer_master",
          },
          {
            model: models.OrderProducts,
            as: "order_products",
            attributes: ["id", "product_id", "quantity_ordered", "unit_price"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return pendingOrders;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add line items to existing invoice
   */
  static async addLineItems(invoiceId, lineItems) {
    try {
      const invoice = await models.SalesInvoice.findByPk(invoiceId);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const createdItems = await models.SalesInvoiceLineItem.bulkCreate(
        lineItems.map((item) => ({
          ...item,
          sales_invoice_id: invoiceId,
        })),
      );

      // Recalculate invoice totals
      const items = await models.SalesInvoiceLineItem.findAll({
        where: { sales_invoice_id: invoiceId },
      });

      const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalTax = items.reduce(
        (sum, item) => sum + (item.tax_amount || 0),
        0,
      );
      const totalAmount = items.reduce(
        (sum, item) => sum + (item.total || 0),
        0,
      );

      await invoice.update({
        subtotal,
        total_tax: totalTax,
        total_amount: totalAmount,
      });

      return createdItems;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get revenue summary
   */
  static async getRevenueSummary(filters = {}) {
    try {
      const where = {
        is_active: true,
      };

      if (filters.from_date && filters.to_date) {
        where.invoice_date = {
          [Op.between]: [
            new Date(filters.from_date),
            new Date(filters.to_date),
          ],
        };
      }

      if (filters.invoice_status) {
        where.status = filters.invoice_status;
      }

      const summary = await models.SalesInvoice.findAll({
        attributes: [
          [
            models.sequelize.fn("COUNT", models.sequelize.col("id")),
            "total_invoices",
          ],
          [
            models.sequelize.fn("SUM", models.sequelize.col("total_amount")),
            "total_revenue",
          ],
          "status",
        ],
        where,
        group: ["status"],
        raw: true,
      });

      const totalRow = await models.SalesInvoice.findOne({
        attributes: [
          [
            models.sequelize.fn("COUNT", models.sequelize.col("id")),
            "total_invoices",
          ],
          [
            models.sequelize.fn("SUM", models.sequelize.col("total_amount")),
            "total_revenue",
          ],
        ],
        where,
        raw: true,
      });

      return {
        summary: summary || [],
        totals: totalRow,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * List invoices with filters and pagination
   */
  static async listInvoices(filters = {}, limit = 20, offset = 0) {
    try {
      const where = { is_active: true };

      if (filters.order_id) {
        where.order_id = filters.order_id;
      }

      if (filters.customer_master_id) {
        where.customer_id = filters.customer_master_id;
      }

      if (filters.invoice_status) {
        where.status = filters.invoice_status;
      }

      if (filters.date_range) {
        where.invoice_date = {};
        if (filters.date_range.from) {
          where.invoice_date[Op.gte] = new Date(filters.date_range.from);
        }
        if (filters.date_range.to) {
          where.invoice_date[Op.lte] = new Date(filters.date_range.to);
        }
      }

      const invoices = await models.SalesInvoice.findAndCountAll({
        where,
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["id", "customer_name"],
          },
          {
            model: models.SalesInvoiceLineItem,
            as: "line_items",
            attributes: ["id", "quantity", "rate", "amount", "tax_amount"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return invoices;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoice details with line items
   */
  static async getInvoiceDetails(invoiceId) {
    try {
      const invoice = await models.SalesInvoice.findByPk(invoiceId, {
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["id", "customer_name", "gstin"],
          },
          {
            model: models.Orders,
            attributes: ["id", "order_no", "order_date"],
          },
          {
            model: models.SalesInvoiceLineItem,
            as: "line_items",
            include: [
              {
                model: models.ProductMaster,
                attributes: ["id", "product_name"],
              },
            ],
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return invoice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update invoice charges (shipping, discount, etc.)
   */
  static async updateInvoiceCharges(
    invoiceId,
    shippingAmount = 0,
    discountAmount = 0,
    updatedBy = "system",
  ) {
    try {
      const invoice = await models.SalesInvoice.findByPk(invoiceId);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Calculate new total
      const subtotal = invoice.subtotal || 0;
      const totalTax = invoice.total_tax || 0;
      const newTotal =
        subtotal + totalTax + (shippingAmount || 0) - (discountAmount || 0);

      await invoice.update({
        shipping_charge: shippingAmount,
        discount_amount: discountAmount,
        total_amount: newTotal,
        updated_by: updatedBy,
      });

      return invoice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Post invoice to GL (Accounting)
   */
  static async postInvoiceToGL(invoiceId, postedBy) {
    try {
      const invoice = await models.SalesInvoice.findByPk(invoiceId, {
        include: [
          {
            model: models.SalesInvoiceLineItem,
            as: "line_items",
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.is_posted) {
        throw new Error("Invoice already posted");
      }

      // Create GL posting entry (this would integrate with your accounting module)
      // For now, we'll just update the invoice status
      await invoice.update({
        status: "posted",
        is_posted: true,
        updated_by: postedBy,
      });

      return invoice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  static async cancelInvoice(invoiceId, cancelledBy) {
    try {
      const invoice = await models.SalesInvoice.findByPk(invoiceId);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      await invoice.update({
        status: "cancelled",
        deleted_by: cancelledBy,
        deleted_at: new Date(),
      });

      return invoice;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SalesInvoiceService;
