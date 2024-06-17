import { PurchasePayments } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let purchase_payment = await PurchasePayments.GetAll({
        start,
        length,
        search,
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
