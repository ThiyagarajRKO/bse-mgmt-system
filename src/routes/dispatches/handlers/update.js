import { Dispatches, ProcurementProducts } from "../../../controllers";
import OrderTrackingService from "../../../services/OrderTrackingService.js";

export const Update = (
  { profile_id, dispatch_id, dispatch_data },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!dispatch_data?.dispatch_quantity) {
        if (!dispatch_data?.procurement_product_id) {
          return reject({
            statusCode: 420,
            message: "procurement product id must not be empty",
          });
        }
        const { procurement_quantity, adjusted_quantity } =
          await ProcurementProducts.GetQuantity({
            id: dispatch_data?.procurement_product_id,
          });

        if (!procurement_quantity && !adjusted_quantity) {
          return reject({
            statusCode: 420,
            message: "Invalid product quantity",
          });
        } else if (
          (adjusted_quantity || procurement_quantity) <
          dispatch_data?.dispatch_quantity
        ) {
          return reject({
            statusCode: 420,
            message: "Dispatched quantity is grater than Procurement quantity",
          });
        }
      }

      const updated_data = await Dispatches.Update(
        profile_id,
        dispatch_id,
        dispatch_data,
      );

      if (updated_data?.[0] > 0) {
        // ✅ SYNC ORDER TRACKING: Update order status based on dispatch update
        // Get the dispatch to retrieve order_id
        try {
          const dispatch = await Dispatches.GetById(dispatch_id);
          if (dispatch?.order_id) {
            await OrderTrackingService.syncOrderStatus(dispatch.order_id);
            console.log(
              `✅ Order tracking synced for dispatch update: ${dispatch.order_id}`,
            );
          }
        } catch (trackingError) {
          console.warn(
            `⚠️ Warning: Could not sync order tracking: ${trackingError.message}`,
          );
          // Don't fail dispatch update if tracking fails
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
