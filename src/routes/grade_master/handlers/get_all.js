import { GradeMaster } from "../../../controllers";

export const GetAll = async (
  { draw = 1, start = 0, length = 10, grade_name, "search[value]": search },
  session,
  fastify
) => {
  try {
    const result = await GradeMaster.GetAll({
      start: Number(start || 0),
      length: Number(length || 10),
      grade_name,
      search,
    });

    if (!result) {
      return {
        draw: Number(draw || 1),
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      };
    }

    // Format response for DataTables ServerSide
    return {
      draw: Number(draw || 1),
      recordsTotal: result.count || 0,
      recordsFiltered: result.count || 0,
      data: result.rows || [],
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
