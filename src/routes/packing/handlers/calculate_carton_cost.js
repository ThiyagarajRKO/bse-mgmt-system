import { CalculateCartonCost } from "../../../controllers/cost_calculation.js";

export const CalculateCartonCostHandler = async (params, session, fastify) => {
  try {
    const {
      primary_packaging_id,
      secondary_packaging_id,
      carton_id,
      units_per_carton,
      effective_date,
    } = params;

    const result = await CalculateCartonCost({
      primary_packaging_id,
      secondary_packaging_id,
      carton_id,
      units_per_carton,
      effective_date,
    });

    return {
      statusCode: 200,
      message: "Carton cost calculated successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
