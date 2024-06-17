import { PurchasePayment } from "../../../controllers";

export const Update = (
  { profile_id, id, purchse_payment_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await PurchasePayment.Update(
        profile_id,
        id,
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
