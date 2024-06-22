import { SalesPayments } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let sales_payment = await SalesPayments.GetAll({
        start,
        length,
        search,
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
