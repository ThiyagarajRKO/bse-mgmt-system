import { PurchasePayments } from "../../../controllers";

export const Delete = (
  { profile_id, purchase_payment_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const purchase_payment = await PurchasePayments.Delete({
        profile_id,
        id: purchase_payment_id,
      });

      if (purchase_payment > 0) {
        return resolve({
          message: "Purchase Payment has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Purchase Payment was not deleted",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
