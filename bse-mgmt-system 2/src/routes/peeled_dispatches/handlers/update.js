import { PeeledDispatches, PeelingProducts } from "../../../controllers";
import OrderTrackingService from "../../../services/OrderTrackingService.js";

export const Update = (
  { profile_id, peeled_dispatch_id, peeled_dispatch_data },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!peeled_dispatch_data?.peeled_dispatch_quantity) {
        if (!peeled_dispatch_data?.peeling_product_id) {
          return reject({
            statusCode: 420,
            message: "peeled and dispatched product id must not be empty",
          });
        }
        const { yield_quantity } = await PeelingProducts.GetQuantity({
          id: peeled_dispatch_data?.peeled_product_id,
        });

        if (!yield_quantity) {
          return reject({
            statusCode: 420,
            message: "Invalid product quantity",
          });
        } else if (
          yield_quantity < peeled_dispatch_data?.peeled_dispatch_quantity
        ) {
          return reject({
            statusCode: 420,
            message: "Dispatched quantity is grater than Procurement quantity",
          });
        }
      }

      const updated_data = await PeeledDispatches.Update(
        profile_id,
        peeled_dispatch_id,
        peeled_dispatch_data,
      );

      if (updated_data?.[0] > 0) {
        // ✅ SYNC ORDER TRACKING: Update order status based on peeled dispatch update
        // Get the peeled dispatch to retrieve order_id
        try {
          const peeledDispatch =
            await PeeledDispatches.GetById(peeled_dispatch_id);
          if (peeledDispatch?.order_id) {
            await OrderTrackingService.syncOrderStatus(peeledDispatch.order_id);
            console.log(
              `✅ Order tracking synced for peeled dispatch update: ${peeledDispatch.order_id}`,
            );
          }
        } catch (trackingError) {
          console.warn(
            `⚠️ Warning: Could not sync order tracking: ${trackingError.message}`,
          );
          // Don't fail peeled dispatch update if tracking fails
        }

        return resolve({
          message: "Dispatch data has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Dispatch data didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
