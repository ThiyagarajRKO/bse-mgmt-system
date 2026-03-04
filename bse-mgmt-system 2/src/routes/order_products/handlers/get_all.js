import { OrderProducts } from "../../../controllers";

export const GetAll = (
  { start, length, order_id, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate required order_id
      if (!order_id) {
        return reject({
          statusCode: 422,
          message: "order_id parameter is required",
        });
      }

      // Parse start and length to integers with defaults
      const parsedStart = parseInt(start) || 0;
      const parsedLength = parseInt(length) || 10;

      // Validate start and length are non-negative
      if (parsedStart < 0 || parsedLength < 0) {
        return reject({
          statusCode: 422,
          message: "start and length must be non-negative numbers",
        });
      }

      // Creating User
      let order_products = await OrderProducts.GetAll({
        start: parsedStart,
        length: parsedLength,
        order_id,
        search,
      });

      if (!order_products) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: order_products,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
