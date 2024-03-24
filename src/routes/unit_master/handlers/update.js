import { UnitMaster, LocationMaster } from "../../../controllers";

export const Update = (
  { profile_id, unit_master_id, unit_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (unit_master_data?.location_master_id) {
        const location_count = await LocationMaster.Count({
          id: unit_master_data?.location_master_id,
        });

        if (location_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid location master id!",
          });
        }
      }

      const updated_data = await UnitMaster.Update(
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
