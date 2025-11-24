import { DivisionMaster } from "../../../controllers";

export const GetAll = async (
  { division_name, start, length, "search[value]": search, draw },
  session,
  fastify
) => {
  try {
    const result = await DivisionMaster.GetAll({
      division_name,
      start,
      length,
      search,
    });

    // Normalize rows to plain objects
    const rows = (result.rows || []).map((r) => {
      try {
        if (r && typeof r.toJSON === "function") return r.toJSON();
        return r;
      } catch (e) {
        fastify.log.error("Error normalizing row:", e);
        return r;
      }
    });

    return {
      draw: Number(draw || 1),
      recordsTotal: result.recordsTotal || 0,
      recordsFiltered: result.recordsFiltered || 0,
      data: rows,
    };
  } catch (err) {
    fastify.log.error(err);
    return {
      draw: Number(draw || 1),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: err.message,
    };
  }
};
