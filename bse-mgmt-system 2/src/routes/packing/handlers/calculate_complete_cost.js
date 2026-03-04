import { CalculateCompletePackagingCost } from "../../../controllers/cost_calculation.js";

export const CalculateCompletePackagingCostHandler = async (
  params,
  session,
  fastify
) => {
  try {
    const {
      primary_packaging_id,
      secondary_packaging_id,
      carton_id,
      pallet_id,
      units_per_carton,
      cartons_per_pallet,
      total_units,
      net_weight_kg,
      is_export,
      strapping_cost,
      label_cost,
      effective_date,
    } = params;

    const result = await CalculateCompletePackagingCost({
      primary_packaging_id,
      secondary_packaging_id,
      carton_id,
      pallet_id,
      units_per_carton,
      cartons_per_pallet,
      total_units,
      net_weight_kg,
      is_export,
      strapping_cost,
      label_cost,
      effective_date,
    });

    return {
      statusCode: 200,
      message: "Complete packaging cost calculated successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
