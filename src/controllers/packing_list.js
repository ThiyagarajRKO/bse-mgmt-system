import PackingListService from "../services/packing_list.js";

/**
 * Packing List Controller
 * Handles packing list generation, approval, and locking
 */
export class PackingListController {
  /**
   * Generate packing list from sales order
   * POST /api/packing-list/generate
   */
  static async generatePackingList(request, reply) {
    try {
      const { sales_order_id } = request.body;
      const profile_id = request.user?.profile_id;

      if (!sales_order_id) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "sales_order_id is required",
        });
      }

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await PackingListService.generatePackingList({
        sales_order_id,
        profile_id,
      });

      return reply.code(201).send({
        success: true,
        message: "Packing list generated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error generating packing list:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to generate packing list",
      });
    }
  }

  /**
   * Approve packing list
   * PUT /api/packing-list/:id/approve
   */
  static async approvePackingList(request, reply) {
    try {
      const { id } = request.params;
      const profile_id = request.user?.profile_id;

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await PackingListService.approvePackingList({
        packing_list_id: id,
        profile_id,
      });

      return reply.code(200).send({
        success: true,
        message: "Packing list approved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error approving packing list:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to approve packing list",
      });
    }
  }

  /**
   * Lock packing list
   * PUT /api/packing-list/:id/lock
   */
  static async lockPackingList(request, reply) {
    try {
      const { id } = request.params;
      const profile_id = request.user?.profile_id;

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await PackingListService.lockPackingList({
        packing_list_id: id,
        profile_id,
      });

      return reply.code(200).send({
        success: true,
        message: "Packing list locked successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error locking packing list:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to lock packing list",
      });
    }
  }

  /**
   * Get packing list details
   * GET /api/packing-list/:id
   */
  static async getPackingList(request, reply) {
    try {
      const { id } = request.params;

      const result = await PackingListService.getPackingList(id);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching packing list:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch packing list",
      });
    }
  }

  /**
   * Get packing lists by sales order
   * GET /api/packing-list/order/:sales_order_id
   */
  static async getPackingListsByOrder(request, reply) {
    try {
      const { sales_order_id } = request.params;

      // This would need to be implemented in the service
      // For now, return a placeholder
      return reply.code(200).send({
        success: true,
        message: "Feature not yet implemented",
        data: [],
      });
    } catch (error) {
      console.error("Error fetching packing lists by order:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch packing lists",
      });
    }
  }
}

export default PackingListController;
