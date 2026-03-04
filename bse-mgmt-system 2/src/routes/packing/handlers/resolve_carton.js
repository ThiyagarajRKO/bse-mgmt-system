import { ResolveCarton } from "../../../controllers/packing";

export const ResolveCartonHandler = async (params, session, fastify) => {
  try {
    const { primary_packaging_type, quantity, market } = params;

    const result = await ResolveCarton({
      primary_packaging_type,
      quantity,
      market,
    });

    return {
      statusCode: 200,
      message: "Carton resolved successfully",
      data: result,
    };
  } catch (err) {
    throw err;
  }
};
