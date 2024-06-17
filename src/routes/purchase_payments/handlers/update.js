import { PurchasePayments } from "../../../controllers";

export const Update = (
  { profile_id, purchase_payment_id, purchase_payment_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await PurchasePayments.Update(
        profile_id,
        purchase_payment_id,
        purchase_payment_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Purchase Payment has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Purchase Payment was not updated",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
