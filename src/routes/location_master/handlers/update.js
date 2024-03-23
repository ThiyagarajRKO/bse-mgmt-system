import { LocationMaster } from "../../../controllers";

export const Update = (
  { profile_id, location_master_id, location_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await LocationMaster.Update(
        profile_id,
        location_master_id,
        location_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Location master has been updated successfully",
        });
      }

      resolve({
        message: "Location master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
