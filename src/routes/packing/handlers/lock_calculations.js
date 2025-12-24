import { LockPackingCalculations } from "../../../controllers/packing";

export const LockCalculations = async (params, session, fastify) => {
  try {
    const { packing_calculation_id } = params;

    const result = await LockPackingCalculations({
      packing_calculation_id,
    });

    return {
      statusCode: 200,
      message: "Packing calculations locked successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
