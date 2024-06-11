import { OrderProducts } from "../../../controllers";

export const Delete = ({ profile_id, order_product_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order_product = await OrderProducts.Delete({
        profile_id,
        id: order_product_id,
      });

      if (order_product > 0) {
        return resolve({
          message: "Order product has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Order product didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
