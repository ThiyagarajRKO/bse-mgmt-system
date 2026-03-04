import { OrderProducts } from "../../../controllers";

export const GetMatchingRawMaterialsHandler = (
  { order_product_id, start, length, search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await OrderProducts.GetMatchingRawMaterials({
        order_product_id,
        start: parseInt(start) || 0,
        length: parseInt(length) || 10,
        search,
      });

      resolve({
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      reject(err);
    }
  });
};
