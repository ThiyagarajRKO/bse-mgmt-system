import * as CompanyMaster from "../../../controllers/company_master";

export const GetAll = async (params, session, fastify) => {
  try {
    const start = Number(params.start || 0);
    const length = Number(params.length || 10);

    const tableSearch = params["search[value]"] || "";
    const search = params.search || "";

    const result = await CompanyMaster.GetAll({
      start,
      length,
      company_name: params.company_name,
      tableSearch,
      search,
    });

    return {
      draw: Number(params.draw || 1),
      recordsTotal: result.count || 0,
      recordsFiltered: result.count || 0,
      data: result.rows || [],
    };
  } catch (err) {
    fastify.log.error(err);
    return {
      draw: Number(params.draw || 1),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: err.message,
    };
  }
};
