import { Dispatches, LocationMaster } from "../../../controllers";

export const Update = (
  { profile_id, unit_master_id, unit_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await Dispatches.Update(
        profile_id,
        unit_master_id,
        unit_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Unit master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Unit master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
