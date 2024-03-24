import { DriverMaster } from "../../../controllers";

export const Update = (
  { profile_id, driver_master_id, driver_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await DriverMaster.Update(
        profile_id,
        driver_master_id,
        driver_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Driver master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Vehicle master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
