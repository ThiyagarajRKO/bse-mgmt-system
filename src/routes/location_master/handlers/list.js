import * as LocationMaster from "../../../controllers/location_master";

export const List = async (params, session, fastify) => {
  try {
    // fetch a reasonably large list for dropdowns
    const result = await LocationMaster.GetAll({
      start: 0,
      length: 1000,
      search: "",
    });

    // result is { rows, count }
    return {
      success: true,
      data: result.rows || [],
    };
  } catch (err) {
    console.log("Location list error:", err);
    return {
      success: false,
      message: err.message,
    };
  }
};
