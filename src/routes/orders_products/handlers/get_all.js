import { OrdersProducts } from "../../../controllers";

export const GetAll = (
  { start, length, order_id, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let order_products = await OrdersProducts.GetAll({
        start,
        length,
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
