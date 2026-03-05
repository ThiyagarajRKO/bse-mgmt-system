import { PurchaseInventory } from "../../../../controllers";

export const GetAll = async (
  {
    profile_id,
    procurement_product_id,
    finished_product_id,
    procurement_product_type,
    start,
    length,
    search,
  },
  session,
  fastify,
) => {
  try {
    const result = await PurchaseInventory.GetAll({
      start: start || 0,
      length: length || 1000, // Get all records
      search: search || null,
      procurement_product_id,
      finished_product_id,
      procurement_product_type,
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
