import { PackagingMaster } from "../../../controllers";

export const Delete = (
  { profile_id, packaging_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const packaging_master = await PackagingMaster.Delete({
        profile_id,
        id: packaging_master_id,
      });

      if (packaging_master > 0) {
        return resolve({
          message: "Packaging master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Packaging master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
