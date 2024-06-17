import { PurchasePayment } from "../../../controllers";

export const Get = ({ id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let purchase_payment = await PurchasePayment.Get({
        id: id,
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
