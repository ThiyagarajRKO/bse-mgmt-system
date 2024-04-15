import {
  ProcurementLots,
  ProcurementProducts,
  ProductMaster,
} from "../../../controllers";

export const Create = (
  {
    profile_id,
    procurement_date,
    vendor_master_id,
    unit_master_id,
    procurement_lot_id,
    product_master_id,
    procurement_product_type,
    procurement_quantity,
    procurement_price,
    procurement_purchaser,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Getting
      let procurement_lot = await ProcurementLots.Get({
        procurement_date,
        unit_master_id,
      });

      if (procurement_lot?.id) {
        const procurement_product = await ProcurementProducts.Count({
          procurement_lot_id: procurement_lot?.id,
          product_master_id,
          vendor_master_id,
          procurement_product_type,
        });

        if (procurement_product > 0) {
          return reject({
            statusCode: 420,
            message: "Procurement product already exist!",
          });
        }
      }

      if (!procurement_lot?.id) {
        procurement_lot = await ProcurementLots.Insert(profile_id, {
          procurement_date,
          unit_master_id,
          is_active: true,
        });
      }
      // }

      procurement_lot_id = procurement_lot_id || procurement_lot?.id;

      const procurement_product = await ProcurementProducts.Count({
        procurement_lot_id,
        product_master_id,
        vendor_master_id,
        procurement_product_type,
      });

      if (procurement_product > 0) {
        return reject({
          message: "Procurement product already exist!",
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
        vendor_master_id,
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
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
