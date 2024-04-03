import { ProcurementLots, VendorMaster } from "../../../controllers";

export const Create = (
  { profile_id, procurement_date, unit_master_id, vendor_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendor_count = await VendorMaster.Count({
        id: vendor_master_id,
      });

      if (vendor_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid vendor master id!",
        });
      }

      const procurement_lot = await ProcurementLots.Count({
        procurement_date: new Date(procurement_date),
        vendor_master_id,
        unit_master_id,
      });

      if (procurement_lot > 0) {
        return reject({
          message: "Procurement lot already exist!",
        });
      }

      const purchase = await ProcurementLots.Insert(profile_id, {
        procurement_date,
        unit_master_id,
        vendor_master_id,
        is_active: true,
      });

      resolve({
        message: "Procurement Lot has been inserted successfully",
        data: {
          procurement_id: purchase?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
