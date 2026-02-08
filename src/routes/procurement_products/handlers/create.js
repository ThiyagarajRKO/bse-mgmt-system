import {
  ProcurementLots,
  ProcurementProducts,
  ProductMaster,
} from "../../../controllers";

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
        is_active: true,
      });

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
