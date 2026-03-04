"use strict";

const GLPostingService = require("../../services/GLPostingService");

class GLPostingController {
  /**
   * POST /gl/post/production-output/:id
   * Auto-post GL entries for production output
   */
  async postProductionOutput(request, reply) {
    try {
      const { id } = request.params;
      const postedBy = request.user?.username || "system";

      const entries = await GLPostingService.postProductionOutput(id, postedBy);

      return reply.code(201).send({
        success: true,
        message: `${entries.length} GL entries posted for production output`,
        data: entries,
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
   * POST /gl/post/invoice/:id
   * Auto-post GL entries for sales invoice
   */
  async postSalesInvoice(request, reply) {
    try {
      const { id } = request.params;
      const postedBy = request.user?.username || "system";

      const entries = await GLPostingService.postSalesInvoice(id, postedBy);

      return reply.code(201).send({
        success: true,
        message: `${entries.length} GL entries posted for sales invoice`,
        data: entries,
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
   * POST /gl/post/payment/:id
   * Auto-post GL entries for sales payment
   */
  async postPayment(request, reply) {
    try {
      const { id } = request.params;
      const postedBy = request.user?.username || "system";

      const entries = await GLPostingService.postPayment(id, postedBy);

      return reply.code(201).send({
        success: true,
        message: `${entries.length} GL entries posted for payment`,
        data: entries,
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
   * GET /gl/entries
   * List GL entries with filters
   */
  async listEntries(request, reply) {
    try {
      const {
        account_code,
        posting_status,
        from_date,
        to_date,
        limit = 50,
        offset = 0,
      } = request.query;

      const filters = {};
      if (account_code) filters.account_code = account_code;
      if (posting_status) filters.posting_status = posting_status;
      if (from_date) filters.from_date = from_date;
      if (to_date) filters.to_date = to_date;

      const entries = await GLPostingService.listEntries(
        filters,
        parseInt(limit),
        parseInt(offset)
      );

      return reply.send({
        success: true,
        data: entries,
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
   * GET /gl/accounts/:code/balance
   * Get account balance
   */
  async getAccountBalance(request, reply) {
    try {
      const { code } = request.params;
      const { as_of_date } = request.query;

      const balance = await GLPostingService.getAccountBalance(
        code,
        as_of_date ? new Date(as_of_date) : new Date()
      );

      return reply.send({
        success: true,
        data: balance,
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
   * GET /gl/trial-balance
   * Get trial balance
   */
  async getTrialBalance(request, reply) {
    try {
      const { as_of_date } = request.query;

      const trialBalance = await GLPostingService.getTrialBalance(
        as_of_date ? new Date(as_of_date) : new Date()
      );

      return reply.send({
        success: true,
        data: trialBalance,
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
   * PUT /gl/entries/:id/reverse
   * Reverse a GL entry
   */
  async reverseEntry(request, reply) {
    try {
      const { id } = request.params;
      const { reason } = request.body;
      const reversedBy = request.user?.username || "system";

      const reversalEntry = await GLPostingService.reverseEntry(
        id,
        reason,
        reversedBy
      );

      return reply.code(201).send({
        success: true,
        message: "GL entry reversed successfully",
        data: reversalEntry,
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

module.exports = new GLPostingController();
