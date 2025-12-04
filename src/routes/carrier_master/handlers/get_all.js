import { CarrierMaster } from "../../../controllers";

export const GetAll = async (params, session, fastify) => {
  try {
    const start = Number(params.start || 0);
    const length = Number(params.length || 10);

    const result = await CarrierMaster.GetAll({
      start,
      length,
      carrier_name: params.carrier_name,
      carrier_country: params.carrier_country,
      "search[value]": params["search[value]"] || "",
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
