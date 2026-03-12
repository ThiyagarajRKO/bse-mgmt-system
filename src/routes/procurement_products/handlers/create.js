import {
  ProcurementLots,
  ProcurementProducts,
  ProductMaster,
} from "../../../controllers";
import { ApplyJournalTemplateInternal } from "../../../controllers/accounting/template";

export const Create = (
  {
    profile_id,
    procurement_date,
    supplier_master_id,
    unit_master_id,
    procurement_lot_id,
    product_master_id,
    procurement_product_type,
    procurement_quantity,
    procurement_price,
    procurement_purchaser,
    order_id,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Getting
      let procurement_lot = await ProcurementLots.Get({
        procurement_date,
        unit_master_id,
      });

      if (procurement_lot?.id) {
        const existingProduct = await ProcurementProducts.FindByFilters({
          procurement_lot_id: procurement_lot?.id,
          product_master_id,
          supplier_master_id,
          procurement_product_type,
        });

        if (existingProduct?.id) {
          // Product already exists - append quantity instead of rejecting
          const updatedQuantity =
            (existingProduct.procurement_quantity || 0) +
            (procurement_quantity || 0);
          await ProcurementProducts.Update(profile_id, existingProduct.id, {
            procurement_quantity: updatedQuantity,
          });
          return resolve({
            message:
              "Procurement quantity has been updated successfully (appended to existing)",
            data: {
              procurement_product_id: existingProduct.id,
              action: "updated",
              updatedQuantity,
            },
          });
        }
      }

      if (!procurement_lot?.id) {
        procurement_lot = await ProcurementLots.Insert(profile_id, {
          procurement_date,
          unit_master_id,
          order_id,
          is_active: true,
        });
      }
      // }

      procurement_lot_id = procurement_lot_id || procurement_lot?.id;

      const existingProduct = await ProcurementProducts.FindByFilters({
        procurement_lot_id,
        product_master_id,
        supplier_master_id,
        procurement_product_type,
      });

      if (existingProduct?.id) {
        // Product already exists - append quantity instead of rejecting
        const updatedQuantity =
          (existingProduct.procurement_quantity || 0) +
          (procurement_quantity || 0);
        await ProcurementProducts.Update(profile_id, existingProduct.id, {
          procurement_quantity: updatedQuantity,
        });
        return resolve({
          message:
            "Procurement quantity has been updated successfully (appended to existing)",
          data: {
            procurement_product_id: existingProduct.id,
            action: "updated",
            updatedQuantity,
          },
        });
      }

      if (!procurement_lot_id) {
        return reject({
          statusCode: 420,
          message: "Invalid procurement lot id!",
        });
      }

      const purchase = await ProcurementProducts.Insert(profile_id, {
        procurement_lot_id,
        product_master_id,
        supplier_master_id,
        procurement_product_type,
        procurement_quantity,
        procurement_price,
        procurement_purchaser,
        order_id,
        is_active: true,
      });

      // Trigger automatic journal entry for PURCHASE_GRN
      try {
        const totalAmount = procurement_quantity * procurement_price;
        await ApplyJournalTemplateInternal({
          event_type: "PURCHASE_GRN",
          reference_type: "PROCUREMENT",
          reference_id: procurement_lot_id,
          amount: totalAmount,
          description: `GRN received for procurement lot ${procurement_lot_id}`,
          created_by: profile_id,
        });
      } catch (journalError) {
        console.warn(
          "Journal entry creation failed for PURCHASE_GRN (non-blocking):",
          journalError.message,
        );
        // Don't fail the procurement creation if journal entry fails
      }

      resolve({
        message: "Procurement has been inserted successfully",
        data: {
          procurement_product_id: purchase?.id,
          action: "created",
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
