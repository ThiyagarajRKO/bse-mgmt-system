import { OrderProducts } from "../../../controllers";

export const GetPaymentItems = (
  {
    sales_payment_id,
    customer_master_id,
    start,
    length,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await OrderProducts.GetPaymentItems({
        sales_payment_id,
        customer_master_id,
        start,
        length,
        search,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: procurement,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
