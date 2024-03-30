import { Adjustment, LocationMaster, Procurement, ProductMaster, VendorMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    procurement_id,
    adjustment_adjusted_quantity,
    adjustment_adjusted_price,
    adjustment_reason,
    adjustment_surveyor,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurement_count = await Procurement.Count({
        id: procurement_id,
      });

      if (procurement_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid procurement id!",
        });
      }

      const adjustment = await Adjustment.Insert(profile_id, {
        procurement_id,
        adjustment_adjusted_quantity,
        adjustment_adjusted_price,
        adjustment_reason,
        adjustment_surveyor,
        is_active: true,
      });

      resolve({
        message: "Adjustment has been inserted successfully",
        data: {
          adjustment_id: Adjustment?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
