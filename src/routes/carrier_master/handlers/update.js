import { CarrierMaster } from "../../../controllers";

export const Update = (
  { profile_id, carrier_master_id, carrier_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await CarrierMaster.Update(
        profile_id,
        carrier_master_id,
        carrier_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Carrier master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Carrier master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
