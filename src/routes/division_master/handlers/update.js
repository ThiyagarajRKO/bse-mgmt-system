import { DivisionMaster } from "../../../controllers";

export const Update = (
  { profile_id, division_master_id, division_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await DivisionMaster.Update(
        profile_id,
        division_master_id,
        division_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Division master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Division master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
