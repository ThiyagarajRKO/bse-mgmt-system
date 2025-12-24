import { CalculatePackingMetrics } from "../../../controllers/packing";

export const CalculateMetrics = async (params, session, fastify) => {
  try {
    const { quantity, units_per_carton, carton_details, is_export } = params;

    const result = await CalculatePackingMetrics({
      quantity,
      units_per_carton,
      carton_details,
      is_export,
    });

    return {
      statusCode: 200,
      message: "Packing metrics calculated successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
