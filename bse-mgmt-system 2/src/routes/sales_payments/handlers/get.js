import { SalesPayments } from "../../../controllers";

export const Get = ({ sales_payment_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let sales_payment = await SalesPayments.Get({
        id: sales_payment_id,
      });

      if (!sales_payment) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: sales_payment,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
