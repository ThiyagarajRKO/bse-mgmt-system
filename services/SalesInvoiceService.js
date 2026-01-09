'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../models');

class SalesInvoiceService {
  /**
   * Generate unique invoice number in format INV-YYYYMMDD-HHMMSS-XXXX
   * @returns {string} Unique invoice number
   */
  generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(
      4,
      '0'
    );

    return `INV-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
  }

  /**
   * Create a sales invoice from a production order
   * @param {Object} invoiceData - { order_id, customer_master_id, invoice_date, created_by }
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(invoiceData) {
    const { order_id, customer_master_id, invoice_date, created_by } =
      invoiceData;

    // Validate input
    if (!order_id || !customer_master_id || !created_by) {
      throw new Error(
        'Missing required fields: order_id, customer_master_id, created_by'
      );
    }

    // Verify order exists
    const order = await db.Order.findByPk(order_id);
    if (!order) {
      throw new Error(`Order not found: ${order_id}`);
    }

    // Verify customer exists
    const customer = await db.CustomerMaster.findByPk(customer_master_id);
    if (!customer) {
      throw new Error(`CustomerMaster not found: ${customer_master_id}`);
    }

    // Check if invoice already exists for this order
    const existingInvoice = await db.SalesInvoice.findOne({
      where: {
        order_id,
        invoice_status: ['DRAFT', 'POSTED'],
      },
    });

    if (existingInvoice) {
      throw new Error(
        `Invoice already exists for this order: ${existingInvoice.invoice_number}`
      );
    }

    // Create invoice in DRAFT status
    const invoice = await db.SalesInvoice.create({
      id: uuidv4(),
      invoice_number: this.generateInvoiceNumber(),
      order_id,
      customer_master_id,
      invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
      invoice_status: 'DRAFT',
      subtotal_amount: 0,
      tax_amount: 0,
      shipping_amount: 0,
      discount_amount: 0,
      net_total_amount: 0,
      created_by,
    });

    return invoice;
  }

  /**
   * Add line item(s) from production outputs to invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Array} lineItems - Array of { production_output_id, quantity }
   * @param {string} added_by - User performing the action
   * @returns {Promise<Array>} Created invoice lines
   */
  async addLineItems(invoiceId, lineItems, added_by) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId);

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    if (invoice.invoice_status !== 'DRAFT') {
      throw new Error(
        `Cannot add line items to invoice in ${invoice.invoice_status} status`
      );
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error('Line items must be a non-empty array');
    }

    const createdLines = [];

    for (const item of lineItems) {
      const { production_output_id, quantity } = item;

      if (!production_output_id || !quantity || quantity <= 0) {
        throw new Error(
          'Each line item must have production_output_id and quantity > 0'
        );
      }

      // Verify production output exists and is inventory_posted
      const productionOutput = await db.ProductionOutput.findByPk(
        production_output_id
      );

      if (!productionOutput) {
        throw new Error(
          `ProductionOutput not found: ${production_output_id}`
        );
      }

      // HARD BLOCK: Cannot invoice without inventory being posted
      if (!productionOutput.inventory_posted) {
        throw new Error(
          `HARD BLOCK: Production output ${productionOutput.sku_code} has not been posted to inventory yet`
        );
      }

      // Verify quantity doesn't exceed available finished goods
      if (quantity > productionOutput.final_output_quantity) {
        throw new Error(
          `Quantity (${quantity}) exceeds available finished goods (${productionOutput.final_output_quantity})`
        );
      }

      // Get product details for HSN and tax
      const product = await db.ProductMaster.findByPk(
        productionOutput.product_master_id
      );
      if (!product) {
        throw new Error(
          `ProductMaster not found: ${productionOutput.product_master_id}`
        );
      }

      // Calculate line costs and tax
      const costPerUnit =
        parseFloat(productionOutput.cost_allocated || 0) /
        parseFloat(productionOutput.final_output_quantity || 1);
      const lineTotal = parseFloat(quantity) * costPerUnit;

      // Get tax rate from product (default 18% GST)
      const taxRate = parseFloat(product.gst_rate || 18);
      const taxAmount = lineTotal * (taxRate / 100);
      const lineNetTotal = lineTotal + taxAmount;

      // Create invoice line
      const line = await db.SalesInvoiceLine.create({
        id: uuidv4(),
        invoice_id: invoiceId,
        production_output_id,
        product_master_id: productionOutput.product_master_id,
        sku_code: productionOutput.sku_code,
        quantity,
        cost_per_unit: costPerUnit,
        line_total: lineTotal,
        hsn_code: product.hsn_code,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        line_net_total: lineNetTotal,
      });

      createdLines.push(line);
    }

    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(invoiceId);

    return createdLines;
  }

  /**
   * Recalculate invoice totals from line items
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Updated invoice
   */
  async recalculateInvoiceTotals(invoiceId) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId, {
      include: [
        {
          model: db.SalesInvoiceLine,
          as: 'invoiceLines',
        },
      ],
    });

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    let subtotal = 0;
    let taxTotal = 0;
    let lineCount = 0;

    invoice.invoiceLines.forEach((line) => {
      subtotal += parseFloat(line.line_total || 0);
      taxTotal += parseFloat(line.tax_amount || 0);
      lineCount++;
    });

    const shippingAmount = parseFloat(invoice.shipping_amount || 0);
    const discountAmount = parseFloat(invoice.discount_amount || 0);
    const netTotal =
      subtotal + taxTotal + shippingAmount - discountAmount;

    invoice.subtotal_amount = subtotal;
    invoice.tax_amount = taxTotal;
    invoice.net_total_amount = netTotal;
    await invoice.save();

    return invoice;
  }

  /**
   * Update shipping and discount amounts, then recalculate
   * @param {string} invoiceId - Invoice ID
   * @param {number} shippingAmount - Shipping amount (optional)
   * @param {number} discountAmount - Discount amount (optional)
   * @param {string} updated_by - User performing the action
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInvoiceCharges(
    invoiceId,
    shippingAmount,
    discountAmount,
    updated_by
  ) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId);

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    if (invoice.invoice_status !== 'DRAFT') {
      throw new Error(
        `Cannot update charges on invoice in ${invoice.invoice_status} status`
      );
    }

    if (shippingAmount !== undefined && shippingAmount !== null) {
      if (shippingAmount < 0) {
        throw new Error('Shipping amount cannot be negative');
      }
      invoice.shipping_amount = shippingAmount;
    }

    if (discountAmount !== undefined && discountAmount !== null) {
      if (discountAmount < 0) {
        throw new Error('Discount amount cannot be negative');
      }
      invoice.discount_amount = discountAmount;
    }

    await invoice.save();

    // Recalculate totals
    return this.recalculateInvoiceTotals(invoiceId);
  }

  /**
   * Post invoice to GL (finalize invoice and create GL entries)
   * @param {string} invoiceId - Invoice ID
   * @param {string} posted_by - User performing the action
   * @returns {Promise<Object>} Updated invoice
   */
  async postInvoiceToGL(invoiceId, posted_by) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId, {
      include: [
        {
          model: db.SalesInvoiceLine,
          as: 'invoiceLines',
        },
      ],
    });

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    if (invoice.invoice_status !== 'DRAFT') {
      throw new Error(
        `Cannot post invoice in ${invoice.invoice_status} status`
      );
    }

    if (invoice.invoiceLines.length === 0) {
      throw new Error('Cannot post invoice without line items');
    }

    // Hard block: Check payment before posting
    const payment = await db.SalesPayment.findOne({
      where: {
        order_id: invoice.order_id,
        payment_status: 'PAID',
      },
    });

    if (!payment) {
      throw new Error(
        'HARD BLOCK: Cannot post invoice without payment received'
      );
    }

    // Update invoice status
    invoice.invoice_status = 'POSTED';
    invoice.posted_date = new Date();
    invoice.posted_by = posted_by;
    await invoice.save();

    // TODO: Create GL entries (Dr AR, Cr Sales Revenue)
    // This will be implemented in GLPostingService

    return invoice;
  }

  /**
   * Cancel invoice
   * @param {string} invoiceId - Invoice ID
   * @param {string} cancelled_by - User performing the action
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated invoice
   */
  async cancelInvoice(invoiceId, cancelled_by, reason) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId);

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    if (invoice.invoice_status === 'CANCELLED') {
      throw new Error('Invoice is already cancelled');
    }

    if (invoice.invoice_status === 'PAID') {
      throw new Error('Cannot cancel a PAID invoice');
    }

    invoice.invoice_status = 'CANCELLED';
    invoice.remarks = `Cancelled by ${cancelled_by}. Reason: ${reason}`;
    await invoice.save();

    return invoice;
  }

  /**
   * Get invoice details with line items
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice with line items
   */
  async getInvoiceDetails(invoiceId) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId, {
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'order_number', 'order_date', 'order_status'],
        },
        {
          model: db.CustomerMaster,
          as: 'customer',
          attributes: ['id', 'customer_name', 'customer_gst_in'],
        },
        {
          model: db.SalesInvoiceLine,
          as: 'invoiceLines',
          include: [
            {
              model: db.ProductMaster,
              as: 'productMaster',
              attributes: ['id', 'product_name', 'sku_code'],
            },
          ],
        },
      ],
    });

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    return invoice;
  }

  /**
   * List invoices with filters
   * @param {Object} filters - { order_id, customer_master_id, invoice_status, date_range }
   * @param {number} limit - Results per page (default 20)
   * @param {number} offset - Pagination offset (default 0)
   * @returns {Promise<Array>} List of invoices
   */
  async listInvoices(filters = {}, limit = 20, offset = 0) {
    const where = {};

    if (filters.order_id) where.order_id = filters.order_id;
    if (filters.customer_master_id)
      where.customer_master_id = filters.customer_master_id;
    if (filters.invoice_status) where.invoice_status = filters.invoice_status;

    // Handle date range filter
    if (filters.date_range && filters.date_range.from && filters.date_range.to) {
      where.invoice_date = {
        [db.Sequelize.Op.between]: [
          new Date(filters.date_range.from),
          new Date(filters.date_range.to),
        ],
      };
    }

    const invoices = await db.SalesInvoice.findAll({
      where,
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'order_number'],
        },
        {
          model: db.CustomerMaster,
          as: 'customer',
          attributes: ['id', 'customer_name'],
        },
      ],
      limit,
      offset,
      order: [['invoice_date', 'DESC']],
    });

    return invoices;
  }

  /**
   * Get revenue summary
   * @param {Object} filters - { from_date, to_date, invoice_status }
   * @returns {Promise<Object>} Revenue summary
   */
  async getRevenueSummary(filters = {}) {
    const where = {};

    if (filters.invoice_status) where.invoice_status = filters.invoice_status;

    if (filters.from_date || filters.to_date) {
      where.invoice_date = {};
      if (filters.from_date) {
        where.invoice_date[db.Sequelize.Op.gte] = new Date(
          filters.from_date
        );
      }
      if (filters.to_date) {
        where.invoice_date[db.Sequelize.Op.lte] = new Date(filters.to_date);
      }
    }

    const invoices = await db.SalesInvoice.findAll({ where });

    const summary = {
      total_invoices: invoices.length,
      total_revenue: 0,
      total_tax: 0,
      total_shipping: 0,
      total_discount: 0,
      net_revenue: 0,
      by_status: {},
    };

    invoices.forEach((inv) => {
      summary.total_revenue += parseFloat(inv.subtotal_amount || 0);
      summary.total_tax += parseFloat(inv.tax_amount || 0);
      summary.total_shipping += parseFloat(inv.shipping_amount || 0);
      summary.total_discount += parseFloat(inv.discount_amount || 0);
      summary.net_revenue += parseFloat(inv.net_total_amount || 0);

      if (!summary.by_status[inv.invoice_status]) {
        summary.by_status[inv.invoice_status] = {
          count: 0,
          amount: 0,
        };
      }
      summary.by_status[inv.invoice_status].count++;
      summary.by_status[inv.invoice_status].amount += parseFloat(
        inv.net_total_amount || 0
      );
    });

    return summary;
  }
}

module.exports = new SalesInvoiceService();
