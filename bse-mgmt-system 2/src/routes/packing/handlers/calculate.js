import { CalculatePacking } from "../../../controllers/packing";

export const Calculate = async (params, session, fastify) => {
  try {
    const { product_id, market, quantity } = params;

    const result = await CalculatePacking({
      product_id,
      market,
      quantity,
    });

    return {
      statusCode: 200,
      message: "Packing calculations completed successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
