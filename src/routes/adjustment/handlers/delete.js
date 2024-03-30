import { Procurement, Adjustment } from "../../../controllers";

export const Delete = (
  { profile_id, adjustment_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const adjustment = await Adjustment.Delete({
        profile_id,
        id: adjustment_id,
      });

      if (adjustment > 0) {
        return resolve({
          message: "Adjustment has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Adjustment was not deleted",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
