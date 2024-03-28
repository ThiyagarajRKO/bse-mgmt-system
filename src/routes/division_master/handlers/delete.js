import { DivisionMaster } from "../../../controllers";

export const Delete = (
  { profile_id, division_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const division_master = await DivisionMaster.Delete({
        profile_id,
        id: division_master_id,
      });

      if (division_master > 0) {
        return resolve({
          message: "Division master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Division master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
