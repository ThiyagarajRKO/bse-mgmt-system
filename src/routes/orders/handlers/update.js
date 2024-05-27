import { Orders, OrdersProducts } from "../../../controllers";

export const Update = (
  { profile_id, order_id, order_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await Orders.Update(
        profile_id,
        order_id,
        order_data
      );

      if (updated_data?.[0] > 0) {
        await OrdersProducts.BulkUpsert(
          profile_id,
          peeling_data?.OrdersProducts
        );

        return resolve({
          message: "Order has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Order didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
