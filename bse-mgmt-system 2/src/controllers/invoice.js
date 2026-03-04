import InvoiceService from "../services/invoice.js";

/**
 * Invoice Controller
 * Handles invoice generation, finalization, and retrieval
 */
export class InvoiceController {
  /**
   * Generate invoice from locked packing list
   * POST /api/invoice/generate
   */
  static async generateInvoice(request, reply) {
    try {
      const { packing_list_id } = request.body;
      const profile_id = request.user?.profile_id;

      if (!packing_list_id) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "packing_list_id is required",
        });
      }

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await InvoiceService.generateInvoice({
        packing_list_id,
        profile_id,
      });

      return reply.code(201).send({
        success: true,
        message: "Invoice generated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to generate invoice",
      });
    }
  }

  /**
   * Preview invoice (calculate taxes without creating records)
   * POST /api/invoice/preview
   */
  static async previewInvoice(request, reply) {
    try {
      const { packing_list_id } = request.body;

      if (!packing_list_id) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "packing_list_id is required",
        });
      }

      const result = await InvoiceService.previewInvoice({
        packing_list_id,
      });

      return reply.code(200).send({
        success: true,
        message: "Invoice preview calculated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error previewing invoice:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to preview invoice",
      });
    }
  }

  /**
   * Finalize invoice (makes it immutable and posts to sales register)
   * PUT /api/invoice/:id/finalize
   */
  static async finalizeInvoice(request, reply) {
    try {
      const { id } = request.params;
      const profile_id = request.user?.profile_id;

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await InvoiceService.finalizeInvoice({
        invoice_id: id,
        profile_id,
      });

      return reply.code(200).send({
        success: true,
        message: "Invoice finalized successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error finalizing invoice:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to finalize invoice",
      });
    }
  }

  /**
   * Get invoice details
   * GET /api/invoice/:id
   */
  static async getInvoice(request, reply) {
    try {
      const { id } = request.params;

      const result = await InvoiceService.getInvoice(id);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch invoice",
      });
    }
  }

  /**
   * Get invoices by packing list
   * GET /api/invoice/packing-list/:packing_list_id
   */
  static async getInvoicesByPackingList(request, reply) {
    try {
      const { packing_list_id } = request.params;

      // This would need to be implemented in the service
      // For now, return a placeholder
      return reply.code(200).send({
        success: true,
        message: "Feature not yet implemented",
        data: [],
      });
    } catch (error) {
      console.error("Error fetching invoices by packing list:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch invoices",
      });
    }
  }

  /**
   * Get invoices by customer
   * GET /api/invoice/customer/:customer_id
   */
  static async getInvoicesByCustomer(request, reply) {
    try {
      const { customer_id } = request.params;
      const { page = 1, limit = 10 } = request.query;

      // This would need to be implemented in the service
      // For now, return a placeholder
      return reply.code(200).send({
        success: true,
        message: "Feature not yet implemented",
        data: {
          invoices: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching invoices by customer:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch invoices",
      });
    }
  }
}

export default InvoiceController;
