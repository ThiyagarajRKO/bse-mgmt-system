import { SizeMaster } from "../../../controllers";

export const Update = (
  { profile_id, size_master_id, size_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await SizeMaster.Update(
        profile_id,
        size_master_id,
        size_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Size has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Size didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
