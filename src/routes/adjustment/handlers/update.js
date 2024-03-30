import { Adjustment } from "../../../controllers";

export const Update = (
  { profile_id, adjustment_id, adjustment_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await Adjustment.Update(
        profile_id,
        adjustment_id,
        adjustment_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Adjustment info has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Adjustment info didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
