import { Orders } from "../../../controllers";

export const GetOrderNumbers = (
  { customer_master_id, sales_payment_id, start, length, search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let orders = await Orders.GetOrderNumbers({
        customer_master_id,
        sales_payment_id,
        start,
        length,
        search,
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
