import { ProcurementLots } from "../../../controllers";

export const Update = (
  { profile_id, procurement_lot_id, procurement_lot_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurement_lot = await ProcurementLots.CheckLot({
        id: procurement_lot_id,
        procurement_date: procurement_lot_data?.procurement_date,
        unit_master_id: procurement_lot_data?.unit_master_id,
      });

      if (procurement_lot > 0) {
        return reject({
          statusCode: 420,
          message: "Purchase lot combination already exist!",
        });
      }

      const updated_data = await ProcurementLots.Update(
        profile_id,
        procurement_lot_id,
        procurement_lot_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Procurement lot has been updated successfully",
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
