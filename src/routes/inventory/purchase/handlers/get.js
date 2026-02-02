import { PurchaseInventory } from "../../../../controllers";

export const Get = async (
  {
    draw = 1,
    start = 0,
    length = 10,
    "search[value]": search,
    procurement_product_type,
  },
  session,
  fastify,
) => {
  try {
    const result = await PurchaseInventory.GetAll({
      start: Number(start || 0),
      length: Number(length || 10),
      search,
      procurement_product_type,
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
      data: {
        count: result.count || 0,
        rows: result.rows || [],
      },
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
