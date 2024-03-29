import { PackagingMaster, Procurement } from "../../../controllers";

export const Delete = (
  { profile_id, procurement_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurement = await Procurement.Delete({
        profile_id,
        id: packaging_master_id,
      });

      if (procurement > 0) {
        return resolve({
          message: "Procurement has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Procurement was not delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
