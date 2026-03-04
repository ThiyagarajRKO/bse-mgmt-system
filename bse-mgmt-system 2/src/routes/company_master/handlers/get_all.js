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

    const response = {
      draw: Number(params.draw || 1),
      recordsTotal: result.recordsTotal || 0,
      recordsFiltered: result.recordsFiltered || 0,
      data: result.rows || [],
    };

    return response;
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
