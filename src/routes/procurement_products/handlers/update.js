import { ProcurementLots, ProcurementProducts } from "../../../controllers";

export const Update = (
  { profile_id, procurement_product_id, procurement_product_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurement_lot = await ProcurementLots.CheckLot({
        id: procurement_product_data?.procurement_lot_id,
        procurement_date: procurement_product_data?.procurement_date,
        vendor_master_id: procurement_product_data?.vendor_master_id,
        unit_master_id: procurement_product_data?.unit_master_id,
      });

      if (procurement_lot > 0) {
        return reject({
          statusCode: 420,
          message: "Purchase lot combination already exist!",
        });
      }

      const updated_lot_date = await ProcurementLots.Update(
        profile_id,
        procurement_product_data?.procurement_lot_id,
        {
          procurement_date: procurement_product_data?.procurement_date,
          vendor_master_id: procurement_product_data?.vendor_master_id,
          unit_master_id: procurement_product_data?.unit_master_id,
        }
      );

      if (updated_lot_date[0] <= 0) {
        return reject({
          message: "Check purchase data",
        });
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
