import { Orders } from "../../../controllers";

export const GetOrderProducts = (
  { order_id, start, length, "search[value]": search },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get order products
      let orderProducts = await Orders.GetOrderProducts({
        order_id,
        start,
        length,
        search,
      });

      if (!orderProducts) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        count: orderProducts.count,
        rows: orderProducts.rows,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
