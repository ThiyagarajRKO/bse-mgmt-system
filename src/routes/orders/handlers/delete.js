import { Orders, OrderProducts } from "../../../controllers";

export const Delete = ({ profile_id, order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order_products = await OrderProducts.DeleteByOrderId({
        profile_id,
        order_id,
      });

      if (order_products <= 0) {
        return resolve({
          message: "Order data didn't delete successfully",
        });
      }

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
