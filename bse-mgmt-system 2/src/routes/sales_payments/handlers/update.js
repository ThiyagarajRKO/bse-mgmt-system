import { SalesPayments } from "../../../controllers";

export const Update = (
  { profile_id, sales_payment_id, sales_payment_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await SalesPayments.Update(
        profile_id,
        sales_payment_id,
        sales_payment_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Sales Payment has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Sales Payment was not updated",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
