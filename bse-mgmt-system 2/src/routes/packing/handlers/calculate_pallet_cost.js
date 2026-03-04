import { CalculatePalletCost } from "../../../controllers/cost_calculation.js";

export const CalculatePalletCostHandler = async (params, session, fastify) => {
  try {
    const {
      pallet_id,
      cartons_per_pallet,
      carton_cost_per_carton,
      strapping_cost,
      label_cost,
      effective_date,
    } = params;

    const result = await CalculatePalletCost({
      pallet_id,
      cartons_per_pallet,
      carton_cost_per_carton,
      strapping_cost,
      label_cost,
      effective_date,
    });

    return {
      statusCode: 200,
      message: "Pallet cost calculated successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
