import { PurchaseInventory } from "../../../../controllers";

export const GetAll = async ({ profile_id }, session, fastify) => {
  try {
    const result = await PurchaseInventory.GetAll({
      start: 0,
      length: 1000, // Get all records
      search: null,
    });

    if (!result) {
      return {
        success: false,
        message: "No purchase inventory data found",
        data: [],
      };
    }

    return {
      success: true,
      message: "Purchase inventory data retrieved successfully",
      data: result.rows || [],
      total: result.count || 0,
    };
  } catch (err) {
    fastify.log.error(err);
    return {
      success: false,
      message: err.message || "Failed to retrieve purchase inventory data",
      data: [],
    };
  }
};
