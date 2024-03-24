import { LocationMaster } from "../../../controllers";

export const Delete = (
  { profile_id, location_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const location_master = await LocationMaster.Delete({
        profile_id,
        id: location_master_id,
      });

      if (location_master?.[0] > 0) {
        return resolve({
          message: "Location master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Location master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
