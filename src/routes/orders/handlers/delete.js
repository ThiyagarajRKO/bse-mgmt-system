import { Orders, OrderProducts } from "../../../controllers";

export const Delete = ({ profile_id, order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to delete order products first (if any exist)
      try {
        await OrderProducts.DeleteByOrderId({
          profile_id,
          order_id,
        });
      } catch (err) {
        // Log but don't fail if order products deletion fails
        fastify.log.warn("Warning deleting order products:", err?.message);
      }

      // Now delete the order itself
      const order = await Orders.Delete({
        profile_id,
        id: order_id,
      });

      if (order > 0) {
        return resolve({
          message: "Order has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Order didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
