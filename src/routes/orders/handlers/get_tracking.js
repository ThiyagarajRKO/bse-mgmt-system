import { Orders } from "../../../controllers";

export const GetTracking = ({ order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get enhanced production tracking if available
      let tracking;

      if (Orders.GetWithProductionTracking) {
        tracking = await Orders.GetWithProductionTracking({
          id: order_id,
        });
      } else {
        tracking = await Orders.GetWithTracking({
          id: order_id,
        });
      }

      if (!tracking) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: tracking,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
