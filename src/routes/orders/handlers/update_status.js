import { Orders } from "../../../controllers";

export const UpdateStatus = (
  { profile_id, order_id, order_status, delivery_status },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        return reject({
          statusCode: 420,
          message: "Order ID must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "Profile ID must not be empty!",
        });
      }

      // Prepare update data
      const updateData = {};
      if (order_status !== undefined) {
        updateData.order_status = order_status;
      }
      if (delivery_status !== undefined) {
        updateData.delivery_status = delivery_status;
      }

      if (Object.keys(updateData).length === 0) {
        return reject({
          statusCode: 420,
          message: "At least one status field must be provided!",
        });
      }

      const updated_data = await Orders.Update(
        profile_id,
        order_id,
        updateData,
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Order status has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Order status didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
