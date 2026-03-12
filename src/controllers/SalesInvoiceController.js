"use strict";

const SalesInvoiceService = require("../../services/SalesInvoiceService");

class SalesInvoiceController {
  /**
   * POST /sales/invoices
   * Create a new sales invoice
   */
  async createInvoice(request, reply) {
    try {
      const { order_id, customer_master_id, invoice_date } = request.body;
      const created_by = request.user?.username || "system";

      const { auto_generate_lines = false } = request.body;

      const invoice = await SalesInvoiceService.createInvoice({
        order_id,
        customer_master_id,
        invoice_date,
        created_by,
        auto_generate_lines: !!auto_generate_lines,
      });

      return reply.code(201).send({
        success: true,
        message: "Invoice created successfully",
        data: invoice,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /sales/invoices/:id/line-items
   * Add line items from production outputs to invoice
   */
  async addLineItems(request, reply) {
    try {
      const { id } = request.params;
      const { line_items } = request.body;
      const added_by = request.user?.username || "system";

      const lines = await SalesInvoiceService.addLineItems(
        id,
        line_items,
        added_by,
      );

      return reply.code(201).send({
        success: true,
        message: `${lines.length} line item(s) added successfully`,
        data: lines,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/invoices/:id/charges
   * Update shipping and discount amounts
   */
  async updateCharges(request, reply) {
    try {
      const { id } = request.params;
      const { shipping_amount, discount_amount } = request.body;
      const updated_by = request.user?.username || "system";

      const invoice = await SalesInvoiceService.updateInvoiceCharges(
        id,
        shipping_amount,
        discount_amount,
        updated_by,
      );

      return reply.send({
        success: true,
        message: "Invoice charges updated",
        data: invoice,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/invoices/:id
   * Get invoice details with line items
   */
  async getInvoiceDetails(request, reply) {
    try {
      const { id } = request.params;

      const invoice = await SalesInvoiceService.getInvoiceDetails(id);

      return reply.send({
        success: true,
        data: invoice,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/invoices
   * List invoices with filters
   */
  async listInvoices(request, reply) {
    try {
      const {
        order_id,
        customer_master_id,
        invoice_status,
        from_date,
        to_date,
        limit = 20,
        offset = 0,
      } = request.query;

      const filters = {};
      if (order_id) filters.order_id = order_id;
      if (customer_master_id) filters.customer_master_id = customer_master_id;
      if (invoice_status) filters.invoice_status = invoice_status;

      if (from_date || to_date) {
        filters.date_range = {};
        if (from_date) filters.date_range.from = from_date;
        if (to_date) filters.date_range.to = to_date;
      }

      const invoices = await SalesInvoiceService.listInvoices(
        filters,
        parseInt(limit),
        parseInt(offset),
      );

      return reply.send({
        success: true,
        data: invoices,
        pagination: { limit, offset },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/invoices/:id/post
   * Post invoice to GL (finalize and create GL entries)
   */
  async postInvoiceToGL(request, reply) {
    try {
      const { id } = request.params;
      const posted_by = request.user?.username || "system";

      const invoice = await SalesInvoiceService.postInvoiceToGL(id, posted_by);

      return reply.send({
        success: true,
        message: "Invoice posted to GL successfully",
        data: invoice,
      });
    } catch (error) {
      request.log.error(error);
      const statusCode = error.message.includes("HARD BLOCK") ? 403 : 400;
      return reply.code(statusCode).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /sales/invoices/:id/cancel
   * Cancel invoice
   */
  async cancelInvoice(request, reply) {
    try {
      const { id } = request.params;
      const { reason } = request.body;
      const cancelled_by = request.user?.username || "system";

      const invoice = await SalesInvoiceService.cancelInvoice(
        id,
        cancelled_by,
        reason,
      );

      return reply.send({
        success: true,
        message: "Invoice cancelled",
        data: invoice,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /sales/invoices/summary/revenue
   * Get revenue summary
   */
  async getRevenueSummary(request, reply) {
    try {
      const { from_date, to_date, invoice_status } = request.query;

      const filters = {};
      if (from_date) filters.from_date = from_date;
      if (to_date) filters.to_date = to_date;
      if (invoice_status) filters.invoice_status = invoice_status;

      const summary = await SalesInvoiceService.getRevenueSummary(filters);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new SalesInvoiceController();
