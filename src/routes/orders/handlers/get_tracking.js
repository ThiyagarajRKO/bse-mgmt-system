import { Orders } from "../../../controllers";

export const GetTracking = ({ order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Use enhanced production tracking to get full data
      let tracking;

      // Try GetWithProductionTracking first (includes sales inventory, dispatches, peeling, etc)
      if (
        Orders.GetWithProductionTracking &&
        typeof Orders.GetWithProductionTracking === "function"
      ) {
        console.log("[GetTracking] Using GetWithProductionTracking");
        tracking = await Orders.GetWithProductionTracking({
          id: order_id,
        });
      } else if (
        Orders.GetWithTracking &&
        typeof Orders.GetWithTracking === "function"
      ) {
        console.log("[GetTracking] Using GetWithTracking (fallback)");
        tracking = await Orders.GetWithTracking({
          id: order_id,
        });
      } else {
        return reject({
          statusCode: 500,
          message: "No tracking methods available",
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
