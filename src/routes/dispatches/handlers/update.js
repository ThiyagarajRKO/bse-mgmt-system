import { Dispatches, LocationMaster } from "../../../controllers";

export const Update = (
  { profile_id, dispatch_id, dispatch_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await Dispatches.Update(
        profile_id,
        dispatch_id,
        dispatch_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Dispatch data has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Dispatch data didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
