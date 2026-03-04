import { PurchasePayments } from "../../../controllers";

export const Get = ({ purchase_payment_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let purchase_payment = await PurchasePayments.Get({
        id: purchase_payment_id,
      });

      if (!purchase_payment) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: purchase_payment,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
