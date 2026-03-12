import {
  Dispatches,
  LocationMaster,
  ProcurementProducts,
} from "../../../controllers";
import OrderTrackingService from "../../../services/OrderTrackingService.js";
import { ApplyJournalTemplateInternal } from "../../../controllers/accounting/template";

export const Create = (
  {
    profile_id,
    procurement_product_id,
    unit_master_id,
    dispatch_quantity,
    temperature,
    delivery_notes,
    vehicle_master_id,
    driver_master_id,
    order_id,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // fetch the specific procurement row so we can use its product_master_id
      const prod = await ProcurementProducts.GetQuantity({
        id: procurement_product_id,
      });

      if (!prod || (!prod.procurement_quantity && !prod.adjusted_quantity)) {
        return reject({
          statusCode: 420,
          message: "Invalid product quantity",
        });
      }

      // determine total available quantity for the entire product master
      const totalPurchased =
        await ProcurementProducts.GetTotalQuantityForProduct({
          product_master_id: prod.product_master_id,
        });

      if (dispatch_quantity > totalPurchased) {
        return reject({
          statusCode: 420,
          message: "Dispatched quantity is grater than Procurement quantity",
        });
      }

      const dispatch = await Dispatches.Insert(profile_id, {
        procurement_product_id,
        unit_master_id,
        dispatch_quantity,
        temperature,
        delivery_notes,
        delivery_status: "In Transit",
        vehicle_master_id,
        driver_master_id,
        order_id,
        is_active: true,
      });

      // ✅ SYNC ORDER TRACKING: Update order status based on dispatch creation
      if (order_id) {
        try {
          await OrderTrackingService.syncOrderStatus(order_id);
          console.log(
            `✅ Order tracking synced for dispatch creation: ${order_id}`,
          );
        } catch (trackingError) {
          console.warn(
            `⚠️ Warning: Could not sync order tracking: ${trackingError.message}`,
          );
          // Don't fail dispatch creation if tracking fails
        }
      }

      // Trigger automatic journal entry for DISPATCH
      try {
        // Calculate dispatch cost (quantity * estimated unit cost = quantity * 100 for now)
        const dispatchAmount = dispatch_quantity * 100;
        await ApplyJournalTemplateInternal({
          event_type: "DISPATCH",
          reference_type: "DISPATCH",
          reference_id: dispatch?.id,
          amount: dispatchAmount,
          description: `Dispatch created - ${dispatch_quantity}kg to transit`,
          created_by: profile_id,
        });
      } catch (journalError) {
        console.warn(
          "Journal entry creation failed for DISPATCH (non-blocking):",
          journalError.message,
        );
        // Don't fail the dispatch creation if journal entry fails
      }

      resolve({
        message: "Dispatch data has been inserted successfully",
        data: {
          dispatch_id: dispatch?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
