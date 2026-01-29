import { SalesInventory } from "../../../../controllers";

export const GetAll = async (
  { profile_id, start, length, search },
  session,
  fastify,
) => {
  try {
    const result = await SalesInventory.GetAll({
      start: start || 0,
      length: length || 1000,
      search: search || null,
    });

    if (!result) {
      return {
        success: false,
        message: "No sales inventory data found",
        data: [],
      };
    }

    return {
      success: true,
      message: "Sales inventory data retrieved successfully",
      data: result.rows || [],
      total: result.count || 0,
    };
  } catch (err) {
    fastify.log.error(err);
    return {
      success: false,
      message: err.message || "Failed to retrieve sales inventory data",
      data: [],
    };
  }
};
