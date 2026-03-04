import { SalesPayments } from "../../../controllers";

export const Delete = ({ profile_id, sales_payment_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const sales_payment = await SalesPayments.Delete({
        profile_id,
        id: sales_payment_id,
      });

      if (sales_payment > 0) {
        return resolve({
          message: "Sales Payment has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Sales Payment was not deleted",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
