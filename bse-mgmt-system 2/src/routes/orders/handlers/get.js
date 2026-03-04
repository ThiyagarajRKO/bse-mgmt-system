import { Orders } from "../../../controllers";

export const Get = ({ order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let orders = await Orders.Get({
        id: order_id,
      });

      if (!orders) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: orders,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
