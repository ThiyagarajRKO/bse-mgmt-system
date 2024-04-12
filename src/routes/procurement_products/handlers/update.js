import { ProcurementLots, ProcurementProducts } from "../../../controllers";
import * as ProcurementProductsHandler from "../../procurement_lots/handlers/update";

export const Update = (
  { profile_id, procurement_product_id, procurement_product_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (procurement_product_data?.procurement_lot_id) {
        const procurement_lot = await ProcurementProductsHandler.Update(
          {
            profile_id,
            procurement_lot_id: procurement_product_data?.procurement_lot_id,
            procurement_lot_data: {
              procurement_date: new Date(
                procurement_product_data?.procurement_date
              ),
              unit_master_id: procurement_product_data?.unit_master_id,
            },
          },
          session,
          fastify
        );

        if (procurement_lot[0] <= 0) {
          return reject({
            statusCode: 420,
            message: "Purchase lot combination already exist!",
          });
        }

        const procurement_product = await ProcurementProducts.CheckLot({
          id: procurement_product_id,
          procurement_lot_id: procurement_product_data?.procurement_lot_id,
          vendor_master_id: procurement_product_data?.vendor_master_id,
          product_master_id: procurement_product_data?.product_master_id,
          procurement_product_type:
            procurement_product_data?.procurement_product_type,
        });

        if (procurement_product > 0) {
          return reject({
            statusCode: 420,
            message: "Purchase product combination already exist!",
          });
        }
      }

      const updated_data = await ProcurementProducts.Update(
        profile_id,
        procurement_product_id,
        procurement_product_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Purchasing info has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Purchasing info didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
