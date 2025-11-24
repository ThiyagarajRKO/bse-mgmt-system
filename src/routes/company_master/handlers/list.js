import * as CompanyMaster from "../../../controllers/company_master";

export const List = async (params, session, fastify) => {
  try {
    // fetch a reasonably large list for dropdowns
    const result = await CompanyMaster.GetAll({
      start: 0,
      length: 1000,
      "search[value]": "",
    });

    // result is { rows, count }
    return {
      success: true,
      data: result.rows || [],
    };
  } catch (err) {
    fastify.log.error(err);
    return {
      success: false,
      message: err.message || "Failed to load companies",
    };
  }
};

export default List;
