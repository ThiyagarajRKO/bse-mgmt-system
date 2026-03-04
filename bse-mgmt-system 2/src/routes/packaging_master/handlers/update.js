import { PackagingMaster } from "../../../controllers";

export const Update = (
  { profile_id, packaging_master_id, packaging_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await PackagingMaster.Update(
        profile_id,
        packaging_master_id,
        packaging_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Packaging master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Packaging master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
