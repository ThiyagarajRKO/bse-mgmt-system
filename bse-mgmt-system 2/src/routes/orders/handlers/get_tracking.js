import { Orders } from "../../../controllers";
import OrderTrackingService from "../../../services/OrderTrackingService.js";

export const GetTracking = ({ order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`[GetTracking] Fetching tracking for order: ${order_id}`);

      // Pass fastify so service can access models from the decorated instance
      const tracking = await OrderTrackingService.getOrderTracking(
        order_id,
        fastify,
      );

      if (!tracking) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      console.log(
        `[GetTracking] ✅ Returned tracking with current_stage: ${tracking.current_progress?.current_stage}`,
      );

      resolve({
        data: tracking,
      });
    } catch (err) {
      console.error(`[GetTracking] Error: ${err.message}`);
      fastify.log.error(err);
      reject(err);
    }
  });
};
